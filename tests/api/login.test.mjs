import test from 'node:test';
import assert from 'node:assert/strict';
import { startFakeKv, makeReq, makeRes } from './helpers.mjs';

const kv = await startFakeKv();
process.env.KV_REST_API_URL = kv.url;
process.env.KV_REST_API_TOKEN = 'test-kv-token';
// Cache-buster so each scenario gets a fresh module with its own env snapshot.
async function loadLogin(env) {
  for (const k of ['ADMIN_PASSWORD', 'AUTH_SECRET']) delete process.env[k];
  Object.assign(process.env, env);
  return (await import(`../../api/login.ts?${Math.random()}`)).default;
}
const LEGACY_PIN = ['32', '35'].join(''); // the PIN that used to be hardcoded in the repo

test.after(() => kv.close());

test('without ADMIN_PASSWORD and AUTH_SECRET login is closed, even for the legacy PIN', async () => {
  const login = await loadLogin({});
  const res = makeRes();
  await login(makeReq({ method: 'POST', body: { password: LEGACY_PIN } }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.token, undefined);
});

test('with ADMIN_PASSWORD set, the legacy PIN is rejected', async () => {
  const login = await loginHandlerFor({ ADMIN_PASSWORD: 'correct horse battery', AUTH_SECRET: 's'.repeat(40) });
  const res = makeRes();
  await login(makeReq({ method: 'POST', body: { password: LEGACY_PIN }, ip: '198.51.100.1' }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.token, undefined);
});

test('with ADMIN_PASSWORD set, the configured password returns a token', async () => {
  const login = await loginHandlerFor({ ADMIN_PASSWORD: 'correct horse battery', AUTH_SECRET: 's'.repeat(40) });
  const res = makeRes();
  await login(makeReq({ method: 'POST', body: { password: 'correct horse battery' }, ip: '198.51.100.2' }), res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body.token, /^[\w-]+\.[\w-]+$/);
});

test('login refuses to sign tokens when AUTH_SECRET is missing', async () => {
  const login = await loginHandlerFor({ ADMIN_PASSWORD: 'correct horse battery' });
  const res = makeRes();
  await login(makeReq({ method: 'POST', body: { password: 'correct horse battery' }, ip: '198.51.100.3' }), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.token, undefined);
});

test('foreign *.vercel.app origins are not reflected in CORS', async () => {
  const login = await loginHandlerFor({ ADMIN_PASSWORD: 'x'.repeat(12), AUTH_SECRET: 's'.repeat(40) });
  const res = makeRes();
  await login(makeReq({ method: 'OPTIONS', headers: { origin: 'https://evil-app.vercel.app' } }), res);
  assert.notEqual(res.headers['access-control-allow-origin'], 'https://evil-app.vercel.app');
});

test('legitimate site origin is reflected in CORS', async () => {
  const login = await loginHandlerFor({ ADMIN_PASSWORD: 'x'.repeat(12), AUTH_SECRET: 's'.repeat(40) });
  const validOrigins = [
    'https://sitesophiya.vercel.app',
    'https://xn----ctbjn3arftl7c8b.xn--p1ai',
    'https://цветы-софия.рф',
    'https://%D1%86%D0%B2%D0%B5%D1%82%D1%8B-%D1%81%D0%BE%D1%84%D0%B8%D1%8F.%D1%80%D1%84',
    'https://www.xn----ctbjn3arftl7c8b.xn--p1ai',
  ];
  for (const origin of validOrigins) {
    const res = makeRes();
    await login(makeReq({ method: 'OPTIONS', headers: { origin } }), res);
    assert.equal(res.headers['access-control-allow-origin'], origin);
  }
});

function loginHandlerFor(env) { return loadLogin(env); }
