import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';
import crypto from 'crypto';
import net from 'net';
import { extractCustomerSession, buildCustomerView } from '../server/customer-auth-handler.mjs';

const SECRET_SALT = process.env.AUTH_SECRET || '';
const SECRET_OK = SECRET_SALT.length >= 32;
const ORDERS_LEGACY_STORE = 'sophiya_orders_v1';
const ORDER_ITEM_PREFIX = 'sophiya_order_item:';
const ORDER_IDS_LIST = 'sophiya_order_ids';
const PAYMENT_ORDER_PREFIX = 'sophiya_payment_order:';
const ORDERS_MIGRATED_FLAG = 'sophiya_orders_migrated_v2';
const CATALOG_STORE = 'catalog_bouquets';
const CATALOG_ALT_STORE = 'sophiya_catalog_v2';
const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments';

const MAX_ORDERS_PER_HOUR = 12;
const MAX_CASH_ORDERS_PER_HOUR = 5;
const MAX_ORDER_EDITS_PER_HOUR = 15;
const ORDER_EDIT_WINDOW_MS = 60 * 60 * 1000;

const YOOKASSA_IPV4_CIDRS: Array<[string, number]> = [
  ['185.71.76.0', 27],
  ['185.71.77.0', 27],
  ['77.75.153.0', 25],
  ['77.75.156.11', 32],
  ['77.75.156.35', 32],
  ['77.75.154.128', 25],
];

export interface StoredOrderItem {
  id?: string;
  title: string;
  quantity: number;
  price: number;
}

export interface StoredOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  createdAtMs?: number;
  orderTokenHash?: string;
  customerId?: string;
  discountPercent?: number;
  discountAmount?: number;
  customerName: string;
  phone: string;
  recipientName?: string;
  recipientPhone?: string;
  email?: string;
  deliveryType: 'delivery' | 'pickup';
  address?: string;
  deliveryDate: string;
  items: StoredOrderItem[];
  totalAmount: number;
  paymentMethod: 'yookassa' | 'cash' | 'sbp' | 'card' | 'sberpay';
  paymentStatus: 'pending' | 'paid' | 'canceled';
  orderStatus: 'new' | 'assembling' | 'in_transit' | 'delivered';
  postcardText?: string;
  comment?: string;
  photoReportUrl?: string;
  paymentId?: string;
  confirmationUrl?: string;
  isTest?: boolean;
}

function getKVClient() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return createClient({ url, token });
  }
  return kv;
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  let decoded = origin;
  try {
    decoded = decodeURI(origin);
  } catch {}

  const clean = decoded.toLowerCase().trim().replace(/\/+$/, '');
  const raw = origin.toLowerCase().trim().replace(/\/+$/, '');

  const allowedPatterns: RegExp[] = [
    /^https:\/\/(www\.)?xn----ctbjn3arftl7c8b\.xn--p1ai$/,
    /^https:\/\/(www\.)?цветы-софия\.рф$/,
  ];
  if (process.env.NODE_ENV !== 'production') {
    allowedPatterns.push(/^http:\/\/localhost(:[0-9]+)?$/, /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/);
  }

  return allowedPatterns.some((pattern) => pattern.test(clean) || pattern.test(raw));
}

function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  res.setHeader('Vary', 'Origin');
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Order-Token, Cache-Control, Pragma, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.removeHeader('X-Powered-By');
}

function getClientIp(req: VercelRequest): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
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

function ipv4ToUint32(ip: string): number | null {
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

export function isYookassaWebhookIp(rawIp: string): boolean {
  if (!rawIp) return false;
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
    const groups = cleaned.toLowerCase().split(':');
    const g0 = parseInt(groups[0] || '0', 16);
    const g1 = parseInt(groups[1] || '0', 16);
    return g0 === 0x2a02 && g1 === 0x5180;
  }
  return false;
}

function verifyToken(token: string | null | undefined): boolean {
  if (!SECRET_OK) return false;
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_SALT).update(payloadB64).digest('base64url');
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

function getAuthToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

function hashOrderToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function extractOrderTokenFromReq(req: VercelRequest, orderId: string): string {
  const headerTok = req.headers['x-order-token'];
  if (typeof headerTok === 'string' && headerTok.trim()) {
    return headerTok.trim();
  }
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader === 'string' && cookieHeader) {
    for (const pair of cookieHeader.split(';')) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const k = pair.slice(0, eq).trim();
      const v = pair.slice(eq + 1).trim();
      if (k === 'sophiya_otok') {
        try {
          const decoded = decodeURIComponent(v);
          const prefix = `${orderId}:`;
          if (decoded.startsWith(prefix)) return decoded.slice(prefix.length);
        } catch {}
      }
    }
  }
  return '';
}

function hasValidOrderAccess(req: VercelRequest, order: StoredOrder): boolean {
  if (verifyToken(getAuthToken(req))) return true;
  if (!order.orderTokenHash) return false;
  const candidate = extractOrderTokenFromReq(req, order.id);
  if (!candidate) return false;
  const candidateHash = hashOrderToken(candidate);
  if (candidateHash.length !== order.orderTokenHash.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(candidateHash, 'utf8'),
    Buffer.from(order.orderTokenHash, 'utf8')
  );
}

function stripInternalFields(order: StoredOrder): StoredOrder {
  const { orderTokenHash: _ignored, ...rest } = order;
  return rest;
}

function normalizePhoneDigits(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 10) return '7' + digits;
  return digits;
}

function formatRub(value: number): string {
  return value.toFixed(2);
}

function getYookassaAuthHeader(): { shopId: string; secretVal: string; authHeader: string } | null {
  const shopId = (process.env.YOOKASSA_SHOP_ID || '').trim();
  const secretVal = (process.env.YOOKASSA_SECRET_KEY || '').trim();
  if (!shopId || !secretVal) return null;
  const token = Buffer.from(`${shopId}:${secretVal}`).toString('base64');
  return { shopId, secretVal, authHeader: `Basic ${token}` };
}

async function checkRateLimitStrict(client: any, prefix: string, ip: string, maxPerHour: number): Promise<boolean> {
  const safeIp = ip.replace(/[^a-zA-Z0-9_.:-]/g, '_');
  const rlStore = `${prefix}_${safeIp}`;
  const count = await client.incr(rlStore);
  if (count === 1) await client.expire(rlStore, 3600);
  return count <= maxPerHour;
}

async function fetchCatalogItemsStrict(client: any): Promise<any[]> {
  const primary = await client.get(CATALOG_STORE);
  if (Array.isArray(primary) && primary.length > 0) return primary;
  const alt = await client.get(CATALOG_ALT_STORE);
  return Array.isArray(alt) ? alt : [];
}

async function ensureLegacyMigrated(client: any): Promise<void> {
  const migrated = await client.get(ORDERS_MIGRATED_FLAG);
  if (String(migrated || '') === '1') return;
  const legacy = await client.get(ORDERS_LEGACY_STORE);
  if (Array.isArray(legacy) && legacy.length > 0) {
    for (let i = legacy.length - 1; i >= 0; i--) {
      const ord = legacy[i];
      if (!ord?.id) continue;
      const existing = await client.get(`${ORDER_ITEM_PREFIX}${ord.id}`);
      if (!existing) {
        await client.set(`${ORDER_ITEM_PREFIX}${ord.id}`, ord);
        await client.lpush(ORDER_IDS_LIST, ord.id);
      }
      if (ord.paymentId) {
        await client.set(`${PAYMENT_ORDER_PREFIX}${ord.paymentId}`, ord.id);
      }
    }
    await client.ltrim(ORDER_IDS_LIST, 0, 499);
  }
  await client.set(ORDERS_MIGRATED_FLAG, '1');
}

async function getOrderByIdStrict(client: any, orderId: string): Promise<StoredOrder | null> {
  if (!orderId) return null;
  const direct = await client.get(`${ORDER_ITEM_PREFIX}${orderId}`);
  if (direct && typeof direct === 'object') return direct as StoredOrder;
  await ensureLegacyMigrated(client);
  const afterMigrate = await client.get(`${ORDER_ITEM_PREFIX}${orderId}`);
  return afterMigrate && typeof afterMigrate === 'object' ? (afterMigrate as StoredOrder) : null;
}

async function findOrderByPaymentStrict(
  client: any,
  paymentId: string,
  metadataOrderId?: string
): Promise<StoredOrder | null> {
  if (metadataOrderId) {
    const byMeta = await getOrderByIdStrict(client, String(metadataOrderId));
    if (byMeta) return byMeta;
  }
  const mappedOrderId = await client.get(`${PAYMENT_ORDER_PREFIX}${paymentId}`);
  if (typeof mappedOrderId === 'string' && mappedOrderId) {
    const found = await getOrderByIdStrict(client, mappedOrderId);
    if (found) return found;
  }
  await ensureLegacyMigrated(client);
  const ids: string[] = (await client.lrange(ORDER_IDS_LIST, 0, 299)) || [];
  for (const id of ids) {
    const item = await client.get(`${ORDER_ITEM_PREFIX}${id}`);
    if (item && typeof item === 'object' && item.paymentId === paymentId) {
      return item as StoredOrder;
    }
  }
  return null;
}

async function saveSingleOrderStrict(client: any, order: StoredOrder, isNew: boolean): Promise<void> {
  await client.set(`${ORDER_ITEM_PREFIX}${order.id}`, order);
  if (order.paymentId) {
    await client.set(`${PAYMENT_ORDER_PREFIX}${order.paymentId}`, order.id);
  }
  if (isNew) {
    await ensureLegacyMigrated(client);
    await client.lpush(ORDER_IDS_LIST, order.id);
    await client.ltrim(ORDER_IDS_LIST, 0, 499);
  }
}

async function readAllOrdersStrict(client: any): Promise<StoredOrder[]> {
  await ensureLegacyMigrated(client);
  const rawIds: string[] = (await client.lrange(ORDER_IDS_LIST, 0, 299)) || [];
  const seen = new Set<string>();
  const out: StoredOrder[] = [];
  for (const id of rawIds) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const ord = await client.get(`${ORDER_ITEM_PREFIX}${id}`);
    if (ord && typeof ord === 'object') {
      out.push(stripInternalFields(ord as StoredOrder));
    }
  }
  return out;
}

const SUBURB_FEE_RUB = 400;
const SUBURB_ADDRESS_PATTERNS: RegExp[] = [
  /красн[а-яё]*\s+ключ/i,
  /афанасов/i,
  /дмитриевк/i,
  /ильинк/i,
  /прости/i,
  /балчикл/i,
  /камск[а-яё]*\s+полян/i,
  /сухарев/i,
  /ереклин/i,
  /шингальч/i,
  /смысловк/i,
  /борок/i,
  /(?:^|[\s,])бси(?:$|[\s.,])/i,
  /тан[еэ]ко/i,
  /нкнх/i,
  /нижнекамскнефтехим/i,
  /таиф/i,
  /промзон/i,
  /(?:^|[\s,])снт(?:$|[\s.,])/i,
  /(?:^|[\s,])днт(?:$|[\s.,])/i,
  /(?:^|[\s,])пос\.?(?:$|[\s.,])/i,
  /(?:^|[\s,])пгт\.?(?:$|[\s.,])/i,
  /(?:^|[\s,])с\.\s*[а-яё]/i,
  /(?:^|[\s,])д\.\s*[а-яё]/i,
  /за\s*город/i,
];

function computeDeliveryFee(
  deliveryType: 'delivery' | 'pickup',
  address: string,
  requestedZone: unknown
): number {
  if (deliveryType === 'pickup') return 0;
  const clean = String(address || '').trim();
  if (SUBURB_ADDRESS_PATTERNS.some((re) => re.test(clean))) return SUBURB_FEE_RUB;
  if (requestedZone === 'suburb') return SUBURB_FEE_RUB;
  return 0;
}

function buildReceiptItems(items: StoredOrderItem[], discountPercent = 0, deliveryFee = 0) {
  const pct = Number.isFinite(discountPercent) && discountPercent > 0 && discountPercent <= 25 ? discountPercent : 0;
  const factor = pct > 0 ? (100 - pct) / 100 : 1;
  const rows = items.map((item) => {
    const unitPrice = Math.max(1, Math.round(item.price * factor));
    return {
      description: String(item.title || 'Букет цветов').slice(0, 128),
      quantity: `${item.quantity}.00`,
      amount: {
        value: formatRub(unitPrice),
        currency: 'RUB',
      },
      vat_code: 1,
      payment_mode: 'full_payment',
      payment_subject: 'commodity',
    };
  });
  if (deliveryFee > 0) {
    rows.push({
      description: 'Доставка (за пределы Нижнекамска)',
      quantity: '1.00',
      amount: {
        value: formatRub(deliveryFee),
        currency: 'RUB',
      },
      vat_code: 1,
      payment_mode: 'full_payment',
      payment_subject: 'service',
    });
  }
  return rows;
}

async function fetchYookassaPayment(paymentId: string, authHeader: string) {
  const res = await fetch(`${YOOKASSA_API}/${encodeURIComponent(paymentId)}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function mapYookassaStatus(ykStatus: string | undefined): StoredOrder['paymentStatus'] {
  if (ykStatus === 'succeeded') return 'paid';
  if (ykStatus === 'canceled') return 'canceled';
  return 'pending';
}

function resolveMonotonicPaymentStatus(
  currentStatus: StoredOrder['paymentStatus'],
  nextStatus: StoredOrder['paymentStatus']
): StoredOrder['paymentStatus'] {
  if (currentStatus === 'paid') return 'paid';
  if (currentStatus === 'canceled' && nextStatus === 'pending') return 'canceled';
  return nextStatus;
}

function getQueryParam(req: VercelRequest, name: string): string {
  const fromQuery = req.query?.[name];
  if (typeof fromQuery === 'string') return fromQuery;
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === 'string') return fromQuery[0];
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      return parsed.searchParams.get(name) || '';
    } catch {}
  }
  return '';
}

function setOrderAccessCookie(res: VercelResponse, orderId: string, token: string) {
  const val = encodeURIComponent(`${orderId}:${token}`);
  const secureFlag = process.env.NODE_ENV === 'development' ? '' : '; Secure';
  res.setHeader(
    'Set-Cookie',
    `sophiya_otok=${val}; Path=/api/yookassa; Max-Age=86400; HttpOnly; SameSite=Lax${secureFlag}`
  );
}

function isVisibleInAdminOrders(order: StoredOrder): boolean {
  if (!order || order.isTest) return false;
  if (order.paymentStatus === 'paid') return true;
  if (order.paymentMethod === 'cash' && order.paymentStatus !== 'canceled') return true;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const creds = getYookassaAuthHeader();
  const client = getKVClient();
  const action = getQueryParam(req, 'action');

  if (req.method === 'GET') {
    if (action === 'orders') {
      const token = getAuthToken(req);
      if (!verifyToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      try {
        const orders = (await readAllOrdersStrict(client)).filter(isVisibleInAdminOrders);
        return res.status(200).json({ orders });
      } catch {
        return res.status(503).json({ error: 'Хранилище заказов временно недоступно' });
      }
    }

    const orderId = getQueryParam(req, 'orderId').trim();
    if (!orderId) {
      return res.status(200).json({
        ready: Boolean(creds),
        testMode: Boolean(creds?.secretVal.startsWith('test_')),
      });
    }

    let order: StoredOrder | null;
    try {
      order = await getOrderByIdStrict(client, orderId);
    } catch {
      return res.status(503).json({ error: 'Хранилище заказов временно недоступно' });
    }
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

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
            await saveSingleOrderStrict(client, current, false);
          }
        }
      } catch {}
    }

    if (!hasValidOrderAccess(req, current)) {
      return res.status(200).json({
        orderId: current.id,
        orderNumber: current.orderNumber,
        paymentStatus: current.paymentStatus,
        totalAmount: current.totalAmount,
      });
    }

    return res.status(200).json({
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (action === 'webhook') {
    if (!creds) {
      return res.status(503).json({ error: 'YooKassa is not configured' });
    }
    const callerIp = getClientIp(req);
    if (!isYookassaWebhookIp(callerIp)) {
      return res.status(403).json({ error: 'Forbidden webhook origin IP' });
    }

    const body = req.body || {};
    const paymentId = String(body?.object?.id || '').trim();
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing payment object.id' });
    }

    try {
      const yk = await fetchYookassaPayment(paymentId, creds.authHeader);
      if (!yk.ok || !yk.data || yk.data.id !== paymentId) {
        return res.status(502).json({ error: 'Failed to verify payment with YooKassa' });
      }

      const order = await findOrderByPaymentStrict(client, paymentId, yk.data.metadata?.orderId);
      if (!order) {
        return res.status(200).json({ ok: true, status: 'ignored_unknown_order' });
      }

      const paidAmount = Math.round(Number(yk.data.amount?.value));
      if (yk.data.amount?.currency !== 'RUB' || paidAmount !== Number(order.totalAmount)) {
        return res.status(400).json({ error: 'Payment amount or currency mismatch' });
      }

      const nextStatus = resolveMonotonicPaymentStatus(
        order.paymentStatus,
        mapYookassaStatus(yk.data.status)
      );
      if (nextStatus !== order.paymentStatus) {
        await saveSingleOrderStrict(client, { ...order, paymentStatus: nextStatus }, false);
      }

      return res.status(200).json({ ok: true, status: nextStatus });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Webhook processing error' });
    }
  }

  if (action === 'updateOrderStatus') {
    const token = getAuthToken(req);
    if (!verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { orderId, orderStatus, photoReportUrl } = req.body || {};
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'orderId is required' });
    }
    try {
      const existing = await getOrderByIdStrict(client, orderId);
      if (!existing) {
        return res.status(404).json({ error: 'Order not found' });
      }
      const validStatuses = ['new', 'assembling', 'in_transit', 'delivered'];
      const updated: StoredOrder = {
        ...existing,
        ...(orderStatus && validStatuses.includes(orderStatus) ? { orderStatus } : {}),
        ...(typeof photoReportUrl === 'string' ? { photoReportUrl: photoReportUrl.slice(0, 1000) } : {}),
      };
      await saveSingleOrderStrict(client, updated, false);
      return res.status(200).json({ ok: true, order: stripInternalFields(updated) });
    } catch {
      return res.status(503).json({ error: 'Хранилище заказов временно недоступно' });
    }
  }

  if (action === 'updateOrderDetails') {
    const callerIp = getClientIp(req);
    try {
      const allowed = await checkRateLimitStrict(client, 'ratelimit_order_edit', callerIp, MAX_ORDER_EDITS_PER_HOUR);
      if (!allowed) {
        return res.status(429).json({ error: 'Слишком много изменений. Попробуйте позже.' });
      }
    } catch {
      return res.status(503).json({ error: 'Сервис временно недоступен' });
    }

    const body = req.body || {};
    const orderId = String(body.orderId || '').trim();
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    let existing: StoredOrder | null;
    try {
      existing = await getOrderByIdStrict(client, orderId);
    } catch {
      return res.status(503).json({ error: 'Хранилище заказов временно недоступно' });
    }
    if (!existing) return res.status(404).json({ error: 'Заказ не найден' });
    if (!hasValidOrderAccess(req, existing)) {
      return res.status(403).json({ error: 'Недостаточно прав для изменения заказа' });
    }
    if (existing.orderStatus !== 'new') {
      return res.status(409).json({
        error: 'Заказ уже передан в сборку или доставку. Для изменений свяжитесь с флористом.',
      });
    }
    if (existing.createdAtMs && Date.now() - Number(existing.createdAtMs) > ORDER_EDIT_WINDOW_MS) {
      return res.status(409).json({
        error: 'Время самостоятельного редактирования истекло. Свяжитесь с флористом.',
      });
    }

    const nextDeliveryType: 'delivery' | 'pickup' = body.deliveryType === 'pickup' ? 'pickup' : 'delivery';
    const nextAddress = String(body.address || '').trim().slice(0, 300);
    if (nextDeliveryType === 'delivery' && nextAddress.length < 5) {
      return res.status(400).json({ error: 'Укажите адрес доставки' });
    }

    const updated: StoredOrder = {
      ...existing,
      deliveryType: nextDeliveryType,
      address: nextDeliveryType === 'delivery' ? nextAddress : '',
      deliveryDate: String(body.deliveryDate || existing.deliveryDate || 'Ближайшее время').trim().slice(0, 100),
      recipientName: String(body.recipientName || existing.recipientName || existing.customerName).trim().slice(0, 120),
      recipientPhone: String(body.recipientPhone || existing.recipientPhone || existing.phone).trim().slice(0, 40),
      customerName: String(body.customerName || existing.customerName).trim().slice(0, 120),
      phone: String(body.phone || existing.phone).trim().slice(0, 40),
      postcardText: String(body.postcardText ?? existing.postcardText ?? '').trim().slice(0, 500),
      comment: String(body.comment ?? existing.comment ?? '').trim().slice(0, 500),
    };

    try {
      await saveSingleOrderStrict(client, updated, false);
      return res.status(200).json({ ok: true, order: stripInternalFields(updated) });
    } catch {
      return res.status(503).json({ error: 'Не удалось сохранить изменения заказа' });
    }
  }

  const body = req.body || {};
  if (body.company_website || body.honeypot || body.hp_token) {
    return res.status(400).json({ error: 'Bad request' });
  }

  const paymentMethod: 'yookassa' | 'cash' = body.paymentMethod === 'cash' ? 'cash' : 'yookassa';
  if (paymentMethod === 'yookassa' && !creds) {
    return res.status(503).json({
      error: 'Онлайн-оплата временно не настроена. Вы можете оформить заказ при получении.',
    });
  }

  const callerIp = getClientIp(req);
  try {
    const allowedAll = await checkRateLimitStrict(client, 'ratelimit_order_create', callerIp, MAX_ORDERS_PER_HOUR);
    if (!allowedAll) {
      return res.status(429).json({
        error: 'Слишком много заказов с одного адреса. Попробуйте чуть позже или позвоните в салон.',
      });
    }
    if (paymentMethod === 'cash') {
      const allowedCash = await checkRateLimitStrict(client, 'ratelimit_order_cash', callerIp, MAX_CASH_ORDERS_PER_HOUR);
      if (!allowedCash) {
        return res.status(429).json({
          error: 'Превышен лимит заказов с оплатой при получении. Используйте онлайн-оплату или позвоните в салон.',
        });
      }
    }
  } catch {
    return res.status(503).json({ error: 'Сервис оформления заказов временно недоступен' });
  }

  const rawItems: any[] = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) {
    return res.status(400).json({ error: 'Корзина пуста' });
  }
  if (rawItems.length > 30) {
    return res.status(400).json({ error: 'В одном заказе не более 30 позиций' });
  }

  const customerName = String(body.customerName || body.recipientName || '').trim().slice(0, 120);
  const phone = String(body.phone || body.recipientPhone || '').trim().slice(0, 40);
  const recipientName = String(body.recipientName || customerName).trim().slice(0, 120);
  const recipientPhone = String(body.recipientPhone || phone).trim().slice(0, 40);
  const email = String(body.email || '').trim().slice(0, 120);
  const deliveryType: 'delivery' | 'pickup' = body.deliveryType === 'pickup' ? 'pickup' : 'delivery';
  const address = String(body.address || '').trim().slice(0, 300);
  const deliveryDate = String(body.deliveryDate || 'Ближайшее время').trim().slice(0, 100);
  const postcardText = String(body.postcardText || '').trim().slice(0, 500);
  const comment = String(body.comment || '').trim().slice(0, 500);

  const phoneDigits = normalizePhoneDigits(phone);
  if (!customerName || !/^7\d{10}$/.test(phoneDigits)) {
    return res.status(400).json({ error: 'Укажите имя и корректный российский номер телефона (+7...)' });
  }
  if (deliveryType === 'delivery' && address.length < 5) {
    return res.status(400).json({ error: 'Укажите адрес доставки' });
  }

  let catalog: any[];
  try {
    catalog = await fetchCatalogItemsStrict(client);
  } catch {
    return res.status(503).json({ error: 'Каталог временно недоступен. Попробуйте через пару секунд.' });
  }
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return res.status(503).json({ error: 'Каталог временно недоступен. Попробуйте через пару секунд.' });
  }

  const verifiedItems: StoredOrderItem[] = [];
  for (const raw of rawItems) {
    const itemId = raw?.id !== undefined && raw?.id !== null ? String(raw.id).trim() : '';
    if (!itemId) {
      return res.status(400).json({ error: 'Товар в корзине не содержит идентификатора каталога' });
    }
    const catalogMatch = catalog.find((c: any) => String(c?.id) === itemId);
    if (!catalogMatch) {
      return res.status(400).json({ error: 'Товар не найден в актуальном каталоге. Обновите страницу.' });
    }
    if (catalogMatch.inStock === false) {
      return res.status(409).json({
        error: `Букет «${String(catalogMatch.title || 'Выбранный букет')}» закончился. Удалите его из корзины.`,
      });
    }
    const qty = Math.max(1, Math.min(50, Math.floor(Number(raw?.quantity) || 1)));
    const unitPrice = Number(catalogMatch.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ error: 'Некорректная цена товара в каталоге' });
    }
    verifiedItems.push({
      id: itemId,
      title: String(catalogMatch.title || 'Букет цветов').slice(0, 120),
      quantity: qty,
      price: Math.round(unitPrice),
    });
  }

  let customerId = '';
  let discountPercent = 0;
  const customerSession = extractCustomerSession(req);
  if (customerSession?.cid) {
    try {
      const customers = await client.get<any[]>('salon_customers');
      if (Array.isArray(customers)) {
        const matched = customers.find((c) => c && c.id === customerSession.cid);
        if (matched) {
          customerId = matched.id;
          const ordersSnapshot = await readAllOrdersStrict(client);
          const enriched = buildCustomerView(matched, ordersSnapshot);
          discountPercent = Math.min(25, Math.max(0, Number(enriched.discountPercent) || 0));
        }
      }
    } catch {}
  }

  const rawTotal = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = computeDeliveryFee(deliveryType, address, body.deliveryZone);
  const receiptItems = buildReceiptItems(verifiedItems, discountPercent, deliveryFee);
  const totalAmount = receiptItems.reduce(
    (sum, item) => sum + Math.round(Number(item.amount.value)) * parseInt(item.quantity, 10),
    0
  );
  const discountAmount = Math.max(0, rawTotal + deliveryFee - totalAmount);

  if (totalAmount <= 0) {
    return res.status(400).json({ error: 'Сумма заказа должна быть больше 0 ₽' });
  }

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
    const cashOrder: StoredOrder = {
      id: orderId,
      orderNumber,
      createdAt,
      createdAtMs,
      orderTokenHash,
      ...(customerId ? { customerId } : {}),
      ...(discountPercent > 0 ? { discountPercent, discountAmount } : {}),
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
      await saveSingleOrderStrict(client, cashOrder, true);
    } catch {
      return res.status(503).json({ error: 'Не удалось сохранить заказ. Попробуйте снова.' });
    }
    setOrderAccessCookie(res, orderId, orderAccessToken);
    return res.status(200).json({
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
  const receiptCustomer: Record<string, string> = { phone: phoneDigits };
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    receiptCustomer.email = email;
  }

  const yookassaPayload: Record<string, any> = {
    amount: {
      value: formatRub(totalAmount),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl,
    },
    description: `Заказ цветов ${orderNumber} в салоне «София»`,
    metadata: {
      orderId,
      orderNumber,
    },
  };

  if (sendReceipt) {
    yookassaPayload.receipt = {
      customer: receiptCustomer,
      tax_system_code: 6,
      items: receiptItems,
    };
  }

  try {
    const ykRes = await fetch(YOOKASSA_API, {
      method: 'POST',
      headers: {
        Authorization: creds!.authHeader,
        'Idempotence-Key': orderId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(yookassaPayload),
    });

    const ykData = await ykRes.json().catch(() => ({}));
    if (!ykRes.ok || !ykData?.id || !ykData?.confirmation?.confirmation_url) {
      return res.status(502).json({
        error: ykData?.description || 'Не удалось создать платёж в ЮKassa',
        code: ykData?.code,
      });
    }

    const newOrder: StoredOrder = {
      id: orderId,
      orderNumber,
      createdAt,
      createdAtMs,
      orderTokenHash,
      ...(customerId ? { customerId } : {}),
      ...(discountPercent > 0 ? { discountPercent, discountAmount } : {}),
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
      isTest: creds!.secretVal.startsWith('test_'),
    };

    await saveSingleOrderStrict(client, newOrder, true);
    setOrderAccessCookie(res, orderId, orderAccessToken);

    return res.status(200).json({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      orderAccessToken,
      paymentId: ykData.id,
      confirmationUrl: ykData.confirmation.confirmation_url,
      totalAmount: newOrder.totalAmount,
    });
  } catch {
    return res.status(503).json({
      error: 'Ошибка сохранения заказа или соединения с ЮKassa. Попробуйте снова.',
    });
  }
}
