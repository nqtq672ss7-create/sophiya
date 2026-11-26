import net from 'node:net';
import https from 'node:https';
import crypto from 'node:crypto';

const ORDERS_LEGACY_STORE = 'sophiya_orders_v1';
const ORDER_ITEM_PREFIX = 'sophiya_order_item:';
const ORDER_IDS_LIST = 'sophiya_order_ids';
const PAYMENT_ORDER_PREFIX = 'sophiya_payment_order:';
const ORDERS_MIGRATED_FLAG = 'sophiya_orders_migrated_v2';
const CATALOG_STORE = 'catalog_bouquets';
const CATALOG_ALT_STORE = 'sophiya_catalog_v2';

const MAX_ORDERS_PER_HOUR = 12;
const MAX_CASH_ORDERS_PER_HOUR = 5;
const MAX_ORDER_EDITS_PER_HOUR = 15;
const ORDER_EDIT_WINDOW_MS = 60 * 60 * 1000;

const YOOKASSA_IPV4_CIDRS = [
  ['185.71.76.0', 27],
  ['185.71.77.0', 27],
  ['77.75.153.0', 25],
  ['77.75.156.11', 32],
  ['77.75.156.35', 32],
  ['77.75.154.128', 25],
];

function parseRedisUrl(urlStr) {
  try {
    const u = new URL(urlStr || 'redis://127.0.0.1:6379');
    return { host: u.hostname || '127.0.0.1', port: Number(u.port || 6379) };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
}

function parseRespAt(buf, offset = 0) {
  if (offset >= buf.length) return { done: false };
  const crlf = buf.indexOf('\r\n', offset);
  if (crlf === -1) return { done: false };

  const prefix = String.fromCharCode(buf[offset]);
  const header = buf.slice(offset + 1, crlf).toString('utf8');
  const nextLine = crlf + 2;

  if (prefix === '+') return { done: true, value: header, next: nextLine };
  if (prefix === '-') return { done: true, error: header, next: nextLine };
  if (prefix === ':') return { done: true, value: Number(header), next: nextLine };
  if (prefix === '$') {
    const len = Number(header);
    if (len === -1) return { done: true, value: null, next: nextLine };
    const end = nextLine + len;
    if (buf.length < end + 2) return { done: false };
    return { done: true, value: buf.slice(nextLine, end).toString('utf8'), next: end + 2 };
  }
  if (prefix === '*') {
    const count = Number(header);
    if (count === -1) return { done: true, value: null, next: nextLine };
    const items = [];
    let cursor = nextLine;
    for (let i = 0; i < count; i++) {
      const elem = parseRespAt(buf, cursor);
      if (!elem.done) return { done: false };
      if (elem.error) return { done: true, error: elem.error, next: elem.next };
      items.push(elem.value);
      cursor = elem.next;
    }
    return { done: true, value: items, next: cursor };
  }
  return { done: true, value: null, next: nextLine };
}

function sendRespCommand(args) {
  const conn = parseRedisUrl(process.env.REDIS_URL);
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(conn.port, conn.host);
    socket.setTimeout(5000);
    const chunks = [];
    let resolved = false;

    const finish = (err, val) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {}
      if (err) reject(err);
      else resolve(val);
    };

    socket.on('timeout', () => finish(new Error('Redis timeout')));
    socket.on('error', (err) => finish(err));
    socket.on('connect', () => {
      const parts = [`*${args.length}\r\n`];
      for (const arg of args) {
        const str = typeof arg === 'string' ? arg : String(arg);
        const buf = Buffer.from(str, 'utf8');
        parts.push(`$${buf.length}\r\n`, buf, '\r\n');
      }
      for (const p of parts) socket.write(p);
    });
    socket.on('data', (chunk) => {
      chunks.push(chunk);
      const parsed = parseRespAt(Buffer.concat(chunks), 0);
      if (parsed.done) {
        if (parsed.error) finish(new Error(parsed.error));
        else finish(null, parsed.value);
      }
    });
  });
}

async function kvGetStrict(key) {
  const raw = await sendRespCommand(['GET', key]);
  if (raw === null || raw === undefined) return null;
  return JSON.parse(raw);
}

async function kvSetStrict(key, value, exSeconds) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  if (exSeconds) {
    await sendRespCommand(['SET', key, payload, 'EX', String(exSeconds)]);
  } else {
    await sendRespCommand(['SET', key, payload]);
  }
}

async function checkRateLimitStrict(bucketPrefix, ip, maxPerHour) {
  const safeIp = String(ip || 'unknown').replace(/[^a-zA-Z0-9_.:-]/g, '_');
  const rlStore = `${bucketPrefix}_${safeIp}`;
  const count = Number(await sendRespCommand(['INCR', rlStore]));
  if (count === 1) {
    await sendRespCommand(['EXPIRE', rlStore, '3600']);
  }
  return count <= maxPerHour;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function getClientIp(req) {
  const realIp = req.headers?.['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const last = String(forwarded[forwarded.length - 1] || '').trim();
    if (last) return last;
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function ipv4ToUint32(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let acc = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n < 0 || n > 255) return null;
    acc = ((acc << 8) | n) >>> 0;
  }
  return acc >>> 0;
}

export function isYookassaWebhookIp(rawIp) {
  if (!rawIp || typeof rawIp !== 'string') return false;
  const cleaned = rawIp.trim().replace(/^::ffff:/i, '');
  const ipNum = ipv4ToUint32(cleaned);
  if (ipNum !== null) {
    return YOOKASSA_IPV4_CIDRS.some(([cidrIp, prefix]) => {
      const netNum = ipv4ToUint32(cidrIp);
      if (netNum === null) return false;
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      return (ipNum & mask) >>> 0 === (netNum & mask) >>> 0;
    });
  }
  if (net.isIP(cleaned) === 6) {
    const expanded = cleaned.toLowerCase();
    const groups = expanded.split(':');
    const g0 = parseInt(groups[0] || '0', 16);
    const g1 = parseInt(groups[1] || '0', 16);
    return g0 === 0x2a02 && g1 === 0x5180;
  }
  return false;
}

function verifyAdminToken(req) {
  const secret = process.env.AUTH_SECRET || '';
  if (secret.length < 32) return false;
  const auth = req.headers?.authorization;
  if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  if (signature.length !== expectedSig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

function hashOrderToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function extractOrderTokenFromReq(req, orderId) {
  const headerTok = req.headers?.['x-order-token'];
  if (typeof headerTok === 'string' && headerTok.trim()) {
    return headerTok.trim();
  }
  const cookieHeader = req.headers?.cookie;
  if (typeof cookieHeader === 'string' && cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const k = pair.slice(0, eq).trim();
      const v = pair.slice(eq + 1).trim();
      if (k === 'sophiya_otok') {
        try {
          const decoded = decodeURIComponent(v);
          const prefix = `${orderId}:`;
          if (decoded.startsWith(prefix)) {
            return decoded.slice(prefix.length);
          }
        } catch {}
      }
    }
  }
  return '';
}

function hasValidOrderAccess(req, order) {
  if (verifyAdminToken(req)) return true;
  if (!order?.orderTokenHash || typeof order.orderTokenHash !== 'string') return false;
  const candidate = extractOrderTokenFromReq(req, order.id);
  if (!candidate) return false;
  const candidateHash = hashOrderToken(candidate);
  if (candidateHash.length !== order.orderTokenHash.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'utf8'),
    Buffer.from(order.orderTokenHash, 'utf8')
  );
}

function stripInternalOrderFields(order) {
  if (!order || typeof order !== 'object') return order;
  const { orderTokenHash: _ignored, ...rest } = order;
  return rest;
}

function normalizePhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 10) return '7' + digits;
  return digits;
}

function getYookassaCreds() {
  const shopId = (process.env.YOOKASSA_SHOP_ID || '').trim();
  const secretVal = (process.env.YOOKASSA_SECRET_KEY || '').trim();
  if (!shopId || !secretVal) return null;
  const token = Buffer.from(`${shopId}:${secretVal}`).toString('base64');
  return { shopId, secretVal, authHeader: `Basic ${token}` };
}

function mapYookassaStatus(ykStatus) {
  if (ykStatus === 'succeeded') return 'paid';
  if (ykStatus === 'canceled') return 'canceled';
  return 'pending';
}

function resolveMonotonicPaymentStatus(currentStatus, nextStatus) {
  if (currentStatus === 'paid') return 'paid';
  if (currentStatus === 'canceled' && nextStatus === 'pending') return 'canceled';
  return nextStatus;
}

function yookassaRequest(method, pathSuffix, authHeader, idempotenceKey, bodyObj) {
  return new Promise((resolve, reject) => {
    const payload = bodyObj ? JSON.stringify(bodyObj) : null;
    const headers = {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    };
    if (idempotenceKey) headers['Idempotence-Key'] = idempotenceKey;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(
      {
        hostname: 'api.yookassa.ru',
        port: 443,
        path: `/v3/payments${pathSuffix}`,
        method,
        family: 4,
        timeout: 15000,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = { raw };
          }
          const code = res.statusCode || 500;
          resolve({ ok: code >= 200 && code < 300, status: code, data });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('YooKassa API request timeout'));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function fetchYookassaPayment(paymentId, authHeader) {
  return await yookassaRequest('GET', `/${encodeURIComponent(paymentId)}`, authHeader, null, null);
}

async function ensureLegacyOrdersMigrated() {
  const already = await sendRespCommand(['GET', ORDERS_MIGRATED_FLAG]);
  if (already === '1') return;

  const legacyRaw = await kvGetStrict(ORDERS_LEGACY_STORE);
  if (Array.isArray(legacyRaw) && legacyRaw.length > 0) {
    // Push in reverse so index 0 in ORDER_IDS_LIST remains newest first
    for (let i = legacyRaw.length - 1; i >= 0; i--) {
      const ord = legacyRaw[i];
      if (!ord || !ord.id) continue;
      const existing = await sendRespCommand(['GET', `${ORDER_ITEM_PREFIX}${ord.id}`]);
      if (!existing) {
        await kvSetStrict(`${ORDER_ITEM_PREFIX}${ord.id}`, ord);
        await sendRespCommand(['LPUSH', ORDER_IDS_LIST, ord.id]);
      }
      if (ord.paymentId) {
        await kvSetStrict(`${PAYMENT_ORDER_PREFIX}${ord.paymentId}`, ord.id);
      }
    }
    await sendRespCommand(['LTRIM', ORDER_IDS_LIST, '0', '499']);
  }
  await kvSetStrict(ORDERS_MIGRATED_FLAG, '1');
}

async function getOrderByIdStrict(orderId) {
  if (!orderId) return null;
  const direct = await kvGetStrict(`${ORDER_ITEM_PREFIX}${orderId}`);
  if (direct && typeof direct === 'object') return direct;

  await ensureLegacyOrdersMigrated();
  return await kvGetStrict(`${ORDER_ITEM_PREFIX}${orderId}`);
}

async function findOrderByPaymentStrict(paymentId, metadataOrderId) {
  if (metadataOrderId) {
    const byMeta = await getOrderByIdStrict(String(metadataOrderId));
    if (byMeta) return byMeta;
  }
  if (paymentId) {
    const mappedOrderId = await sendRespCommand(['GET', `${PAYMENT_ORDER_PREFIX}${paymentId}`]);
    if (mappedOrderId) {
      const found = await getOrderByIdStrict(mappedOrderId);
      if (found) return found;
    }
  }
  await ensureLegacyOrdersMigrated();
  const ids = await sendRespCommand(['LRANGE', ORDER_IDS_LIST, '0', '299']);
  if (Array.isArray(ids) && ids.length > 0) {
    const keys = ids.map((id) => `${ORDER_ITEM_PREFIX}${id}`);
    const values = await sendRespCommand(['MGET', ...keys]);
    if (Array.isArray(values)) {
      for (const raw of values) {
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.paymentId === paymentId) return parsed;
        } catch {}
      }
    }
  }
  return null;
}

async function saveSingleOrderStrict(order, isNew = false) {
  await kvSetStrict(`${ORDER_ITEM_PREFIX}${order.id}`, order);
  if (order.paymentId) {
    await kvSetStrict(`${PAYMENT_ORDER_PREFIX}${order.paymentId}`, order.id);
  }
  if (isNew) {
    await ensureLegacyOrdersMigrated();
    await sendRespCommand(['LPUSH', ORDER_IDS_LIST, order.id]);
    await sendRespCommand(['LTRIM', ORDER_IDS_LIST, '0', '499']);
  }
}

async function readAllOrdersStrict() {
  await ensureLegacyOrdersMigrated();
  const rawIds = await sendRespCommand(['LRANGE', ORDER_IDS_LIST, '0', '299']);
  if (!Array.isArray(rawIds) || rawIds.length === 0) return [];
  const seen = new Set();
  const uniqueIds = [];
  for (const id of rawIds) {
    if (id && !seen.has(id)) {
      seen.add(id);
      uniqueIds.push(id);
    }
  }
  if (uniqueIds.length === 0) return [];
  const rawItems = await sendRespCommand(['MGET', ...uniqueIds.map((id) => `${ORDER_ITEM_PREFIX}${id}`)]);
  if (!Array.isArray(rawItems)) return [];
  const out = [];
  for (const raw of rawItems) {
    if (!raw) continue;
    try {
      out.push(stripInternalOrderFields(JSON.parse(raw)));
    } catch {}
  }
  return out;
}

async function fetchCatalogItemsStrict() {
  const primary = await kvGetStrict(CATALOG_STORE);
  if (Array.isArray(primary) && primary.length > 0) return primary;
  const alt = await kvGetStrict(CATALOG_ALT_STORE);
  return Array.isArray(alt) ? alt : [];
}

function buildReceiptItems(items) {
  return items.map((item) => {
    const unitPrice = Math.max(1, Math.round(item.price));
    return {
      description: String(item.title || 'Букет цветов').slice(0, 128),
      quantity: `${item.quantity}.00`,
      amount: { value: unitPrice.toFixed(2), currency: 'RUB' },
      vat_code: 1,
      payment_mode: 'full_payment',
      payment_subject: 'commodity',
    };
  });
}

function setOrderAccessCookie(res, orderId, token) {
  const val = encodeURIComponent(`${orderId}:${token}`);
  const secureFlag = process.env.NODE_ENV === 'development' ? '' : '; Secure';
  res.setHeader(
    'Set-Cookie',
    `sophiya_otok=${val}; Path=/api/yookassa; Max-Age=86400; HttpOnly; SameSite=Lax${secureFlag}`
  );
}

export async function handleYookassa(req, res, body, parsedUrl) {
  const creds = getYookassaCreds();
  const action = parsedUrl.searchParams.get('action') || '';

  if (req.method === 'GET') {
    if (action === 'orders') {
      if (!verifyAdminToken(req)) return sendJson(res, 401, { error: 'Unauthorized' });
      try {
        const orders = await readAllOrdersStrict();
        return sendJson(res, 200, { orders });
      } catch {
        return sendJson(res, 503, { error: 'Хранилище заказов временно недоступно' });
      }
    }

    const orderId = (parsedUrl.searchParams.get('orderId') || '').trim();
    if (!orderId) {
      return sendJson(res, 200, {
        ready: Boolean(creds),
        testMode: Boolean(creds?.secretVal.startsWith('test_')),
      });
    }

    let order;
    try {
      order = await getOrderByIdStrict(orderId);
    } catch {
      return sendJson(res, 503, { error: 'Хранилище заказов временно недоступно' });
    }
    if (!order) return sendJson(res, 404, { error: 'Заказ не найден' });

    let current = order;
    if (current.paymentStatus === 'pending' && current.paymentId && creds) {
      try {
        const yk = await fetchYookassaPayment(current.paymentId, creds.authHeader);
        if (
          yk.ok &&
          yk.data?.status &&
          yk.data?.amount?.currency === 'RUB' &&
          Math.round(Number(yk.data.amount.value)) === Number(current.totalAmount)
        ) {
          const nextStatus = resolveMonotonicPaymentStatus(
            current.paymentStatus,
            mapYookassaStatus(yk.data.status)
          );
          if (nextStatus !== current.paymentStatus) {
            current = { ...current, paymentStatus: nextStatus };
            await saveSingleOrderStrict(current, false);
          }
        }
      } catch {}
    }

    if (!hasValidOrderAccess(req, current)) {
      return sendJson(res, 200, {
        orderId: current.id,
        orderNumber: current.orderNumber,
        paymentStatus: current.paymentStatus,
        totalAmount: current.totalAmount,
      });
    }

    return sendJson(res, 200, {
      orderId: current.id,
      orderNumber: current.orderNumber,
      paymentStatus: current.paymentStatus,
      paymentMethod: current.paymentMethod,
      orderStatus: current.orderStatus,
      totalAmount: current.totalAmount,
      deliveryType: current.deliveryType,
      address: current.address || '',
      deliveryDate: current.deliveryDate || '',
      recipientName: current.recipientName || current.customerName,
      recipientPhone: current.recipientPhone || current.phone,
      customerName: current.customerName,
      phone: current.phone,
      postcardText: current.postcardText || '',
      comment: current.comment || '',
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (action === 'webhook') {
    if (!creds) return sendJson(res, 503, { error: 'YooKassa is not configured' });
    const callerIp = getClientIp(req);
    if (!isYookassaWebhookIp(callerIp)) {
      return sendJson(res, 403, { error: 'Forbidden webhook origin IP' });
    }

    const paymentId = String(body?.object?.id || '').trim();
    if (!paymentId) return sendJson(res, 400, { error: 'Missing payment object.id' });

    try {
      const yk = await fetchYookassaPayment(paymentId, creds.authHeader);
      if (!yk.ok || !yk.data || yk.data.id !== paymentId) {
        return sendJson(res, 502, { error: 'Failed to verify payment with YooKassa' });
      }

      const order = await findOrderByPaymentStrict(paymentId, yk.data.metadata?.orderId);
      if (!order) {
        return sendJson(res, 200, { ok: true, status: 'ignored_unknown_order' });
      }

      const paidAmount = Math.round(Number(yk.data.amount?.value));
      if (yk.data.amount?.currency !== 'RUB' || paidAmount !== Number(order.totalAmount)) {
        return sendJson(res, 400, { error: 'Payment amount or currency mismatch' });
      }

      const nextStatus = resolveMonotonicPaymentStatus(
        order.paymentStatus,
        mapYookassaStatus(yk.data.status)
      );
      if (nextStatus !== order.paymentStatus) {
        await saveSingleOrderStrict({ ...order, paymentStatus: nextStatus }, false);
      }
      return sendJson(res, 200, { ok: true, status: nextStatus });
    } catch (err) {
      return sendJson(res, 500, { error: err?.message || 'Webhook processing error' });
    }
  }

  if (action === 'updateOrderStatus') {
    if (!verifyAdminToken(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    const { orderId, orderStatus, photoReportUrl } = body || {};
    if (!orderId || typeof orderId !== 'string') {
      return sendJson(res, 400, { error: 'orderId is required' });
    }
    try {
      const existing = await getOrderByIdStrict(orderId);
      if (!existing) return sendJson(res, 404, { error: 'Order not found' });
      const validStatuses = ['new', 'assembling', 'in_transit', 'delivered'];
      const updated = {
        ...existing,
        ...(orderStatus && validStatuses.includes(orderStatus) ? { orderStatus } : {}),
        ...(typeof photoReportUrl === 'string' ? { photoReportUrl: photoReportUrl.slice(0, 1000) } : {}),
      };
      await saveSingleOrderStrict(updated, false);
      return sendJson(res, 200, { ok: true, order: stripInternalOrderFields(updated) });
    } catch {
      return sendJson(res, 503, { error: 'Хранилище заказов временно недоступно' });
    }
  }

  if (action === 'updateOrderDetails') {
    const callerIp = getClientIp(req);
    try {
      const allowed = await checkRateLimitStrict('ratelimit_order_edit', callerIp, MAX_ORDER_EDITS_PER_HOUR);
      if (!allowed) {
        return sendJson(res, 429, { error: 'Слишком много изменений. Попробуйте позже.' });
      }
    } catch {
      return sendJson(res, 503, { error: 'Сервис временно недоступен' });
    }

    const orderId = String(body?.orderId || '').trim();
    if (!orderId) return sendJson(res, 400, { error: 'orderId is required' });

    let existing;
    try {
      existing = await getOrderByIdStrict(orderId);
    } catch {
      return sendJson(res, 503, { error: 'Хранилище заказов временно недоступно' });
    }
    if (!existing) return sendJson(res, 404, { error: 'Заказ не найден' });
    if (!hasValidOrderAccess(req, existing)) {
      return sendJson(res, 403, { error: 'Недостаточно прав для изменения заказа' });
    }
    if (existing.orderStatus !== 'new') {
      return sendJson(res, 409, {
        error: 'Заказ уже передан в сборку или доставку. Для изменений свяжитесь с флористом.',
      });
    }
    if (existing.createdAtMs && Date.now() - Number(existing.createdAtMs) > ORDER_EDIT_WINDOW_MS) {
      return sendJson(res, 409, {
        error: 'Время самостоятельного редактирования истекло. Свяжитесь с флористом.',
      });
    }

    const nextDeliveryType = body?.deliveryType === 'pickup' ? 'pickup' : 'delivery';
    const nextAddress = String(body?.address || '').trim().slice(0, 300);
    if (nextDeliveryType === 'delivery' && nextAddress.length < 5) {
      return sendJson(res, 400, { error: 'Укажите адрес доставки' });
    }

    const nextRecipientName = String(body?.recipientName || existing.recipientName || existing.customerName).trim().slice(0, 120);
    const nextRecipientPhone = String(body?.recipientPhone || existing.recipientPhone || existing.phone).trim().slice(0, 40);
    const nextCustomerName = String(body?.customerName || existing.customerName).trim().slice(0, 120);
    const nextPhone = String(body?.phone || existing.phone).trim().slice(0, 40);
    const nextDeliveryDate = String(body?.deliveryDate || existing.deliveryDate || 'Ближайшее время').trim().slice(0, 100);
    const nextPostcard = String(body?.postcardText ?? existing.postcardText ?? '').trim().slice(0, 500);
    const nextComment = String(body?.comment ?? existing.comment ?? '').trim().slice(0, 500);

    const updated = {
      ...existing,
      deliveryType: nextDeliveryType,
      address: nextDeliveryType === 'delivery' ? nextAddress : '',
      deliveryDate: nextDeliveryDate,
      recipientName: nextRecipientName,
      recipientPhone: nextRecipientPhone,
      customerName: nextCustomerName,
      phone: nextPhone,
      postcardText: nextPostcard,
      comment: nextComment,
    };

    try {
      await saveSingleOrderStrict(updated, false);
      return sendJson(res, 200, { ok: true, order: stripInternalOrderFields(updated) });
    } catch {
      return sendJson(res, 503, { error: 'Не удалось сохранить изменения заказа' });
    }
  }

  // POST ?action=create (or default POST)
  if (body?.company_website || body?.honeypot || body?.hp_token) {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  const paymentMethod = body?.paymentMethod === 'cash' ? 'cash' : 'yookassa';
  if (paymentMethod === 'yookassa' && !creds) {
    return sendJson(res, 503, {
      error: 'Онлайн-оплата временно не настроена. Вы можете оформить заказ при получении.',
    });
  }

  const callerIp = getClientIp(req);
  try {
    const allowedAll = await checkRateLimitStrict('ratelimit_order_create', callerIp, MAX_ORDERS_PER_HOUR);
    if (!allowedAll) {
      return sendJson(res, 429, {
        error: 'Слишком много заказов с одного адреса. Попробуйте чуть позже или позвоните в салон.',
      });
    }
    if (paymentMethod === 'cash') {
      const allowedCash = await checkRateLimitStrict('ratelimit_order_cash', callerIp, MAX_CASH_ORDERS_PER_HOUR);
      if (!allowedCash) {
        return sendJson(res, 429, {
          error: 'Превышен лимит заказов с оплатой при получении. Используйте онлайн-оплату или позвоните в салон.',
        });
      }
    }
  } catch {
    return sendJson(res, 503, { error: 'Сервис оформления заказов временно недоступен' });
  }

  const rawItems = Array.isArray(body?.items) ? body.items : [];
  if (rawItems.length === 0) return sendJson(res, 400, { error: 'Корзина пуста' });
  if (rawItems.length > 30) return sendJson(res, 400, { error: 'В одном заказе не более 30 позиций' });

  const customerName = String(body?.customerName || body?.recipientName || '').trim().slice(0, 120);
  const phone = String(body?.phone || body?.recipientPhone || '').trim().slice(0, 40);
  const recipientName = String(body?.recipientName || customerName).trim().slice(0, 120);
  const recipientPhone = String(body?.recipientPhone || phone).trim().slice(0, 40);
  const email = String(body?.email || '').trim().slice(0, 120);
  const deliveryType = body?.deliveryType === 'pickup' ? 'pickup' : 'delivery';
  const address = String(body?.address || '').trim().slice(0, 300);
  const deliveryDate = String(body?.deliveryDate || 'Ближайшее время').trim().slice(0, 100);
  const postcardText = String(body?.postcardText || '').trim().slice(0, 500);
  const comment = String(body?.comment || '').trim().slice(0, 500);

  const phoneDigits = normalizePhoneDigits(phone);
  if (!customerName || !/^7\d{10}$/.test(phoneDigits)) {
    return sendJson(res, 400, { error: 'Укажите имя и корректный российский номер телефона (+7...)' });
  }
  if (deliveryType === 'delivery' && address.length < 5) {
    return sendJson(res, 400, { error: 'Укажите адрес доставки' });
  }

  let catalog;
  try {
    catalog = await fetchCatalogItemsStrict();
  } catch {
    return sendJson(res, 503, { error: 'Каталог временно недоступен. Попробуйте через пару секунд.' });
  }
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return sendJson(res, 503, { error: 'Каталог временно недоступен. Попробуйте через пару секунд.' });
  }

  const verifiedItems = [];
  for (const raw of rawItems) {
    const itemId = raw?.id !== undefined && raw?.id !== null ? String(raw.id).trim() : '';
    if (!itemId) {
      return sendJson(res, 400, { error: 'Товар в корзине не содержит идентификатора каталога' });
    }
    const catalogMatch = catalog.find((c) => String(c?.id) === itemId);
    if (!catalogMatch) {
      return sendJson(res, 400, { error: 'Товар не найден в актуальном каталоге. Обновите страницу.' });
    }
    if (catalogMatch.inStock === false) {
      return sendJson(res, 409, {
        error: `Букет «${String(catalogMatch.title || 'Выбранный букет')}» закончился. Удалите его из корзины.`,
      });
    }
    const qty = Math.max(1, Math.min(50, Math.floor(Number(raw?.quantity) || 1)));
    const unitPrice = Number(catalogMatch.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return sendJson(res, 400, { error: 'Некорректная цена товара в каталоге' });
    }
    verifiedItems.push({
      id: itemId,
      title: String(catalogMatch.title || 'Букет цветов').slice(0, 120),
      quantity: qty,
      price: Math.round(unitPrice),
    });
  }

  const receiptItems = buildReceiptItems(verifiedItems);
  const totalAmount = receiptItems.reduce(
    (sum, item) => sum + Math.round(Number(item.amount.value)) * parseInt(item.quantity, 10),
    0
  );
  if (totalAmount <= 0) return sendJson(res, 400, { error: 'Сумма заказа должна быть больше 0 ₽' });

  const orderId = `ord_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const orderNumber = `SF-${crypto.randomInt(100000, 1000000)}`;
  const orderAccessToken = crypto.randomBytes(32).toString('base64url');
  const orderTokenHash = hashOrderToken(orderAccessToken);
  const createdAtMs = Date.now();
  const createdAt = new Date(createdAtMs).toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (paymentMethod === 'cash') {
    const cashOrder = {
      id: orderId,
      orderNumber,
      createdAt,
      createdAtMs,
      orderTokenHash,
      customerName,
      phone,
      recipientName,
      recipientPhone,
      ...(email ? { email } : {}),
      deliveryType,
      ...(deliveryType === 'delivery' ? { address } : {}),
      deliveryDate,
      items: verifiedItems,
      totalAmount,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      orderStatus: 'new',
      ...(postcardText ? { postcardText } : {}),
      ...(comment ? { comment } : {}),
    };
    try {
      await saveSingleOrderStrict(cashOrder, true);
    } catch {
      return sendJson(res, 503, { error: 'Не удалось сохранить заказ. Попробуйте снова.' });
    }
    setOrderAccessCookie(res, orderId, orderAccessToken);
    return sendJson(res, 200, {
      orderId: cashOrder.id,
      orderNumber: cashOrder.orderNumber,
      orderAccessToken,
      totalAmount: cashOrder.totalAmount,
      paymentMethod: 'cash',
    });
  }

  const siteBaseUrl = (process.env.SITE_PUBLIC_URL || 'https://xn----ctbjn3arftl7c8b.xn--p1ai').replace(/\/+$/, '');
  const returnUrl = `${siteBaseUrl}/cart/?yookassa_return=1&orderId=${encodeURIComponent(orderId)}`;

  const sendReceipt = process.env.YOOKASSA_SEND_RECEIPT !== 'false';
  const receiptCustomer = { phone: phoneDigits };
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) receiptCustomer.email = email;

  const yookassaPayload = {
    amount: { value: totalAmount.toFixed(2), currency: 'RUB' },
    capture: true,
    confirmation: { type: 'redirect', return_url: returnUrl },
    description: `Заказ цветов ${orderNumber} в салоне «София»`,
    metadata: { orderId, orderNumber },
  };

  if (sendReceipt) {
    yookassaPayload.receipt = {
      customer: receiptCustomer,
      tax_system_code: 6,
      items: receiptItems,
    };
  }

  try {
    const ykRes = await yookassaRequest('POST', '', creds.authHeader, orderId, yookassaPayload);
    const ykData = ykRes.data || {};
    if (!ykRes.ok || !ykData?.id || !ykData?.confirmation?.confirmation_url) {
      return sendJson(res, 502, {
        error: ykData?.description || 'Не удалось создать платёж в ЮKassa',
        code: ykData?.code,
      });
    }

    const newOrder = {
      id: orderId,
      orderNumber,
      createdAt,
      createdAtMs,
      orderTokenHash,
      customerName,
      phone,
      recipientName,
      recipientPhone,
      ...(email ? { email } : {}),
      deliveryType,
      ...(deliveryType === 'delivery' ? { address } : {}),
      deliveryDate,
      items: verifiedItems,
      totalAmount,
      paymentMethod: 'yookassa',
      paymentStatus: 'pending',
      orderStatus: 'new',
      ...(postcardText ? { postcardText } : {}),
      ...(comment ? { comment } : {}),
      paymentId: ykData.id,
      confirmationUrl: ykData.confirmation.confirmation_url,
      isTest: creds.secretVal.startsWith('test_'),
    };

    await saveSingleOrderStrict(newOrder, true);
    setOrderAccessCookie(res, orderId, orderAccessToken);

    return sendJson(res, 200, {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      orderAccessToken,
      paymentId: ykData.id,
      confirmationUrl: ykData.confirmation.confirmation_url,
      totalAmount: newOrder.totalAmount,
    });
  } catch (err) {
    console.error('[yookassa] create error:', err);
    return sendJson(res, 503, {
      error: 'Ошибка сохранения заказа или соединения с ЮKassa. Попробуйте снова.',
    });
  }
}
