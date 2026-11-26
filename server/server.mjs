import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { handleYookassa } from './yookassa-handler.mjs';

// Load .env manually if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const PORT = Number(process.env.PORT || 3001);
const SECRET_SALT = process.env.AUTH_SECRET || '';
const SECRET_OK = SECRET_SALT.length >= 32;
const BOUQUETS_CLOUD_DIR = process.env.BOUQUETS_CLOUD_DIR || '/var/www/sophiya/bouquets-cloud';

try {
  fs.mkdirSync(BOUQUETS_CLOUD_DIR, { recursive: true });
} catch {}

// Minimal zero-dependency RESP Redis Client talking to 127.0.0.1:6379
function parseRedisUrl(urlStr) {
  try {
    const u = new URL(urlStr || 'redis://127.0.0.1:6379');
    return { host: u.hostname || '127.0.0.1', port: Number(u.port || 6379) };
  } catch {
    return { host: '127.0.0.1', port: 6379 };
  }
}

const redisConn = parseRedisUrl(process.env.REDIS_URL);

function sendRespCommand(args) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(redisConn.port, redisConn.host);
    socket.setTimeout(5000);

    let chunks = [];
    let resolved = false;

    const finish = (err, val) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {}
      if (err) reject(err);
      else resolve(val);
    };

    socket.on('timeout', () => finish(new Error('Redis timeout')));
    socket.on('error', (err) => finish(err));

    socket.on('connect', () => {
      const parts = [`*${args.length}\r\n`];
      for (const arg of args) {
        const str = typeof arg === 'string' ? arg : String(arg);
        const buf = Buffer.from(str, 'utf8');
        parts.push(`$${buf.length}\r\n`);
        parts.push(buf);
        parts.push('\r\n');
      }
      for (const p of parts) {
        socket.write(p);
      }
    });

    socket.on('data', (chunk) => {
      chunks.push(chunk);
      const buf = Buffer.concat(chunks);
      const parsed = tryParseResp(buf);
      if (parsed.done) {
        if (parsed.error) finish(new Error(parsed.error));
        else finish(null, parsed.value);
      }
    });
  });
}

function parseRespAt(buf, offset = 0) {
  if (offset >= buf.length) return { done: false };
  const crlf = buf.indexOf('\r\n', offset);
  if (crlf === -1) return { done: false };

  const prefix = String.fromCharCode(buf[offset]);
  const header = buf.slice(offset + 1, crlf).toString('utf8');
  const nextLine = crlf + 2;

  if (prefix === '+') return { done: true, value: header, next: nextLine };
  if (prefix === '-') return { done: true, error: header, next: nextLine };
  if (prefix === ':') return { done: true, value: Number(header), next: nextLine };
  if (prefix === '$') {
    const len = Number(header);
    if (len === -1) return { done: true, value: null, next: nextLine };
    const end = nextLine + len;
    if (buf.length < end + 2) return { done: false };
    return { done: true, value: buf.slice(nextLine, end).toString('utf8'), next: end + 2 };
  }
  if (prefix === '*') {
    const count = Number(header);
    if (count === -1) return { done: true, value: null, next: nextLine };
    const items = [];
    let cursor = nextLine;
    for (let i = 0; i < count; i++) {
      const elem = parseRespAt(buf, cursor);
      if (!elem.done) return { done: false };
      if (elem.error) return { done: true, error: elem.error, next: elem.next };
      items.push(elem.value);
      cursor = elem.next;
    }
    return { done: true, value: items, next: cursor };
  }
  return { done: true, value: null, next: nextLine };
}

function tryParseResp(buf) {
  return parseRespAt(buf, 0);
}

// Mirror map so both legacy and v2 keys stay 100% synchronized in Redis
const KEY_MIRRORS = {
  catalog_bouquets: 'sophiya_catalog_v2',
  sophiya_catalog_v2: 'catalog_bouquets',
  salon_reviews: 'sophiya_reviews_v1',
  sophiya_reviews_v1: 'salon_reviews',
  salon_customers: 'sophiya_customers_v1',
  sophiya_customers_v1: 'salon_customers',
};

const kvClient = {
  async get(key) {
    let raw = await sendRespCommand(['GET', key]);
    if ((raw === null || raw === undefined) && KEY_MIRRORS[key]) {
      raw = await sendRespCommand(['GET', KEY_MIRRORS[key]]);
    }
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },
  async set(key, value, opts) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (opts && opts.ex) {
      await sendRespCommand(['SET', key, serialized, 'EX', String(opts.ex)]);
      if (KEY_MIRRORS[key]) {
        await sendRespCommand(['SET', KEY_MIRRORS[key], serialized, 'EX', String(opts.ex)]);
      }
    } else {
      await sendRespCommand(['SET', key, serialized]);
      if (KEY_MIRRORS[key]) {
        await sendRespCommand(['SET', KEY_MIRRORS[key], serialized]);
      }
    }
    return 'OK';
  },
  async del(key) {
    await sendRespCommand(['DEL', key]);
    if (KEY_MIRRORS[key]) {
      await sendRespCommand(['DEL', KEY_MIRRORS[key]]);
    }
  },
  async incr(key) {
    return await sendRespCommand(['INCR', key]);
  },
  async expire(key, seconds) {
    return await sendRespCommand(['EXPIRE', key, String(seconds)]);
  },
};

function isAllowedOrigin(origin) {
  if (!origin) return false;
  let decoded = origin;
  try {
    decoded = decodeURI(origin);
  } catch {}

  const clean = decoded.toLowerCase().trim().replace(/\/+$/, '');
  const raw = origin.toLowerCase().trim().replace(/\/+$/, '');

  const allowedPatterns = [
    /^https:\/\/(www\.)?xn----ctbjn3arftl7c8b\.xn--p1ai$/,
    /^https:\/\/(www\.)?цветы-софия\.рф$/,
  ];
  if (process.env.NODE_ENV !== 'production') {
    allowedPatterns.push(/^http:\/\/localhost(:[0-9]+)?$/, /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/);
  }

  return allowedPatterns.some((pattern) => pattern.test(clean) || pattern.test(raw));
}

function setSecureCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Order-Token, Cache-Control, Pragma, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
}

function getClientIp(req) {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const last = String(forwarded[forwarded.length - 1] || '').trim();
    if (last) return last;
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function generateToken() {
  const payload = {
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_SALT).update(payloadB64).digest('base64url');
  return payloadB64 + '.' + signature;
}

function verifyToken(token) {
  if (!SECRET_OK) return false;
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_SALT).update(payloadB64).digest('base64url');
  if (signature.length !== expectedSig.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return false;
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

function isPasswordValid(password) {
  const adminPass = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPass) return false;
  if (!password || typeof password !== 'string') return false;
  const given = crypto.createHash('sha256').update(password.trim()).digest();
  const expected = crypto.createHash('sha256').update(adminPass).digest();
  return crypto.timingSafeEqual(given, expected);
}

function bearerToken(req) {
  const authHeader = req.headers.authorization;
  return typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
}

const MIME_TO_EXT = {
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
  avif: 'avif',
  'svg+xml': 'svg',
};

function materializeDataImage(dataUri, bouquetId, index) {
  if (typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) {
    return dataUri;
  }
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s);
  if (!match) return dataUri;
  const rawExt = match[1].toLowerCase();
  const ext = MIME_TO_EXT[rawExt] || rawExt.replace(/[^a-z0-9]/g, '') || 'webp';
  const buf = Buffer.from(match[2], 'base64');
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 10);
  const safeId = String(bouquetId || 'bouquet').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${safeId}_${index}_${hash}.${ext}`;
  const filePath = path.resolve(BOUQUETS_CLOUD_DIR, fileName);
  fs.writeFileSync(filePath, buf);
  return `/bouquets-cloud/${fileName}`;
}

function materializeBouquetImagesOnItem(item) {
  if (!item || typeof item !== 'object') return item;
  const copy = { ...item };
  const bId = copy.id || `custom_${Date.now()}`;
  if (typeof copy.image === 'string' && copy.image.startsWith('data:image/')) {
    copy.image = materializeDataImage(copy.image, bId, 0);
    copy.hasRealPhoto = true;
  }
  if (Array.isArray(copy.images)) {
    copy.images = copy.images.map((img, idx) =>
      typeof img === 'string' && img.startsWith('data:image/')
        ? materializeDataImage(img, bId, idx)
        : img
    );
  }
  if (
    (!copy.image || copy.image === '/bouquet-placeholder.svg') &&
    Array.isArray(copy.images) &&
    copy.images.length > 0
  ) {
    copy.image = copy.images[0];
  }
  return copy;
}

function sanitizeSingleBouquet(item, fallbackId) {
  if (!item || typeof item !== 'object') {
    throw new Error('Элемент имеет неверный формат');
  }
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title) {
    throw new Error('У букета отсутствует название');
  }
  const id =
    typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : fallbackId || `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const rawPrice = typeof item.price === 'string' ? item.price.replace(/\s+/g, '') : item.price;
  const price = Number(rawPrice) || 0;
  const rawOldPrice =
    typeof item.oldPrice === 'string' ? item.oldPrice.replace(/\s+/g, '') : item.oldPrice;
  const parsedOldPrice = Number(rawOldPrice);
  const sanitized = materializeBouquetImagesOnItem({
    ...item,
    id,
    title,
    price,
  });
  if (Number.isFinite(parsedOldPrice) && parsedOldPrice > price) {
    sanitized.oldPrice = parsedOldPrice;
  } else {
    delete sanitized.oldPrice;
  }
  return sanitized;
}

async function saveKvBackup(key, data) {
  try {
    await kvClient.set(`${key}_last_backup`, data, { ex: 30 * 24 * 60 * 60 });
  } catch (err) {
    console.warn(`[Backup] Warning: could not snapshot key "${key}":`, err);
  }
}

// --- Handlers ---

async function handleLogin(req, res, body) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  if (!SECRET_OK || !process.env.ADMIN_PASSWORD?.trim()) {
    return sendJson(res, 503, { error: 'Вход администратора не настроен на сервере.' });
  }
  if (!body || typeof body !== 'object') {
    return sendJson(res, 400, { error: 'Bad request' });
  }
  if (body.company_website || body.honeypot || body.hp_token) {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  const ip = getClientIp(req);
  const safeIp = ip.replace(/[^a-zA-Z0-9_.:-]/g, '_');
  const rlStore = `ratelimit_login_${safeIp}`;

  let existingRecord = null;
  try {
    existingRecord = await kvClient.get(rlStore);
    const now = Date.now();
    if (existingRecord && existingRecord.lockedUntil && now < existingRecord.lockedUntil) {
      const remainingWait = Math.ceil((existingRecord.lockedUntil - now) / 1000);
      return sendJson(res, 429, {
        error: `Слишком много попыток входа. Доступ заблокирован на ${remainingWait} сек.`,
        retryAfter: remainingWait,
      });
    }
  } catch {
    return sendJson(res, 503, { error: 'Сервис авторизации временно недоступен. Попробуйте позже.' });
  }

  const password = body.password || body.pin;
  if (!isPasswordValid(password)) {
    try {
      let record = existingRecord;
      if (!record || typeof record !== 'object') {
        record = { count: 0, firstAttempt: Date.now() };
      }
      record.count += 1;
      if (record.count >= 5) {
        record.lockedUntil = Date.now() + 15 * 60 * 1000;
      }
      await kvClient.set(rlStore, record, { ex: 15 * 60 });
    } catch {
      return sendJson(res, 503, { error: 'Сервис авторизации временно недоступен. Попробуйте позже.' });
    }
    return sendJson(res, 401, { error: 'Неверный PIN-код или пароль доступа.' });
  }

  try {
    await kvClient.del(rlStore);
  } catch {}

  const token = generateToken();
  return sendJson(res, 200, {
    success: true,
    token,
    role: 'admin',
    expiresIn: '24h',
  });
}

async function handleCatalog(req, res, body) {
  if (req.method === 'GET') {
    try {
      const data = await kvClient.get('catalog_bouquets');
      return sendJson(res, 200, data !== undefined && data !== null ? data : null);
    } catch (e) {
      console.error('Error fetching catalog:', e);
      return sendJson(res, 200, null);
    }
  }

  if (req.method === 'POST') {
    if (!verifyToken(bearerToken(req))) {
      return sendJson(res, 401, {
        error: 'Доступ запрещён: требуется авторизация администратора.',
      });
    }
    if (body === undefined) {
      return sendJson(res, 400, { error: 'Неверный формат JSON' });
    }

    try {
      const getCurrentBouquets = async () => {
        const raw = await kvClient.get('catalog_bouquets');
        return Array.isArray(raw) ? raw : [];
      };

      if (body && body.action === 'add' && body.item) {
        const single = sanitizeSingleBouquet(body.item);
        const current = await getCurrentBouquets();
        const updated = [single, ...current.filter((b) => b.id !== single.id)];
        await kvClient.set('catalog_bouquets', updated);
        saveKvBackup('catalog_bouquets', updated).catch(() => {});
        return sendJson(res, 200, { success: true, item: single, count: updated.length });
      }

      if (body && body.action === 'update' && body.id) {
        const id = String(body.id).trim();
        const updates = body.updates || {};
        const current = await getCurrentBouquets();
        let found = false;
        let updatedItem = null;
        const updated = current.map((b) => {
          if (b.id === id) {
            found = true;
            let merged = { ...b, ...updates, id };
            if (updates.price !== undefined) {
              const rawPrice =
                typeof updates.price === 'string'
                  ? updates.price.replace(/\s+/g, '')
                  : updates.price;
              merged.price = Number(rawPrice) || 0;
            }
            if (updates.oldPrice !== undefined) {
              const rawOld =
                typeof updates.oldPrice === 'string'
                  ? updates.oldPrice.replace(/\s+/g, '')
                  : updates.oldPrice;
              const parsedOld = Number(rawOld);
              if (Number.isFinite(parsedOld) && parsedOld > merged.price) {
                merged.oldPrice = parsedOld;
              } else {
                delete merged.oldPrice;
              }
            }
            if (updates.title) merged.title = String(updates.title).trim();
            merged = materializeBouquetImagesOnItem(merged);
            updatedItem = merged;
            return merged;
          }
          return b;
        });
        if (!found) {
          return sendJson(res, 404, { error: `Букет с ID ${id} не найден` });
        }
        await kvClient.set('catalog_bouquets', updated);
        saveKvBackup('catalog_bouquets', updated).catch(() => {});
        return sendJson(res, 200, { success: true, item: updatedItem, count: updated.length });
      }

      if (body && body.action === 'delete' && body.id) {
        const id = String(body.id).trim();
        const current = await getCurrentBouquets();
        const updated = current.filter((b) => b.id !== id);
        await kvClient.set('catalog_bouquets', updated);
        saveKvBackup('catalog_bouquets', updated).catch(() => {});
        return sendJson(res, 200, { success: true, count: updated.length });
      }

      if (body && body.action === 'toggleStock' && body.id) {
        const id = String(body.id).trim();
        const current = await getCurrentBouquets();
        let newStock = false;
        const updated = current.map((b) => {
          if (b.id === id) {
            newStock = !b.inStock;
            return { ...b, inStock: newStock };
          }
          return b;
        });
        await kvClient.set('catalog_bouquets', updated);
        saveKvBackup('catalog_bouquets', updated).catch(() => {});
        return sendJson(res, 200, { success: true, inStock: newStock, count: updated.length });
      }

      const items = Array.isArray(body)
        ? body
        : Array.isArray(body?.items)
          ? body.items
          : null;
      if (!items) {
        return sendJson(res, 400, {
          error: 'Ожидается массив букетов или валидное действие (action)',
        });
      }

      const sanitizedItems = items.map((item, idx) =>
        sanitizeSingleBouquet(item, `custom_${Date.now()}_${idx}`)
      );
      await kvClient.set('catalog_bouquets', sanitizedItems);
      saveKvBackup('catalog_bouquets', sanitizedItems).catch(() => {});
      return sendJson(res, 200, { success: true, count: sanitizedItems.length });
    } catch (e) {
      return sendJson(res, 400, {
        error: e instanceof Error ? e.message : 'Ошибка сохранения каталога',
      });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

const TIER_NAMES = ['Клиент', 'Серебряный', 'Золотой', 'Платиновый'];
const REGISTRATIONS_PER_HOUR = 5;

function normalizePhoneDigits(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  return digits;
}

function cleanText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function nonNegativeNumber(value, max) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

async function handleCustomers(req, res, body) {
  if (req.method === 'GET') {
    if (!verifyToken(bearerToken(req))) {
      return sendJson(res, 401, {
        error: 'Доступ к базе клиентов ограничен администратором салона.',
      });
    }
    try {
      const list = await kvClient.get('salon_customers');
      return sendJson(res, 200, Array.isArray(list) ? list : []);
    } catch {
      return sendJson(res, 200, []);
    }
  }

  if (req.method === 'POST') {
    if (!body || typeof body !== 'object') {
      return sendJson(res, 400, { error: 'Некорректные данные клиента' });
    }
    const isAdmin = verifyToken(bearerToken(req));
    const id = cleanText(body.id, 64);
    const phoneDigits = normalizePhoneDigits(body.phone);
    const firstName = cleanText(body.firstName, 50);
    const lastName = cleanText(body.lastName, 50);
    const birthDate = cleanText(body.birthDate, 10);

    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || phoneDigits.length !== 11 || !firstName || !lastName) {
      return sendJson(res, 400, { error: 'Некорректные данные клиента' });
    }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return sendJson(res, 400, { error: 'Некорректная дата рождения' });
    }

    if (!isAdmin) {
      try {
        const key = 'ratelimit_customers_' + getClientIp(req).replace(/[^a-zA-Z0-9_.:-]/g, '_');
        const attempts = await kvClient.incr(key);
        if (attempts === 1) await kvClient.expire(key, 3600);
        if (attempts > REGISTRATIONS_PER_HOUR) {
          return sendJson(res, 429, { error: 'Слишком много запросов. Попробуйте позже.' });
        }
      } catch {
        return sendJson(res, 503, { error: 'Сервис временно недоступен' });
      }
    }

    const phone =
      '+7 (' +
      phoneDigits.slice(1, 4) +
      ') ' +
      phoneDigits.slice(4, 7) +
      '-' +
      phoneDigits.slice(7, 9) +
      '-' +
      phoneDigits.slice(9, 11);

    try {
      const existing = ((await kvClient.get('salon_customers')) || []).filter(Boolean);
      const byId = existing.find((c) => c.id === id);
      const byPhone = existing.find((c) => normalizePhoneDigits(c.phone) === phoneDigits);

      if (!isAdmin) {
        if (byId || byPhone) {
          return sendJson(res, 409, { error: 'Клиент с таким номером уже зарегистрирован' });
        }
        const created = {
          id,
          phone,
          firstName,
          lastName,
          birthDate: birthDate || undefined,
          totalSpent: 0,
          ordersCount: 0,
          discountPercent: 0,
          tier: 'Клиент',
          orders: [],
          registeredAt: new Date().toISOString().split('T')[0],
        };
        await kvClient.set('salon_customers', [created, ...existing]);
        return sendJson(res, 200, { success: true, customer: created });
      }

      const totalSpent = nonNegativeNumber(body.totalSpent, 1e9);
      const ordersCount = nonNegativeNumber(body.ordersCount, 1e6);
      const discountPercent = nonNegativeNumber(body.discountPercent, 100);
      const tier = TIER_NAMES.includes(body.tier) ? body.tier : null;
      if (totalSpent === null || ordersCount === null || discountPercent === null || !tier) {
        return sendJson(res, 400, { error: 'Некорректные данные лояльности' });
      }
      const orders = Array.isArray(body.orders) ? body.orders.slice(0, 500) : [];
      const record = {
        id,
        phone,
        firstName,
        lastName,
        birthDate: birthDate || undefined,
        totalSpent,
        ordersCount,
        discountPercent,
        tier,
        orders,
        registeredAt:
          cleanText(body.registeredAt, 10) ||
          byId?.registeredAt ||
          new Date().toISOString().split('T')[0],
      };
      await kvClient.set('salon_customers', [record, ...existing.filter((c) => c.id !== id)]);
      return sendJson(res, 200, { success: true, customer: record });
    } catch {
      return sendJson(res, 500, { error: 'Не удалось сохранить клиента' });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

const PUBLIC_REVIEWS_STORE = 'salon_reviews';
const PENDING_REVIEWS_STORE = 'salon_reviews_pending';
const SUBMISSIONS_PER_HOUR = 3;
const MAX_PENDING = 200;

function moscowDate() {
  return new Date()
    .toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Moscow',
    })
    .replace(/\s*г\.$/, '');
}

function buildSubmittedReview(input) {
  if (!input || typeof input !== 'object') return { error: 'Некорректный отзыв' };
  const author = String(input.author ?? '').trim().slice(0, 60);
  const comment = String(input.comment ?? '').trim();
  const bouquetTitle = String(input.bouquetTitle ?? '').trim().slice(0, 120);
  const rating = Number(input.rating);

  if (!author) return { error: 'Укажите имя' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return { error: 'Оценка должна быть от 1 до 5' };
  if (comment.length < 5) return { error: 'Отзыв слишком короткий' };
  if (comment.length > 2000) return { error: 'Отзыв слишком длинный (максимум 2000 символов)' };

  return {
    review: {
      id: 'rev_' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      author,
      rating,
      date: moscowDate(),
      bouquetTitle: bouquetTitle || undefined,
      comment,
      isVerified: false,
      isPublished: false,
    },
  };
}

async function handleReviews(req, res, body, parsedUrl) {
  if (req.method === 'GET') {
    const isAdmin = verifyToken(bearerToken(req));
    const wantsPending = parsedUrl.searchParams.get('pending') === '1';

    if (wantsPending && !isAdmin) {
      return sendJson(res, 401, {
        error: 'Доступ запрещён: требуется авторизация администратора.',
      });
    }

    try {
      if (wantsPending) {
        const pending = await kvClient.get(PENDING_REVIEWS_STORE);
        return sendJson(res, 200, Array.isArray(pending) ? pending : []);
      }
      const data = await kvClient.get(PUBLIC_REVIEWS_STORE);
      if (!data) return sendJson(res, 200, null);
      if (!Array.isArray(data) || isAdmin) return sendJson(res, 200, data);
      return sendJson(
        res,
        200,
        data.filter((r) => r && r.isPublished === true)
      );
    } catch {
      return sendJson(res, 200, null);
    }
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  if (body === undefined || body === null) {
    return sendJson(res, 400, { error: 'Некорректный запрос' });
  }

  if (!Array.isArray(body) && body.action === 'create') {
    if (body.company_website || body.honeypot || body.hp_token) {
      return sendJson(res, 400, { error: 'Bad request' });
    }
    try {
      const rlStore = 'ratelimit_reviews_' + getClientIp(req).replace(/[^a-zA-Z0-9_.:-]/g, '_');
      const attempts = await kvClient.incr(rlStore);
      if (attempts === 1) await kvClient.expire(rlStore, 3600);
      if (attempts > SUBMISSIONS_PER_HOUR) {
        return sendJson(res, 429, {
          error: 'Слишком много отзывов с одного адреса. Попробуйте позже.',
        });
      }
    } catch {
      return sendJson(res, 503, { error: 'Сервис временно недоступен' });
    }

    const { review, error } = buildSubmittedReview(body.review);
    if (!review) return sendJson(res, 400, { error });

    try {
      const pending = (await kvClient.get(PENDING_REVIEWS_STORE)) || [];
      if (pending.length >= MAX_PENDING) {
        return sendJson(res, 429, { error: 'Очередь отзывов переполнена. Попробуйте позже.' });
      }
      await kvClient.set(PENDING_REVIEWS_STORE, [review, ...pending]);
      return sendJson(res, 200, { success: true, status: 'pending' });
    } catch {
      return sendJson(res, 500, { error: 'Не удалось сохранить отзыв' });
    }
  }

  if (!verifyToken(bearerToken(req))) {
    return sendJson(res, 401, {
      error: 'Доступ запрещён: требуется авторизация администратора.',
    });
  }

  if (!Array.isArray(body) && body.action === 'moderate') {
    const id = String(body.id ?? '');
    if (!id || (body.decision !== 'approve' && body.decision !== 'reject')) {
      return sendJson(res, 400, { error: 'Некорректный запрос модерации' });
    }
    try {
      const pending = (await kvClient.get(PENDING_REVIEWS_STORE)) || [];
      const target = pending.find((r) => r && r.id === id);
      if (!target) return sendJson(res, 404, { error: 'Отзыв не найден в очереди' });

      if (body.decision === 'approve') {
        const published = (await kvClient.get(PUBLIC_REVIEWS_STORE)) || [];
        await kvClient.set(PUBLIC_REVIEWS_STORE, [
          { ...target, isPublished: true, isVerified: false },
          ...published,
        ]);
      }
      await kvClient.set(
        PENDING_REVIEWS_STORE,
        pending.filter((r) => r && r.id !== id)
      );
      return sendJson(res, 200, { success: true });
    } catch {
      return sendJson(res, 500, { error: 'Не удалось обработать отзыв' });
    }
  }

  if (!Array.isArray(body)) {
    return sendJson(res, 400, { error: 'Ожидается массив отзывов' });
  }
  try {
    await kvClient.set(PUBLIC_REVIEWS_STORE, body);
    return sendJson(res, 200, { success: true, count: body.length });
  } catch {
    return sendJson(res, 500, { error: 'Failed to persist reviews' });
  }
}

async function handleSberbank(req, res) {
  if (req.method === 'GET') {
    return sendJson(res, 200, {
      merchant: {
        name: 'ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ',
        inn: '165115143005',
        ogrnip: '324169000033624',
        salonAddress: 'г. Нижнекамск, пр. Шинников, 13В',
        phone: '+7 (917) 256-32-35',
      },
      deprecated: true,
    });
  }

  if (req.method === 'POST') {
    return sendJson(res, 410, {
      error: 'Оплата переведена на защищённый шлюз ЮKassa (/api/yookassa).',
    });
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}

function sendJson(res, status, payload) {
  const str = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(str);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    const MAX_BYTES = 25 * 1024 * 1024;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BYTES) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';

  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      body = await readBody(req);
    } catch {
      return sendJson(res, 413, { error: 'Payload too large' });
    }
  }

  try {
    if (pathname === '/api/login') return await handleLogin(req, res, body);
    if (pathname === '/api/catalog') return await handleCatalog(req, res, body);
    if (pathname === '/api/customers') return await handleCustomers(req, res, body);
    if (pathname === '/api/reviews') return await handleReviews(req, res, body, parsedUrl);
    if (pathname === '/api/yookassa') return await handleYookassa(req, res, body, parsedUrl);
    if (pathname === '/api/sberbank') return await handleSberbank(req, res, body);
    if (pathname === '/api/health') return sendJson(res, 200, { ok: true });
    return sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('Unhandled API error:', err);
    return sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[sophiya-api] Listening on http://127.0.0.1:${PORT}`);
});
