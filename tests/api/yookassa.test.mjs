import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { startFakeKv, makeReq, makeRes } from './helpers.mjs';

const kv = await startFakeKv();
const SECRET = 's'.repeat(40);
process.env.KV_REST_API_URL = kv.url;
process.env.KV_REST_API_TOKEN = 'test-kv-token';
process.env.AUTH_SECRET = SECRET;
process.env.YOOKASSA_SHOP_ID = '1359079';
process.env.YOOKASSA_SECRET_KEY = 'test_dummy_secret_key';

const handler = (await import('../../api/yookassa.ts')).default;

function adminToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

const originalFetch = globalThis.fetch;

test.beforeEach(() => {
  globalThis.fetch = originalFetch;
  kv.store.clear();
});

test.after(() => {
  globalThis.fetch = originalFetch;
  return kv.close();
});

function makeReqWithQuery({ query = {}, ...rest } = {}) {
  return { ...makeReq(rest), query };
}

test('GET status without orderId reports ready=true and testMode=true', async () => {
  const req = makeReqWithQuery({ method: 'GET', query: {} });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ready, true);
  assert.equal(res.body.testMode, true);
});

test('POST create reconciles catalog price, sends Patent receipt (tax_system_code=6), and saves order', async () => {
  kv.seedJson('catalog_bouquets', [
    { id: 'b-1', title: 'Пионы Blanche', price: 14200, inStock: true },
  ]);

  let capturedPayload = null;
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://api.yookassa.ru/v3/payments')) {
      capturedPayload = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          id: 'yk_pay_123',
          status: 'pending',
          confirmation: { confirmation_url: 'https://yoomoney.ru/checkout/payments/v2/contract?orderId=yk_pay_123' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return originalFetch(url, init);
  };

  const req = makeReqWithQuery({
    method: 'POST',
    query: { action: 'create' },
    body: {
      customerName: 'Алина',
      phone: '+7 (917) 123-45-67',
      deliveryType: 'delivery',
      address: 'г. Нижнекамск, пр. Мира, 10',
      items: [{ id: 'b-1', title: 'Подделка', price: 1, quantity: 2 }],
    },
  });
  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.totalAmount, 28400);
  assert.equal(res.body.paymentId, 'yk_pay_123');
  assert.ok(res.body.confirmationUrl.includes('yoomoney.ru'));

  assert.equal(capturedPayload.amount.value, '28400.00');
  assert.equal(capturedPayload.receipt.tax_system_code, 6);
  assert.equal(capturedPayload.receipt.customer.phone, '79171234567');
  assert.equal(capturedPayload.receipt.items[0].vat_code, 1);

  const savedOrders = kv.readJson('sophiya_orders_v1');
  assert.equal(savedOrders.length, 1);
  assert.equal(savedOrders[0].paymentStatus, 'pending');
  assert.equal(savedOrders[0].totalAmount, 28400);
});

test('POST webhook verifies payment with YooKassa API and marks order paid', async () => {
  kv.seedJson('sophiya_orders_v1', [
    {
      id: 'ord_test_1',
      orderNumber: 'SF-111222',
      createdAt: '21.11, 01:25',
      customerName: 'Алина',
      phone: '+7 917 123-45-67',
      deliveryType: 'pickup',
      deliveryDate: 'Сегодня',
      items: [{ title: 'Пионы', quantity: 1, price: 5000 }],
      totalAmount: 5000,
      paymentMethod: 'yookassa',
      paymentStatus: 'pending',
      orderStatus: 'new',
      paymentId: 'yk_pay_999',
    },
  ]);

  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://api.yookassa.ru/v3/payments/yk_pay_999') {
      return new Response(
        JSON.stringify({ id: 'yk_pay_999', status: 'succeeded', metadata: { orderId: 'ord_test_1' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return originalFetch(url, init);
  };

  const req = makeReqWithQuery({
    method: 'POST',
    query: { action: 'webhook' },
    body: { event: 'payment.succeeded', object: { id: 'yk_pay_999' } },
  });
  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, 'paid');
  const savedOrders = kv.readJson('sophiya_orders_v1');
  assert.equal(savedOrders[0].paymentStatus, 'paid');
});

test('GET orders and POST updateOrderStatus require valid admin token', async () => {
  kv.seedJson('sophiya_orders_v1', [
    {
      id: 'ord_adm_1',
      orderNumber: 'SF-333444',
      createdAt: '21.11, 01:25',
      customerName: 'Иван',
      phone: '+7 917 000-00-00',
      deliveryType: 'pickup',
      deliveryDate: 'Завтра',
      items: [{ title: 'Розы', quantity: 1, price: 3000 }],
      totalAmount: 3000,
      paymentMethod: 'yookassa',
      paymentStatus: 'paid',
      orderStatus: 'new',
    },
  ]);

  const unauthRes = makeRes();
  await handler(makeReqWithQuery({ method: 'GET', query: { action: 'orders' } }), unauthRes);
  assert.equal(unauthRes.statusCode, 401);

  const authRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'GET',
      query: { action: 'orders' },
      headers: { authorization: `Bearer ${adminToken()}` },
    }),
    authRes
  );
  assert.equal(authRes.statusCode, 200);
  assert.equal(authRes.body.orders.length, 1);

  const updRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      query: { action: 'updateOrderStatus' },
      headers: { authorization: `Bearer ${adminToken()}` },
      body: { orderId: 'ord_adm_1', orderStatus: 'assembling' },
    }),
    updRes
  );
  assert.equal(updRes.statusCode, 200);
  assert.equal(kv.readJson('sophiya_orders_v1')[0].orderStatus, 'assembling');
});
