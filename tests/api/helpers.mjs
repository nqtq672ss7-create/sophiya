// Test helpers: a tiny fake Upstash REST server and fake Vercel req/res objects.
import http from 'node:http';

export async function startFakeKv() {
  const store = new Map();
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const parsed = JSON.parse(raw || '[]');
      const wantsB64 = req.headers['upstash-encoding'] === 'base64';
      const encode = (result) =>
        wantsB64 && typeof result === 'string' && result !== 'OK'
          ? Buffer.from(result).toString('base64')
          : result;
      const run = (cmd) => {
        const [name, key, value] = cmd;
        switch (String(name).toLowerCase()) {
          case 'get':
            return store.has(key) ? store.get(key) : null;
          case 'set':
            store.set(key, value);
            return 'OK';
          case 'del':
            return store.delete(key) ? 1 : 0;
          case 'incr': {
            const next = Number(store.get(key) || 0) + 1;
            store.set(key, String(next));
            return next;
          }
          case 'expire':
            return 1;
          default:
            return null;
        }
      };
      const isPipeline = Array.isArray(parsed[0]);
      const out = isPipeline
        ? parsed.map((cmd) => ({ result: encode(run(cmd)) }))
        : { result: encode(run(parsed)) };
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(out));
    });
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    store,
    seedJson(key, value) {
      store.set(key, JSON.stringify(value));
    },
    readJson(key) {
      const v = store.get(key);
      return v == null ? null : JSON.parse(v);
    },
    close: () => new Promise((r) => server.close(r)),
  };
}

export function makeReq({ method = 'GET', headers = {}, body, ip = '203.0.113.10' } = {}) {
  return {
    method,
    headers: { 'x-forwarded-for': ip, ...headers },
    body,
    socket: { remoteAddress: ip },
  };
}

export function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    removeHeader(k) { delete this.headers[k.toLowerCase()]; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
  return res;
}

export async function loginAsAdmin(loginHandler, password) {
  const res = makeRes();
  await loginHandler(makeReq({ method: 'POST', body: { password } }), res);
  return res;
}
