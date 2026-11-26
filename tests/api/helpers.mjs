// Test helpers: a tiny fake Upstash REST server and fake Vercel req/res objects.
import http from 'node:http';

export async function startFakeKv() {
  const store = new Map();
  let failMode = false;

  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (failMode) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Simulated Redis outage' }));
        return;
      }

      const parsed = JSON.parse(raw || '[]');
      const wantsB64 = req.headers['upstash-encoding'] === 'base64';
      const encode = (result) => {
        if (wantsB64 && typeof result === 'string' && result !== 'OK') {
          return Buffer.from(result).toString('base64');
        }
        if (Array.isArray(result)) {
          return result.map((item) => encode(item));
        }
        return result;
      };
      const run = (cmd) => {
        const [name, key, ...rest] = cmd;
        switch (String(name).toLowerCase()) {
          case 'get':
            return store.has(key) ? store.get(key) : null;
          case 'mget': {
            const keys = [key, ...rest];
            return keys.map((k) => (store.has(k) ? store.get(k) : null));
          }
          case 'set':
            store.set(key, rest[0]);
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
          case 'lpush': {
            const list = Array.isArray(store.get(key)) ? [...store.get(key)] : [];
            for (const val of rest) list.unshift(String(val));
            store.set(key, list);
            return list.length;
          }
          case 'rpush': {
            const list = Array.isArray(store.get(key)) ? [...store.get(key)] : [];
            for (const val of rest) list.push(String(val));
            store.set(key, list);
            return list.length;
          }
          case 'ltrim': {
            const list = Array.isArray(store.get(key)) ? [...store.get(key)] : [];
            const start = Number(rest[0] || 0);
            const stop = Number(rest[1] ?? -1);
            const endIdx = stop < 0 ? list.length + stop + 1 : stop + 1;
            store.set(key, list.slice(start, endIdx));
            return 'OK';
          }
          case 'lrange': {
            const list = Array.isArray(store.get(key)) ? store.get(key) : [];
            const start = Number(rest[0] || 0);
            const stop = Number(rest[1] ?? -1);
            const endIdx = stop < 0 ? list.length + stop + 1 : stop + 1;
            return list.slice(start, endIdx);
          }
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
    setFailMode(flag) {
      failMode = Boolean(flag);
    },
    seedJson(key, value) {
      store.set(key, JSON.stringify(value));
    },
    readJson(key) {
      const v = store.get(key);
      if (v == null) return null;
      return typeof v === 'string' ? JSON.parse(v) : v;
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
