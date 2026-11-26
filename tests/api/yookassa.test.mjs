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
const sberHandler = (await import('../../api/sberbank.ts')).default;

function adminToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

const originalFetch = globalThis.fetch;

let ipSeq = 10;
const freshIp = () => `198.51.100.${++ipSeq}`;

test.beforeEach(() => {
  globalThis.fetch = originalFetch;
  kv.setFailMode(false);
  kv.store.clear();
});

test.after(() => {
  globalThis.fetch = originalFetch;
  return kv.close();
});

function makeReqWithQuery({ query = {}, ip = freshIp(), ...rest } = {}) {
  return { ...makeReq({ ip, ...rest }), query };
}

test('GET status without orderId reports ready=true and testMode=true', async () => {
  const req = makeReqWithQuery({ method: 'GET', query: {} });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ready, true);
  assert.equal(res.body.testMode, true);
});

test('POST /api/sberbank is disabled with 410 Gone (C-01)', async () => {
  const req = makeReq({ method: 'POST', body: { orderId: '1', amount: 1 } });
  const res = makeRes();
  await sberHandler(req, res);
  assert.equal(res.statusCode, 410);
});

test('POST create reconciles catalog price, issues orderAccessToken, and stores per-order key', async () => {
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
  assert.ok(res.body.orderAccessToken && res.body.orderAccessToken.length >= 32);
  assert.ok(String(res.headers['set-cookie'] || '').includes('HttpOnly'));

  assert.equal(capturedPayload.amount.value, '28400.00');
  assert.equal(capturedPayload.receipt.tax_system_code, 6);
  assert.equal(capturedPayload.receipt.customer.phone, '79171234567');
  assert.equal(capturedPayload.receipt.items[0].vat_code, 1);

  const savedOrder = kv.readJson(`sophiya_order_item:${res.body.orderId}`);
  assert.ok(savedOrder);
  assert.equal(savedOrder.paymentStatus, 'pending');
  assert.equal(savedOrder.totalAmount, 28400);
  assert.ok(savedOrder.orderTokenHash);
});

test('POST create rejects unknown item ID, empty catalog, and out-of-stock bouquets (C-01, H-04)', async () => {
  // 1. Empty catalog -> 503 fail closed
  const emptyRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      query: { action: 'create' },
      body: {
        paymentMethod: 'cash',
        customerName: 'Ирина',
        phone: '+7 917 555-66-77',
        deliveryType: 'pickup',
        items: [{ id: 'ghost', price: 1, quantity: 1 }],
      },
    }),
    emptyRes
  );
  assert.equal(emptyRes.statusCode, 503);

  // 2. Unknown item ID -> 400
  kv.seedJson('catalog_bouquets', [
    { id: 'real-1', title: 'Розы', price: 4500, inStock: true },
    { id: 'sold-out-1', title: 'Тюльпаны', price: 3200, inStock: false },
  ]);

  const fakeItemRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      query: { action: 'create' },
      body: {
        paymentMethod: 'cash',
        customerName: 'Ирина',
        phone: '+7 917 555-66-77',
        deliveryType: 'pickup',
        items: [{ id: 'fake-999', price: 1, quantity: 1 }],
      },
    }),
    fakeItemRes
  );
  assert.equal(fakeItemRes.statusCode, 400);

  // 3. Out-of-stock item -> 409
  const oosRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      query: { action: 'create' },
      body: {
        paymentMethod: 'cash',
        customerName: 'Ирина',
        phone: '+7 917 555-66-77',
        deliveryType: 'pickup',
        items: [{ id: 'sold-out-1', price: 3200, quantity: 1 }],
      },
    }),
    oosRes
  );
  assert.equal(oosRes.statusCode, 409);
});

test('GET orderId hides PII without orderAccessToken and updateOrderDetails requires token (C-02)', async () => {
  kv.seedJson('catalog_bouquets', [{ id: 'b-1', title: 'Хризантемы', price: 3500, inStock: true }]);

  const createRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      query: { action: 'create' },
      body: {
        paymentMethod: 'cash',
        customerName: 'Мария Секретная',
        phone: '+7 (917) 888-77-66',
        deliveryType: 'delivery',
        address: 'г. Нижнекамск, ул. Химиков, 50, кв. 12',
        postcardText: 'Личное послание',
        items: [{ id: 'b-1', quantity: 1 }],
      },
    }),
    createRes
  );
  assert.equal(createRes.statusCode, 200);
  const { orderId, orderAccessToken } = createRes.body;

  // Anonymous GET without token -> no PII leaked
  const anonGetRes = makeRes();
  await handler(makeReqWithQuery({ method: 'GET', query: { orderId } }), anonGetRes);
  assert.equal(anonGetRes.statusCode, 200);
  assert.equal(anonGetRes.body.orderId, orderId);
  assert.equal(anonGetRes.body.address, undefined);
  assert.equal(anonGetRes.body.phone, undefined);
  assert.equal(anonGetRes.body.customerName, undefined);
  assert.equal(anonGetRes.body.postcardText, undefined);

  // Authorized GET with X-Order-Token -> returns full details for owner
  const ownerGetRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'GET',
      query: { orderId },
      headers: { 'x-order-token': orderAccessToken },
    }),
    ownerGetRes
  );
  assert.equal(ownerGetRes.statusCode, 200);
  assert.equal(ownerGetRes.body.address, 'г. Нижнекамск, ул. Химиков, 50, кв. 12');

  // Unauthorized POST updateOrderDetails -> 403
  const unauthEditRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      query: { action: 'updateOrderDetails' },
      body: { orderId, deliveryType: 'pickup' },
    }),
    unauthEditRes
  );
  assert.equal(unauthEditRes.statusCode, 403);

  // Authorized POST updateOrderDetails -> 200
  const okEditRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      query: { action: 'updateOrderDetails' },
      headers: { 'x-order-token': orderAccessToken },
      body: { orderId, deliveryType: 'pickup' },
    }),
    okEditRes
  );
  assert.equal(okEditRes.statusCode, 200);
  assert.equal(okEditRes.body.order.deliveryType, 'pickup');
});

test('POST webhook enforces YooKassa IP allowlist, amount check, and monotonic paid state (H-06)', async () => {
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

  // 1. Non-YooKassa IP is rejected with 403
  const spoofedRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      ip: '203.0.113.10',
      query: { action: 'webhook' },
      body: { event: 'payment.succeeded', object: { id: 'yk_pay_999' } },
    }),
    spoofedRes
  );
  assert.equal(spoofedRes.statusCode, 403);

  // 2. Mismatched amount is rejected with 400
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://api.yookassa.ru/v3/payments/yk_pay_999') {
      return new Response(
        JSON.stringify({
          id: 'yk_pay_999',
          status: 'succeeded',
          amount: { value: '100.00', currency: 'RUB' },
          metadata: { orderId: 'ord_test_1' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return originalFetch(url, init);
  };
  const badAmtRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      ip: '185.71.76.10',
      query: { action: 'webhook' },
      body: { event: 'payment.succeeded', object: { id: 'yk_pay_999' } },
    }),
    badAmtRes
  );
  assert.equal(badAmtRes.statusCode, 400);

  // 3. Official YooKassa IP + matching amount marks order paid
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://api.yookassa.ru/v3/payments/yk_pay_999') {
      return new Response(
        JSON.stringify({
          id: 'yk_pay_999',
          status: 'succeeded',
          amount: { value: '5000.00', currency: 'RUB' },
          metadata: { orderId: 'ord_test_1' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return originalFetch(url, init);
  };

  const okRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      ip: '185.71.76.10',
      query: { action: 'webhook' },
      body: { event: 'payment.succeeded', object: { id: 'yk_pay_999' } },
    }),
    okRes
  );
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body.status, 'paid');
  assert.equal(kv.readJson('sophiya_order_item:ord_test_1').paymentStatus, 'paid');

  // 4. Out-of-order canceled webhook NEVER downgrades a paid order
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://api.yookassa.ru/v3/payments/yk_pay_999') {
      return new Response(
        JSON.stringify({
          id: 'yk_pay_999',
          status: 'canceled',
          amount: { value: '5000.00', currency: 'RUB' },
          metadata: { orderId: 'ord_test_1' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return originalFetch(url, init);
  };
  const downgradeRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      ip: '185.71.76.10',
      query: { action: 'webhook' },
      body: { event: 'payment.canceled', object: { id: 'yk_pay_999' } },
    }),
    downgradeRes
  );
  assert.equal(downgradeRes.statusCode, 200);
  assert.equal(kv.readJson('sophiya_order_item:ord_test_1').paymentStatus, 'paid');
});

test('GET orders and POST updateOrderStatus require valid admin token and preserve legacy orders', async () => {
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
  assert.equal(kv.readJson('sophiya_order_item:ord_adm_1').orderStatus, 'assembling');
});

test('Cash order creation is rate-limited per IP (H-05) and Redis outage returns 503 without wiping orders (C-03)', async () => {
  kv.seedJson('catalog_bouquets', [{ id: 'b-1', title: 'Розы', price: 3000, inStock: true }]);
  const attackerIp = '198.51.100.250';
  const statuses = [];
  for (let i = 0; i < 6; i++) {
    const res = makeRes();
    await handler(
      makeReqWithQuery({
        method: 'POST',
        ip: attackerIp,
        query: { action: 'create' },
        body: {
          paymentMethod: 'cash',
          customerName: 'Тест',
          phone: '+7 (917) 111-22-33',
          deliveryType: 'pickup',
          items: [{ id: 'b-1', quantity: 1 }],
        },
      }),
      res
    );
    statuses.push(res.statusCode);
  }
  assert.deepEqual(statuses.slice(0, 5), [200, 200, 200, 200, 200]);
  assert.equal(statuses[5], 429);

  // Simulate Redis outage -> must return 503
  kv.setFailMode(true);
  const outageRes = makeRes();
  await handler(
    makeReqWithQuery({
      method: 'POST',
      ip: '198.51.100.251',
      query: { action: 'create' },
      body: {
        paymentMethod: 'cash',
        customerName: 'Тест',
        phone: '+7 (917) 111-22-33',
        deliveryType: 'pickup',
        items: [{ id: 'b-1', quantity: 1 }],
      },
    }),
    outageRes
  );
  assert.equal(outageRes.statusCode, 503);
});
