import test from 'node:test';
import assert from 'node:assert/strict';
import { startFakeKv, makeReq, makeRes } from './helpers.mjs';

const kv = await startFakeKv();
const SECRET = 's'.repeat(40);
process.env.KV_REST_API_URL = kv.url;
process.env.KV_REST_API_TOKEN = 'test-kv-token';
process.env.AUTH_SECRET = SECRET;

const handler = (await import('../../api/customer-auth.ts')).default;

let ipSeq = 10;
const nextIp = () => `198.51.100.${++ipSeq}`;

function extractCookieToken(setCookieHeader) {
  const raw = Array.isArray(setCookieHeader) ? setCookieHeader[0] : String(setCookieHeader || '');
  const match = raw.match(/sophiya_ctok=([^;]+)/);
  return match ? `sophiya_ctok=${match[1]}` : '';
}

test.beforeEach(() => {
  kv.setFailMode(false);
  kv.store.clear();
});

test.after(() => kv.close());

test('GET without cookie returns 200 authenticated=false (never 401)', async () => {
  const res = makeRes();
  await handler(makeReq({ method: 'GET', ip: nextIp() }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.authenticated, false);
  assert.equal(res.body.customer, null);
});

test('POST register enforces 152-FZ consent, hashes password, sets HttpOnly cookie, and prevents duplicates', async () => {
  const noConsent = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'register',
        phone: '+7 (917) 222-33-44',
        firstName: 'Елена',
        lastName: 'Петрова',
        password: 'password123',
        consent: false,
      },
    }),
    noConsent
  );
  assert.equal(noConsent.statusCode, 400);

  const okRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'register',
        phone: '+7 (917) 222-33-44',
        firstName: 'Елена',
        lastName: 'Петрова',
        password: 'password123',
        consent: true,
      },
    }),
    okRes
  );
  assert.equal(okRes.statusCode, 200);
  assert.equal(okRes.body.authenticated, true);
  assert.equal(okRes.body.customer.firstName, 'Елена');
  assert.equal('passwordHash' in okRes.body.customer, false);
  assert.ok(String(okRes.headers['set-cookie'] || '').includes('HttpOnly'));

  const stored = kv.readJson('salon_customers');
  assert.equal(stored.length, 1);
  assert.ok(stored[0].passwordHash.startsWith('scrypt:'));

  // Duplicate phone rejected
  const dupRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'register',
        phone: '89172223344',
        firstName: 'Клон',
        lastName: 'Тест',
        password: 'password456',
        consent: true,
      },
    }),
    dupRes
  );
  assert.equal(dupRes.statusCode, 409);
});

test('POST login validates password, rate-limits brute force, and enriches live orders/loyalty', async () => {
  const ip = nextIp();
  const regRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'register',
        phone: '+7 (917) 333-44-55',
        firstName: 'Ольга',
        lastName: 'Сидорова',
        password: 'my-secret-pass',
        consent: true,
      },
    }),
    regRes
  );
  const custId = regRes.body.customer.id;

  // Seed paid order belonging to this customer (12 000 RUB -> Серебряный 5%)
  kv.store.set('sophiya_order_ids', ['ord_lk_1']);
  kv.seedJson('sophiya_order_item:ord_lk_1', {
    id: 'ord_lk_1',
    orderNumber: 'SF-555111',
    customerId: custId,
    createdAt: '26.11, 14:00',
    customerName: 'Ольга Сидорова',
    phone: '+7 (917) 333-44-55',
    items: [{ title: 'Пионы Blanche', quantity: 1, price: 12000 }],
    totalAmount: 12000,
    paymentMethod: 'yookassa',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
  });

  // Wrong password 5 times -> 6th attempt gets 429
  const badCodes = [];
  for (let i = 0; i < 6; i++) {
    const r = makeRes();
    await handler(
      makeReq({
        method: 'POST',
        ip,
        body: { action: 'login', phone: '+7 (917) 333-44-55', password: 'wrong' },
      }),
      r
    );
    badCodes.push(r.statusCode);
  }
  assert.deepEqual(badCodes.slice(0, 5), [401, 401, 401, 401, 401]);
  assert.equal(badCodes[5], 429);

  // Valid login from another IP works and returns orders + 5% discount
  const loginRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: { action: 'login', phone: '89173334455', password: 'my-secret-pass' },
    }),
    loginRes
  );
  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.body.authenticated, true);
  assert.equal(loginRes.body.customer.tier, 'Серебряный');
  assert.equal(loginRes.body.customer.discountPercent, 5);
  assert.equal(loginRes.body.customer.orders.length, 1);
  assert.equal(loginRes.body.customer.orders[0].orderNumber, 'SF-555111');

  const cookie = extractCookieToken(loginRes.headers['set-cookie']);
  assert.ok(cookie);

  // GET with cookie returns authenticated customer
  const sessionRes = makeRes();
  await handler(makeReq({ method: 'GET', headers: { cookie } }), sessionRes);
  assert.equal(sessionRes.statusCode, 200);
  assert.equal(sessionRes.body.authenticated, true);
  assert.equal(sessionRes.body.customer.id, custId);
});

test('POST deleteAccount (152-FZ) deletes customer and anonymizes order PII', async () => {
  const regRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'register',
        phone: '+7 (917) 444-55-66',
        firstName: 'Мария',
        lastName: 'Волкова',
        password: 'delete-me-123',
        consent: true,
      },
    }),
    regRes
  );
  const custId = regRes.body.customer.id;
  const cookie = extractCookieToken(regRes.headers['set-cookie']);

  kv.store.set('sophiya_order_ids', ['ord_del_1']);
  kv.seedJson('sophiya_order_item:ord_del_1', {
    id: 'ord_del_1',
    orderNumber: 'SF-777888',
    customerId: custId,
    customerName: 'Мария Волкова',
    recipientName: 'Мария Волкова',
    phone: '+7 (917) 444-55-66',
    recipientPhone: '+7 (917) 444-55-66',
    address: 'пр. Мира, 10',
    email: 'maria@example.com',
    postcardText: 'С днём рождения',
    items: [{ title: 'Розы', quantity: 1, price: 4000 }],
    totalAmount: 4000,
    paymentMethod: 'yookassa',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
  });

  // Unauthenticated deleteAccount rejected
  const unauthDel = makeRes();
  await handler(makeReq({ method: 'POST', body: { action: 'deleteAccount' } }), unauthDel);
  assert.equal(unauthDel.statusCode, 401);

  // Authenticated deleteAccount succeeds
  const okDel = makeRes();
  await handler(
    makeReq({ method: 'POST', headers: { cookie }, body: { action: 'deleteAccount' } }),
    okDel
  );
  assert.equal(okDel.statusCode, 200);
  assert.equal(okDel.body.ok, true);
  assert.equal(kv.readJson('salon_customers').length, 0);

  const scrubbedOrder = kv.readJson('sophiya_order_item:ord_del_1');
  assert.equal(scrubbedOrder.customerName, 'Удалено (152-ФЗ)');
  assert.equal(scrubbedOrder.phone, '');
  assert.equal(scrubbedOrder.address, '');
  assert.equal(scrubbedOrder.email, '');
  assert.equal('customerId' in scrubbedOrder, false);
});

test('POST login flags passwordless legacy account and claimPassword activates it with name check', async () => {
  kv.seedJson('salon_customers', [
    {
      id: 'cust_legacy_1',
      phone: '+7 (999) 652-42-00',
      firstName: 'Елена',
      lastName: 'Иванова',
      totalSpent: 7500,
      ordersCount: 2,
      createdAt: '2026-01-10T10:00:00.000Z',
    },
  ]);

  // 1. Login returns 401 with needsPasswordSetup: true
  const loginAttempt = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: { action: 'login', phone: '+7 (999) 652-42-00', password: 'any-password' },
    }),
    loginAttempt
  );
  assert.equal(loginAttempt.statusCode, 401);
  assert.equal(loginAttempt.body.needsPasswordSetup, true);

  // 2. claimPassword with wrong firstName -> 403
  const wrongNameRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'claimPassword',
        phone: '+7 (999) 652-42-00',
        firstName: 'Светлана',
        password: 'new-password-123',
        consent: true,
      },
    }),
    wrongNameRes
  );
  assert.equal(wrongNameRes.statusCode, 403);

  // 3. claimPassword with matching firstName (case-insensitive) -> 200 & cookie
  const claimRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'claimPassword',
        phone: '89996524200',
        firstName: ' елена ',
        password: 'new-password-123',
        consent: true,
      },
    }),
    claimRes
  );
  assert.equal(claimRes.statusCode, 200);
  assert.equal(claimRes.body.authenticated, true);
  assert.equal(claimRes.body.customer.id, 'cust_legacy_1');
  assert.equal(claimRes.body.customer.totalSpent, 7500);
  assert.ok(extractCookieToken(claimRes.headers['set-cookie']));

  // 4. Subsequent login with the new password works
  const okLogin = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: { action: 'login', phone: '+7 (999) 652-42-00', password: 'new-password-123' },
    }),
    okLogin
  );
  assert.equal(okLogin.statusCode, 200);
  assert.equal(okLogin.body.customer.id, 'cust_legacy_1');

  // 5. Re-claiming an already-protected account -> 409
  const secondClaim = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'claimPassword',
        phone: '+7 (999) 652-42-00',
        firstName: 'Елена',
        password: 'another-password',
        consent: true,
      },
    }),
    secondClaim
  );
  assert.equal(secondClaim.statusCode, 409);
});

test('POST register activates legacy passwordless account when firstName matches', async () => {
  kv.seedJson('salon_customers', [
    {
      id: 'cust_legacy_2',
      phone: '+7 (917) 888-99-00',
      firstName: 'Дарья',
      lastName: '',
      totalSpent: 3200,
      ordersCount: 1,
    },
  ]);

  const regRes = makeRes();
  await handler(
    makeReq({
      method: 'POST',
      ip: nextIp(),
      body: {
        action: 'register',
        phone: '+7 (917) 888-99-00',
        firstName: 'Дарья',
        lastName: 'Козлова',
        password: 'activated-pass',
        consent: true,
      },
    }),
    regRes
  );
  assert.equal(regRes.statusCode, 200);
  assert.equal(regRes.body.authenticated, true);
  assert.equal(regRes.body.customer.id, 'cust_legacy_2');
  assert.equal(regRes.body.customer.lastName, 'Козлова');
});
