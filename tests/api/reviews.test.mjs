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

const handler = (await import('../../api/reviews.ts')).default;

function adminToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

let ipCounter = 0;
const nextIp = () => '192.0.2.' + String(++ipCounter);

async function call({ method = 'POST', body, token, ip = nextIp(), query } = {}) {
  const res = makeRes();
  const headers = token ? { authorization: 'Bearer ' + token } : {};
  const req = makeReq({ method, body, headers, ip });
  req.query = query || {};
  await handler(req, res);
  return res;
}

const submit = (review, opts = {}) => call({ body: { action: 'create', review }, ...opts });

const valid = { author: 'Анна', rating: 5, comment: 'Привезли вовремя, букет свежий.', bouquetTitle: 'Розы' };

test.beforeEach(() => {
  kv.store.clear();
  kv.seedJson('salon_reviews', [
    { id: 'pub_1', author: 'Опубликован', rating: 5, date: '1 октября 2026', comment: 'Виден всем', isVerified: true, isPublished: true },
    { id: 'hid_1', author: 'Скрыт', rating: 1, date: '2 октября 2026', comment: 'Скрытый текст', isVerified: false, isPublished: false },
  ]);
});

test.after(() => kv.close());

test('public submit goes to the pending queue, not to the public list', async () => {
  const res = await submit({ ...valid, isVerified: true, isPublished: true, id: 'evil', extra: 'Z'.repeat(5000) });
  assert.equal(res.statusCode, 200);
  const pending = kv.readJson('salon_reviews_pending');
  assert.equal(pending.length, 1);
  const saved = pending[0];
  assert.equal(saved.isVerified, false);
  assert.equal(saved.isPublished, false);
  assert.notEqual(saved.id, 'evil');
  assert.equal('extra' in saved, false);
  assert.equal(saved.author, 'Анна');
  assert.equal(kv.readJson('salon_reviews').length, 2);
});

test('public submit validates author, rating and comment', async () => {
  assert.equal((await submit({ ...valid, author: '   ' })).statusCode, 400);
  assert.equal((await submit({ ...valid, rating: 0 })).statusCode, 400);
  assert.equal((await submit({ ...valid, rating: 6 })).statusCode, 400);
  assert.equal((await submit({ ...valid, rating: 4.5 })).statusCode, 400);
  assert.equal((await submit({ ...valid, comment: 'мало' })).statusCode, 400);
  assert.equal((await submit({ ...valid, comment: 'я'.repeat(2001) })).statusCode, 400);
  assert.equal(kv.readJson('salon_reviews_pending'), null);
});

test('honeypot field rejects the submission', async () => {
  const res = await call({ body: { action: 'create', review: valid, company_website: 'http://spam.example' } });
  assert.equal(res.statusCode, 400);
  assert.equal(kv.readJson('salon_reviews_pending'), null);
});

test('submissions are rate-limited per IP', async () => {
  const ip = '198.51.100.9';
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await submit(valid, { ip })).statusCode);
  assert.ok(codes.includes(429), 'expected 429 among ' + codes.join(','));
  assert.ok(kv.readJson('salon_reviews_pending').length <= 3);
});

test('public GET returns only published reviews', async () => {
  const res = await call({ method: 'GET' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.map((r) => r.id), ['pub_1']);
});

test('admin GET returns every review including hidden ones', async () => {
  const res = await call({ method: 'GET', token: adminToken() });
  assert.deepEqual(res.body.map((r) => r.id).sort(), ['hid_1', 'pub_1']);
});

test('pending queue is readable by admin only', async () => {
  await submit(valid);
  const anon = await call({ method: 'GET', query: { pending: '1' } });
  assert.equal(anon.statusCode, 401);
  const admin = await call({ method: 'GET', token: adminToken(), query: { pending: '1' } });
  assert.equal(admin.statusCode, 200);
  assert.equal(admin.body.length, 1);
  assert.equal(admin.body[0].author, 'Анна');
});

test('admin approves a pending review: it moves to the public list', async () => {
  await submit(valid);
  const id = kv.readJson('salon_reviews_pending')[0].id;
  const res = await call({ token: adminToken(), body: { action: 'moderate', id, decision: 'approve' } });
  assert.equal(res.statusCode, 200);
  assert.equal(kv.readJson('salon_reviews_pending').length, 0);
  const list = kv.readJson('salon_reviews');
  const approved = list.find((r) => r.id === id);
  assert.equal(approved.isPublished, true);
  assert.equal(approved.isVerified, false);
  const pub = await call({ method: 'GET' });
  assert.ok(pub.body.some((r) => r.id === id));
});

test('admin rejects a pending review: it is deleted', async () => {
  await submit(valid);
  const id = kv.readJson('salon_reviews_pending')[0].id;
  const res = await call({ token: adminToken(), body: { action: 'moderate', id, decision: 'reject' } });
  assert.equal(res.statusCode, 200);
  assert.equal(kv.readJson('salon_reviews_pending').length, 0);
  assert.equal(kv.readJson('salon_reviews').some((r) => r.id === id), false);
});

test('moderation without admin token is refused', async () => {
  await submit(valid);
  const id = kv.readJson('salon_reviews_pending')[0].id;
  const res = await call({ body: { action: 'moderate', id, decision: 'approve' } });
  assert.equal(res.statusCode, 401);
  assert.equal(kv.readJson('salon_reviews_pending').length, 1);
});

test('replacing the whole list still requires admin', async () => {
  const res = await call({ body: [{ id: 'x', author: 'x', rating: 5, comment: 'xxxxx', isPublished: true }] });
  assert.equal(res.statusCode, 401);
  assert.equal(kv.readJson('salon_reviews').length, 2);
});

test('admin replace of the public list does not touch the pending queue', async () => {
  await submit(valid);
  const res = await call({ token: adminToken(), body: [{ id: 'only', author: 'a', rating: 5, comment: 'ok ok ok', date: 'x', isVerified: false, isPublished: true }] });
  assert.equal(res.statusCode, 200);
  assert.equal(kv.readJson('salon_reviews_pending').length, 1);
});
