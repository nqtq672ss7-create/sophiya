import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';
import crypto from 'crypto';

const SECRET_SALT = process.env.AUTH_SECRET || '';
const SECRET_OK = SECRET_SALT.length >= 32;
const ORDERS_STORE = 'sophiya_orders_v1';
const CATALOG_STORE = 'catalog_bouquets';
const CATALOG_ALT_STORE = 'sophiya_catalog_v2';
const CUSTOMERS_STORE = 'salon_customers';
const YOOKASSA_API = 'https://api.yookassa.ru/v3/payments';

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
  customerName: string;
  phone: string;
  email?: string;
  deliveryType: 'delivery'|'pickup';
  address?: string;
  deliveryDate: string;
  items: StoredOrderItem[];
  totalAmount: number;
  paymentMethod: 'yookassa'|'sbp'|'card'|'sberpay';
  paymentStatus: 'pending'|'paid'|'canceled';
  orderStatus: 'new'|'assembling'|'in_transit'|'delivered';
  postcardText?: string;
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

function isAllowedOrigin(origin: string|undefined): boolean {
  if (!origin) return true;
  let decoded = origin;
  try {
    decoded = decodeURI(origin);
  } catch {}

  const clean = decoded.toLowerCase().trim().replace(/\/+$/, '');
  const raw = origin.toLowerCase().trim().replace(/\/+$/, '');

  const allowedPatterns = [
    /^https?:\/\/(www\.)?xn----ctbjn3arftl7c8b\.xn--p1ai(:[0-9]+)?$/,
    /^https?:\/\/(www\.)?цветы-софия\.рф(:[0-9]+)?$/,
    /^https?:\/\/sitesophiya\.vercel\.app(:[0-9]+)?$/,
    /^https?:\/\/([a-zA-Z0-9_-]+\.)?github\.io(:[0-9]+)?$/,
    /^https?:\/\/localhost(:[0-9]+)?$/,
    /^https?:\/\/127\.0\.0\.1(:[0-9]+)?$/,
  ];

  return allowedPatterns.some((pattern) => pattern.test(clean) || pattern.test(raw));
}

function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string|undefined;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

function verifyToken(token: string|null|undefined): boolean {
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

function getAuthToken(req: VercelRequest): string|null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

function normalizePhoneDigits(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '7' + digits;
  }
  return digits;
}

function formatRub(value: number): string {
  return value.toFixed(2);
}

function getYookassaAuthHeader(): { shopId: string; secretKey: string; authHeader: string }|null {
  const shopId = (process.env.YOOKASSA_SHOP_ID || '').trim();
  const secretKey = (process.env.YOOKASSA_SECRET_KEY || '').trim();
  if (!shopId || !secretKey) return null;
  const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  return { shopId, secretKey, authHeader: `Basic ${token}` };
}

async function fetchCatalogItems(client: any): Promise<any[]> {
  try {
    const primary = await client.get(CATALOG_STORE);
    if (Array.isArray(primary) && primary.length > 0) return primary;
    const alt = await client.get(CATALOG_ALT_STORE);
    if (Array.isArray(alt) && alt.length > 0) return alt;
  } catch {}
  return [];
}

async function fetchCustomerDiscount(client: any, phone: string): Promise<number> {
  const targetDigits = normalizePhoneDigits(phone);
  if (targetDigits.length !== 11) return 0;
  try {
    const list = await client.get(CUSTOMERS_STORE);
    if (!Array.isArray(list)) return 0;
    const found = list.find((c: any) => normalizePhoneDigits(c?.phone || '') === targetDigits);
    const pct = Number(found?.discountPercent || 0);
    if (Number.isFinite(pct) && pct > 0 && pct <= 25) {
      return pct;
    }
  } catch {}
  return 0;
}

async function readOrders(client: any): Promise<StoredOrder[]> {
  try {
    const raw = await client.get(ORDERS_STORE);
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

async function saveOrders(client: any, orders: StoredOrder[]): Promise<void> {
  // Keep latest 300 orders to keep KV payload compact
  await client.set(ORDERS_STORE, orders.slice(0, 300));
}

function buildReceiptItems(items: StoredOrderItem[], discountPercent: number) {
  const factor = discountPercent > 0 ? (100 - discountPercent) / 100 : 1;
  return items.map((item) => {
    const unitPrice = Math.max(1, Math.round(item.price * factor));
    return {
      description: String(item.title || 'Букет цветов').slice(0, 128),
      quantity: `${item.quantity}.00`,
      amount: {
        value: formatRub(unitPrice),
        currency: 'RUB',
      },
      vat_code: 1, // Без НДС (ИП на Патенте)
      payment_mode: 'full_payment',
      payment_subject: 'commodity',
    };
  });
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

function mapYookassaStatus(ykStatus: string|undefined): StoredOrder['paymentStatus'] {
  if (ykStatus === 'succeeded') return 'paid';
  if (ykStatus === 'canceled') return 'canceled';
  return 'pending';
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const creds = getYookassaAuthHeader();
  const client = getKVClient();
  const action = getQueryParam(req, 'action');

  // 1. GET: check order status OR list orders for admin
  if (req.method === 'GET') {
    if (action === 'orders') {
      const token = getAuthToken(req);
      if (!verifyToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const orders = await readOrders(client);
      return res.status(200).json({ orders });
    }

    const orderId = getQueryParam(req, 'orderId').trim();
    if (!orderId) {
      return res.status(200).json({
        ready: Boolean(creds),
        testMode: Boolean(creds?.secretKey.startsWith('test_')),
      });
    }

    const orders = await readOrders(client);
    const orderIdx = orders.findIndex((o) => o.id === orderId);
    if (orderIdx === -1) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const order = orders[orderIdx];
    if (order.paymentStatus === 'pending' && order.paymentId && creds) {
      try {
        const yk = await fetchYookassaPayment(order.paymentId, creds.authHeader);
        if (yk.ok && yk.data?.status) {
          const mapped = mapYookassaStatus(yk.data.status);
          if (mapped !== order.paymentStatus) {
            orders[orderIdx] = { ...order, paymentStatus: mapped };
            await saveOrders(client, orders);
          }
        }
      } catch {}
    }

    const current = orders[orderIdx];
    return res.status(200).json({
      orderId: current.id,
      orderNumber: current.orderNumber,
      paymentStatus: current.paymentStatus,
      totalAmount: current.totalAmount,
      deliveryType: current.deliveryType,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. POST ?action=webhook: YooKassa HTTP notification
  if (action === 'webhook') {
    if (!creds) {
      return res.status(503).json({ error: 'YooKassa is not configured' });
    }
    const body = req.body || {};
    const paymentId = String(body?.object?.id || '').trim();
    if (!paymentId) {
      return res.status(400).json({ error: 'Missing payment object.id' });
    }

    try {
      // Always verify payment state directly with YooKassa API instead of trusting webhook body
      const yk = await fetchYookassaPayment(paymentId, creds.authHeader);
      if (!yk.ok || !yk.data) {
        return res.status(502).json({ error: 'Failed to verify payment with YooKassa' });
      }

      const mappedStatus = mapYookassaStatus(yk.data.status);
      const orders = await readOrders(client);
      const idx = orders.findIndex(
        (o) => o.paymentId === paymentId || (yk.data.metadata?.orderId && o.id === yk.data.metadata.orderId)
      );
      if (idx !== -1) {
        orders[idx] = { ...orders[idx], paymentStatus: mappedStatus };
        await saveOrders(client, orders);
      }

      return res.status(200).json({ ok: true, status: mappedStatus });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Webhook processing error' });
    }
  }

  // 3. POST ?action=updateOrderStatus: admin order management
  if (action === 'updateOrderStatus') {
    const token = getAuthToken(req);
    if (!verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { orderId, orderStatus, photoReportUrl } = req.body || {};
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'orderId is required' });
    }
    const orders = await readOrders(client);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const validStatuses = ['new', 'assembling', 'in_transit', 'delivered'];
    orders[idx] = {
      ...orders[idx],
      ...(orderStatus && validStatuses.includes(orderStatus) ? { orderStatus } : {}),
      ...(typeof photoReportUrl === 'string' ? { photoReportUrl } : {}),
    };
    await saveOrders(client, orders);
    return res.status(200).json({ ok: true, order: orders[idx] });
  }

  // 4. POST ?action=create: create YooKassa payment and store order
  if (!creds) {
    return res.status(503).json({
      error: 'Онлайн-оплата временно не настроена. Вы можете оформить заказ через MAX.',
    });
  }

  const body = req.body || {};
  const rawItems: any[] = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0) {
    return res.status(400).json({ error: 'Корзина пуста' });
  }

  const customerName = String(body.customerName || '').trim().slice(0, 120);
  const phone = String(body.phone || '').trim().slice(0, 40);
  const email = String(body.email || '').trim().slice(0, 120);
  const deliveryType: 'delivery'|'pickup' = body.deliveryType === 'pickup' ? 'pickup' : 'delivery';
  const address = String(body.address || '').trim().slice(0, 300);
  const deliveryDate = String(body.deliveryDate || 'Ближайшее время').trim().slice(0, 80);
  const postcardText = String(body.postcardText || '').trim().slice(0, 500);

  if (!customerName || normalizePhoneDigits(phone).length < 10) {
    return res.status(400).json({ error: 'Укажите имя и корректный номер телефона' });
  }
  if (deliveryType === 'delivery' && address.length < 5) {
    return res.status(400).json({ error: 'Укажите адрес доставки' });
  }

  // Reconcile item prices against server catalog to prevent client-side price tampering
  const catalog = await fetchCatalogItems(client);
  const verifiedItems: StoredOrderItem[] = [];

  for (const raw of rawItems.slice(0, 30)) {
    const qty = Math.max(1, Math.min(50, Math.floor(Number(raw?.quantity) || 1)));
    const catalogMatch = catalog.find((c: any) => String(c?.id) === String(raw?.id));
    const unitPrice = catalogMatch
      ? Number(catalogMatch.price)
      : Number(raw?.price);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ error: 'Некорректная цена товара в корзине' });
    }

    verifiedItems.push({
      id: raw?.id ? String(raw.id) : undefined,
      title: String(catalogMatch?.title || raw?.title || 'Букет цветов').slice(0, 120),
      quantity: qty,
      price: Math.round(unitPrice),
    });
  }

  const discountPercent = await fetchCustomerDiscount(client, phone);
  const receiptItems = buildReceiptItems(verifiedItems, discountPercent);
  const totalAmount = receiptItems.reduce(
    (sum, item) => sum + Math.round(Number(item.amount.value)) * parseInt(item.quantity, 10),
    0
  );

  if (totalAmount <= 0) {
    return res.status(400).json({ error: 'Сумма заказа должна быть больше 0 ₽' });
  }

  const orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const orderNumber = `SF-${Math.floor(100000 + Math.random() * 900000)}`;
  const siteBaseUrl = (process.env.SITE_PUBLIC_URL || 'https://xn----ctbjn3arftl7c8b.xn--p1ai').replace(/\/+$/, '');
  const returnUrl = `${siteBaseUrl}/cart/?yookassa_return=1&orderId=${encodeURIComponent(orderId)}`;

  const sendReceipt = process.env.YOOKASSA_SEND_RECEIPT !== 'false';
  const phoneDigits = normalizePhoneDigits(phone);
  const receiptCustomer: Record<string, string> = {};
  if (phoneDigits.length === 11) {
    receiptCustomer.phone = phoneDigits;
  }
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

  if (sendReceipt && (receiptCustomer.phone || receiptCustomer.email)) {
    yookassaPayload.receipt = {
      customer: receiptCustomer,
      tax_system_code: 6, // Патентная система налогообложения
      items: receiptItems,
    };
  }

  try {
    const ykRes = await fetch(YOOKASSA_API, {
      method: 'POST',
      headers: {
        Authorization: creds.authHeader,
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

    const existingOrders = await readOrders(client);
    await saveOrders(client, [newOrder, ...existingOrders]);

    return res.status(200).json({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      paymentId: ykData.id,
      confirmationUrl: ykData.confirmation.confirmation_url,
      totalAmount: newOrder.totalAmount,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Ошибка соединения с платёжным шлюзом ЮKassa',
      details: err?.message,
    });
  }
}
