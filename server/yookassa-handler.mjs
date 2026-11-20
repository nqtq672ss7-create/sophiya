import net from 'node:net';
import https from 'node:https';
import crypto from 'node:crypto';

const ORDERS_STORE = 'sophiya_orders_v1';
const CATALOG_STORE = 'catalog_bouquets';
const CATALOG_ALT_STORE = 'sophiya_catalog_v2';
const CUSTOMERS_STORE = 'salon_customers';
const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments';

function parseRedisUrl(urlStr) {
  try {
    const u = new URL(urlStr || 'redis://127.0.0.1:6379');
    return { host: u.hostname || '127.0.0.1', port: Number(u.port || 6379) };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
}

function tryParseResp(buf) {
  if (buf.length < 3) return { done: false };
  const prefix = String.fromCharCode(buf[0]);
  const crlf = buf.indexOf('\r\n');
  if (crlf === -1) return { done: false };

  if (prefix === '+') return { done: true, value: buf.slice(1, crlf).toString('utf8') };
  if (prefix === '-') return { done: true, error: buf.slice(1, crlf).toString('utf8') };
  if (prefix === ':') return { done: true, value: Number(buf.slice(1, crlf).toString('utf8')) };
  if (prefix === '$') {
    const len = Number(buf.slice(1, crlf).toString('utf8'));
    if (len === -1) return { done: true, value: null };
    const start = crlf + 2;
    const end = start + len;
    if (buf.length < end + 2) return { done: false };
    return { done: true, value: buf.slice(start, end).toString('utf8') };
  }
  return { done: true, value: null };
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
      const parsed = tryParseResp(Buffer.concat(chunks));
      if (parsed.done) {
        if (parsed.error) finish(new Error(parsed.error));
        else finish(null, parsed.value);
      }
    });
  });
}

async function kvGetJson(key) {
  try {
    const raw = await sendRespCommand(['GET', key]);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function kvSetJson(key, value) {
  await sendRespCommand(['SET', key, JSON.stringify(value)]);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
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

function normalizePhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 10) return '7' + digits;
  return digits;
}

function getYookassaCreds() {
  const shopId = (process.env.YOOKASSA_SHOP_ID || '').trim();
  const secretKey = (process.env.YOOKASSA_SECRET_KEY || '').trim();
  if (!shopId || !secretKey) return null;
  const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  return { shopId, secretKey, authHeader: `Basic ${token}` };
}

function mapYookassaStatus(ykStatus) {
  if (ykStatus === 'succeeded') return 'paid';
  if (ykStatus === 'canceled') return 'canceled';
  return 'pending';
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

async function readOrders() {
  const data = await kvGetJson(ORDERS_STORE);
  return Array.isArray(data) ? data : [];
}

async function saveOrders(orders) {
  await kvSetJson(ORDERS_STORE, orders.slice(0, 300));
}

async function fetchCatalogItems() {
  const primary = await kvGetJson(CATALOG_STORE);
  if (Array.isArray(primary) && primary.length > 0) return primary;
  const alt = await kvGetJson(CATALOG_ALT_STORE);
  return Array.isArray(alt) ? alt : [];
}

async function fetchCustomerDiscount(phone) {
  const targetDigits = normalizePhoneDigits(phone);
  if (targetDigits.length !== 11) return 0;
  const list = await kvGetJson(CUSTOMERS_STORE);
  if (!Array.isArray(list)) return 0;
  const found = list.find((c) => normalizePhoneDigits(c?.phone || '') === targetDigits);
  const pct = Number(found?.discountPercent || 0);
  return Number.isFinite(pct) && pct > 0 && pct <= 25 ? pct : 0;
}

function buildReceiptItems(items, discountPercent) {
  const factor = discountPercent > 0 ? (100 - discountPercent) / 100 : 1;
  return items.map((item) => {
    const unitPrice = Math.max(1, Math.round(item.price * factor));
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

export async function handleYookassa(req, res, body, parsedUrl) {
  const creds = getYookassaCreds();
  const action = parsedUrl.searchParams.get('action') || '';

  if (req.method === 'GET') {
    if (action === 'orders') {
      if (!verifyAdminToken(req)) return sendJson(res, 401, { error: 'Unauthorized' });
      const orders = await readOrders();
      return sendJson(res, 200, { orders });
    }

    const orderId = (parsedUrl.searchParams.get('orderId') || '').trim();
    if (!orderId) {
      return sendJson(res, 200, {
        ready: Boolean(creds),
        testMode: Boolean(creds?.secretKey.startsWith('test_')),
      });
    }

    const orders = await readOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return sendJson(res, 404, { error: 'Заказ не найден' });

    const order = orders[idx];
    if (order.paymentStatus === 'pending' && order.paymentId && creds) {
      try {
        const yk = await fetchYookassaPayment(order.paymentId, creds.authHeader);
        if (yk.ok && yk.data?.status) {
          const mapped = mapYookassaStatus(yk.data.status);
          if (mapped !== order.paymentStatus) {
            orders[idx] = { ...order, paymentStatus: mapped };
            await saveOrders(orders);
          }
        }
      } catch {}
    }

    const current = orders[idx];
    return sendJson(res, 200, {
      orderId: current.id,
      orderNumber: current.orderNumber,
      paymentStatus: current.paymentStatus,
      totalAmount: current.totalAmount,
      deliveryType: current.deliveryType,
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (action === 'webhook') {
    if (!creds) return sendJson(res, 503, { error: 'YooKassa is not configured' });
    const paymentId = String(body?.object?.id || '').trim();
    if (!paymentId) return sendJson(res, 400, { error: 'Missing payment object.id' });

    try {
      const yk = await fetchYookassaPayment(paymentId, creds.authHeader);
      if (!yk.ok || !yk.data) return sendJson(res, 502, { error: 'Failed to verify payment with YooKassa' });
      const mappedStatus = mapYookassaStatus(yk.data.status);
      const orders = await readOrders();
      const idx = orders.findIndex(
        (o) => o.paymentId === paymentId || (yk.data.metadata?.orderId && o.id === yk.data.metadata.orderId)
      );
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], paymentStatus: mappedStatus };
        await saveOrders(orders);
      }
      return sendJson(res, 200, { ok: true, status: mappedStatus });
    } catch (err) {
      return sendJson(res, 500, { error: err?.message || 'Webhook processing error' });
    }
  }

  if (action === 'updateOrderStatus') {
    if (!verifyAdminToken(req)) return sendJson(res, 401, { error: 'Unauthorized' });
    const { orderId, orderStatus, photoReportUrl } = body || {};
    if (!orderId || typeof orderId !== 'string') return sendJson(res, 400, { error: 'orderId is required' });
    const orders = await readOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return sendJson(res, 404, { error: 'Order not found' });
    const validStatuses = ['new', 'assembling', 'in_transit', 'delivered'];
    orders[idx] = {
      ...orders[idx],
      ...(orderStatus && validStatuses.includes(orderStatus) ? { orderStatus } : {}),
      ...(typeof photoReportUrl === 'string' ? { photoReportUrl } : {}),
    };
    await saveOrders(orders);
    return sendJson(res, 200, { ok: true, order: orders[idx] });
  }

  if (!creds) {
    return sendJson(res, 503, {
      error: 'Онлайн-оплата временно не настроена. Вы можете оформить заказ через MAX.',
    });
  }

  const rawItems = Array.isArray(body?.items) ? body.items : [];
  if (rawItems.length === 0) return sendJson(res, 400, { error: 'Корзина пуста' });

  const customerName = String(body?.customerName || '').trim().slice(0, 120);
  const phone = String(body?.phone || '').trim().slice(0, 40);
  const email = String(body?.email || '').trim().slice(0, 120);
  const deliveryType = body?.deliveryType === 'pickup' ? 'pickup' : 'delivery';
  const address = String(body?.address || '').trim().slice(0, 300);
  const deliveryDate = String(body?.deliveryDate || 'Ближайшее время').trim().slice(0, 80);
  const postcardText = String(body?.postcardText || '').trim().slice(0, 500);

  if (!customerName || normalizePhoneDigits(phone).length < 10) {
    return sendJson(res, 400, { error: 'Укажите имя и корректный номер телефона' });
  }
  if (deliveryType === 'delivery' && address.length < 5) {
    return sendJson(res, 400, { error: 'Укажите адрес доставки' });
  }

  const catalog = await fetchCatalogItems();
  const verifiedItems = [];
  for (const raw of rawItems.slice(0, 30)) {
    const qty = Math.max(1, Math.min(50, Math.floor(Number(raw?.quantity) || 1)));
    const catalogMatch = catalog.find((c) => String(c?.id) === String(raw?.id));
    const unitPrice = catalogMatch ? Number(catalogMatch.price) : Number(raw?.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return sendJson(res, 400, { error: 'Некорректная цена товара в корзине' });
    }
    verifiedItems.push({
      id: raw?.id ? String(raw.id) : undefined,
      title: String(catalogMatch?.title || raw?.title || 'Букет цветов').slice(0, 120),
      quantity: qty,
      price: Math.round(unitPrice),
    });
  }

  const discountPercent = await fetchCustomerDiscount(phone);
  const receiptItems = buildReceiptItems(verifiedItems, discountPercent);
  const totalAmount = receiptItems.reduce(
    (sum, item) => sum + Math.round(Number(item.amount.value)) * parseInt(item.quantity, 10),
    0
  );
  if (totalAmount <= 0) return sendJson(res, 400, { error: 'Сумма заказа должна быть больше 0 ₽' });

  const orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const orderNumber = `SF-${Math.floor(100000 + Math.random() * 900000)}`;
  const siteBaseUrl = (process.env.SITE_PUBLIC_URL || 'https://xn----ctbjn3arftl7c8b.xn--p1ai').replace(/\/+$/, '');
  const returnUrl = `${siteBaseUrl}/cart/?yookassa_return=1&orderId=${encodeURIComponent(orderId)}`;

  const sendReceipt = process.env.YOOKASSA_SEND_RECEIPT !== 'false';
  const phoneDigits = normalizePhoneDigits(phone);
  const receiptCustomer = {};
  if (phoneDigits.length === 11) receiptCustomer.phone = phoneDigits;
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) receiptCustomer.email = email;

  const yookassaPayload = {
    amount: { value: totalAmount.toFixed(2), currency: 'RUB' },
    capture: true,
    confirmation: { type: 'redirect', return_url: returnUrl },
    description: `Заказ цветов ${orderNumber} в салоне «София»`,
    metadata: { orderId, orderNumber },
  };

  if (sendReceipt && (receiptCustomer.phone || receiptCustomer.email)) {
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
      createdAt: new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      customerName,
      phone,
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
      paymentId: ykData.id,
      confirmationUrl: ykData.confirmation.confirmation_url,
      isTest: creds.secretKey.startsWith('test_'),
    };

    const existingOrders = await readOrders();
    await saveOrders([newOrder, ...existingOrders]);

    return sendJson(res, 200, {
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      paymentId: ykData.id,
      confirmationUrl: ykData.confirmation.confirmation_url,
      totalAmount: newOrder.totalAmount,
    });
  } catch (err) {
    console.error('[yookassa] create error:', err);
    return sendJson(res, 500, {
      error: `Ошибка соединения с ЮKassa: ${err?.message || 'network error'}`,
      details: err?.message,
    });
  }
}
