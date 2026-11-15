import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { startFakeKv, makeReq, makeRes } from './helpers.mjs';

const kv = await startFakeKv();
const SECRET = 's'.repeat(40);
process.env.KV_REST_API_URL = kv.url;
process.env.KV_REST_API_TOKEN = 'test-kv-token';
process.env.AUTH_SECRET = SECRET;

const handler = (await import('../../api/catalog.ts')).default;

function adminToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

test.beforeEach(() => {
  kv.store.clear();
});

test.after(() => kv.close());

test('GET returns null when catalog is empty', async () => {
  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, null);
});

test('GET returns array of bouquets when stored in KV', async () => {
  const bouquets = [
    { id: 'b1', title: 'Розы Ред Наоми', price: 2700, category: 'Монобукеты' },
    { id: 'b2', title: 'Хризантема Алтай', price: 3500, category: 'Авторские' },
  ];
  kv.seedJson('catalog_bouquets', bouquets);

  const req = makeReq({ method: 'GET' });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, bouquets);
});

test('POST without token returns 401', async () => {
  const req = makeReq({ method: 'POST', body: [{ id: 'b1', title: 'Тест', price: 1000 }] });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
});

test('POST with invalid token returns 401', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { authorization: 'Bearer invalid.token' },
    body: [{ id: 'b1', title: 'Тест', price: 1000 }],
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 401);
});

test('POST with valid admin token saves catalog to KV', async () => {
  const bouquets = [
    { id: 'b1', title: 'Хризантема кустовая', price: 3200, category: 'Авторские' },
  ];
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken()}` },
    body: bouquets,
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.count, 1);

  const saved = kv.readJson('catalog_bouquets');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].title, 'Хризантема кустовая');
});

test('POST sanitizes string prices and trims whitespace', async () => {
  const bouquets = [
    { id: 'b1', title: '  Букет пионов  ', price: ' 4 500 ', category: 'Авторские' },
  ];
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken()}` },
    body: bouquets,
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);

  const saved = kv.readJson('catalog_bouquets');
  assert.equal(saved[0].title, 'Букет пионов');
  assert.equal(saved[0].price, 4500);
});

test('legitimate site origins are reflected in CORS headers', async () => {
  const validOrigins = [
    'https://sitesophiya.vercel.app',
    'https://xn----ctbjn3arftl7c8b.xn--p1ai',
    'https://цветы-софия.рф',
  ];
  for (const origin of validOrigins) {
    const res = makeRes();
    await handler(makeReq({ method: 'OPTIONS', headers: { origin } }), res);
    assert.equal(res.headers['access-control-allow-origin'], origin);
  }
});
