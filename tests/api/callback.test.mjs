import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { startFakeKv, makeReq, makeRes } from './helpers.mjs';

const kv = await startFakeKv();
const SECRET = 's'.repeat(40);
process.env.KV_REST_API_URL = kv.url;
process.env.KV_REST_API_TOKEN = 'test-kv-token';
process.env.AUTH_SECRET = SECRET;

const handler = (await import('../../api/callback.ts')).default;

function adminToken() {
  const payload = Buffer.from(JSON.stringify({ role: 'admin', exp: Date.now() + 60_000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return payload + '.' + sig;
}

let ipCounter = 1;
const nextIp = () => `192.0.2.${++ipCounter}`;

test.beforeEach(() => {
  kv.setFailMode(false);
  kv.store.clear();
});

test.after(() => kv.close());

test('POST /api/callback validates consent, phone, honeypot, and stores callback lead (H-03)', async () => {
  // Missing consent -> 400
  const noConsent = makeRes();
  await handler(
    makeReq({ method: 'POST', ip: nextIp(), body: { name: 'Анна', phone: '+7 917 111-22-33', consent: false } }),
    noConsent
  );
  assert.equal(noConsent.statusCode, 400);

  // Honeypot -> 400
  const botRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: { name: 'Bot', phone: '+7 917 111-22-33', consent: true, honeypot: 'http://spam.test' },
    }),
    botRes
  );
  assert.equal(botRes.statusCode, 400);

  // Valid submission -> 200
  const okRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: { name: 'Екатерина', phone: '8 (917) 222-33-44', comment: 'Букет маме до 4000', consent: true },
    }),
    okRes
  );
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body.ok, true);

  // Admin GET -> 200 with lead; anonymous GET -> 401
  const anonGet = makeRes();
  await handler(makeReq({ method: 'GET', ip: nextIp() }), anonGet);
  assert.equal(anonGet.statusCode, 401);

  const adminGet = makeRes();
  await handler(
    makeReq({ method: 'GET', ip: nextIp(), headers: { authorization: `Bearer ${adminToken()}` } }),
    adminGet
  );
  assert.equal(adminGet.statusCode, 200);
  assert.equal(adminGet.body.callbacks.length, 1);
  assert.equal(adminGet.body.callbacks[0].name, 'Екатерина');
  assert.equal(adminGet.body.callbacks[0].phone, '+7 (917) 222-33-44');

  // Admin mark done -> 200
  const doneRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      headers: { authorization: `Bearer ${adminToken()}` },
      body: { action: 'done', id: adminGet.body.callbacks[0].id },
    }),
    doneRes
  );
  assert.equal(doneRes.statusCode, 200);
  assert.equal(doneRes.body.callbacks[0].status, 'done');
});

test('POST /api/callback rate-limits per IP and fails closed on Redis outage', async () => {
  const sameIp = '198.51.100.42';
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const res = makeRes();
    await handler(
      makeReq({
        method: 'POST',
        ip: sameIp,
        body: { name: 'Тест', phone: '+7 (917) 333-44-55', consent: true },
      }),
      res
    );
    codes.push(res.statusCode);
  }
  assert.deepEqual(codes, [200, 200, 200, 200, 429]);

  kv.setFailMode(true);
  const outageRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: '198.51.100.43',
      body: { name: 'Тест', phone: '+7 (917) 333-44-55', consent: true },
    }),
    outageRes
  );
  assert.equal(outageRes.statusCode, 503);
});
