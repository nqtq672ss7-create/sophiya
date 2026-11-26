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

test('POST action:add prepends new bouquet to KV', async () => {
  kv.seedJson('catalog_bouquets', [
    { id: 'b1', title: 'Старый букет', price: 2000, category: 'Монобукеты' },
  ]);
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken()}` },
    body: {
      action: 'add',
      item: { title: 'Новый букет', price: 3500, category: 'Авторские' },
    },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.count, 2);

  const saved = kv.readJson('catalog_bouquets');
  assert.equal(saved.length, 2);
  assert.equal(saved[0].title, 'Новый букет');
  assert.equal(saved[1].title, 'Старый букет');
});

test('POST action:update updates existing bouquet in KV', async () => {
  kv.seedJson('catalog_bouquets', [
    { id: 'b1', title: 'Букет 1', price: 2000, category: 'Монобукеты' },
  ]);
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken()}` },
    body: {
      action: 'update',
      id: 'b1',
      updates: { price: 2500, title: 'Букет 1 обновленный' },
    },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);

  const saved = kv.readJson('catalog_bouquets');
  assert.equal(saved[0].price, 2500);
  assert.equal(saved[0].title, 'Букет 1 обновленный');
});

test('POST action:delete removes bouquet from KV', async () => {
  kv.seedJson('catalog_bouquets', [
    { id: 'b1', title: 'Букет 1', price: 2000 },
    { id: 'b2', title: 'Букет 2', price: 3000 },
  ]);
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken()}` },
    body: { action: 'delete', id: 'b1' },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.count, 1);

  const saved = kv.readJson('catalog_bouquets');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, 'b2');
});

test('POST action:toggleStock flips stock status in KV', async () => {
  kv.seedJson('catalog_bouquets', [
    { id: 'b1', title: 'Букет 1', price: 2000, inStock: true },
  ]);
  const req = makeReq({
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken()}` },
    body: { action: 'toggleStock', id: 'b1' },
  });
  const res = makeRes();
  await handler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.inStock, false);

  const saved = kv.readJson('catalog_bouquets');
  assert.equal(saved[0].inStock, false);
});

test('legitimate HTTPS site origins are reflected in CORS headers and legacy staging is rejected', async () => {
  const validOrigins = [
    'https://xn----ctbjn3arftl7c8b.xn--p1ai',
    'https://цветы-софия.рф',
  ];
  for (const origin of validOrigins) {
    const res = makeRes();
    await handler(makeReq({ method: 'OPTIONS', headers: { origin } }), res);
    assert.equal(res.headers['access-control-allow-origin'], origin);
  }

  const blockedRes = makeRes();
  await handler(makeReq({ method: 'OPTIONS', headers: { origin: 'https://evil.github.io' } }), blockedRes);
  assert.equal(blockedRes.headers['access-control-allow-origin'], 'null');
});
