import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { startFakeKv, makeReq, makeRes } from './helpers.mjs';

const kv = await startFakeKv();
const SECRET = 's'.repeat(40);
process.env.KV_REST_API_URL = kv.url;
process.env.KV_REST_API_TOKEN = 'test-kv-token';
process.env.AUTH_SECRET = SECRET;
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_CHAT_ID;

const handler = (await import('../../api/customers.ts')).default;

function adminToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

let ipCounter = 0;
const nextIp = () => '192.0.2.' + String(++ipCounter);

async function post(body, { token, ip = nextIp() } = {}) {
  const res = makeRes();
  const headers = token ? { authorization: 'Bearer ' + token } : {};
  await handler(makeReq({ method: 'POST', body, headers, ip }), res);
  return res;
}

const base = {
  id: 'cust_new_1',
  phone: '+7 (900) 111-22-33',
  firstName: 'Анна',
  lastName: 'Иванова',
};

test.after(() => kv.close());

test('GET without admin token is rejected', async () => {
  const res = makeRes();
  await handler(makeReq({ method: 'GET' }), res);
  assert.equal(res.statusCode, 401);
});

test('public registration stores the customer with zeroed loyalty fields', async () => {
  const res = await post({
    ...base,
    totalSpent: 999999,
    ordersCount: 50,
    discountPercent: 10,
    tier: 'Платиновый',
    orders: [{ id: 'x' }],
    isAdmin: true,
  });
  assert.equal(res.statusCode, 200);
  const saved = kv.readJson('salon_customers').find((c) => c.id === base.id);
  assert.equal(saved.totalSpent, 0);
  assert.equal(saved.ordersCount, 0);
  assert.equal(saved.discountPercent, 0);
  assert.equal(saved.tier, 'Клиент');
  assert.deepEqual(saved.orders, []);
  assert.equal('isAdmin' in saved, false);
});

test('public POST cannot overwrite an existing customer id', async () => {
  const res = await post({ ...base, firstName: 'Взломщик', phone: '+7 (900) 999-99-99' });
  assert.equal(res.statusCode, 409);
  const saved = kv.readJson('salon_customers').find((c) => c.id === base.id);
  assert.equal(saved.firstName, 'Анна');
});

test('public POST cannot register a second record for an existing phone', async () => {
  const res = await post({ ...base, id: 'cust_other', firstName: 'Другой' });
  assert.equal(res.statusCode, 409);
  assert.equal(kv.readJson('salon_customers').some((c) => c.id === 'cust_other'), false);
});

test('invalid phone is rejected with 400', async () => {
  const res = await post({ ...base, id: 'cust_bad', phone: '12345' });
  assert.equal(res.statusCode, 400);
});

test('oversized fields are rejected or truncated, extra fields never stored', async () => {
  const res = await post({
    ...base,
    id: 'cust_big',
    phone: '+7 (900) 555-44-33',
    firstName: 'А'.repeat(5000),
    extra: 'Z'.repeat(100000),
  });
  if (res.statusCode === 200) {
    const saved = kv.readJson('salon_customers').find((c) => c.id === 'cust_big');
    assert.ok(saved.firstName.length <= 50);
    assert.equal('extra' in saved, false);
  } else {
    assert.equal(res.statusCode, 400);
  }
});

test('admin can update an existing customer', async () => {
  const res = await post(
    { ...base, totalSpent: 12000, ordersCount: 2, discountPercent: 5, tier: 'Серебряный', orders: [] },
    { token: adminToken() }
  );
  assert.equal(res.statusCode, 200);
  const saved = kv.readJson('salon_customers').find((c) => c.id === base.id);
  assert.equal(saved.totalSpent, 12000);
  assert.equal(saved.tier, 'Серебряный');
});

test('registration is rate-limited per IP', async () => {
  const ip = '198.51.100.77';
  const codes = [];
  for (let i = 0; i < 8; i++) {
    const phone = '+7 (901) 000-00-' + String(10 + i);
    const res = await post({ ...base, id: 'cust_rl_' + String(i), phone }, { ip });
    codes.push(res.statusCode);
  }
  assert.ok(codes.includes(429), 'expected a 429 among ' + codes.join(','));
});

test('foreign *.vercel.app origins are not reflected in CORS', async () => {
  const res = makeRes();
  await handler(makeReq({ method: 'OPTIONS', headers: { origin: 'https://evil-app.vercel.app' } }), res);
  assert.notEqual(res.headers['access-control-allow-origin'], 'https://evil-app.vercel.app');
});
