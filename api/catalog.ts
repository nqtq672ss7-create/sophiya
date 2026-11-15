import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';
import crypto from 'crypto';

// Signing key comes only from the environment. No fallback: if it is missing or
// short, token signing and verification fail closed.
const SECRET_SALT = process.env.AUTH_SECRET || '';
const SECRET_OK = SECRET_SALT.length >= 32;

function getKVClient() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.STORAGE_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.STORAGE_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return createClient({ url, token });
  }
  return kv;
}

function isAllowedOrigin(origin: string|undefined): boolean {
  if (!origin) return true;
  let decoded = origin;
  try {
    decoded = decodeURI(origin);
  } catch {}

  const clean = decoded.toLowerCase().trim().replace(/\/+$/, '');
  const raw = origin.toLowerCase().trim().replace(/\/+$/, '');

  const allowedPatterns = [
    /^https?:\/\/(www\.)?xn----ctbjn3arftl7c8b\.xn--p1ai(:[0-9]+)?$/,
    /^https?:\/\/(www\.)?цветы-софия\.рф(:[0-9]+)?$/,
    /^https?:\/\/sitesophiya\.vercel\.app(:[0-9]+)?$/,
    /^https?:\/\/localhost(:[0-9]+)?$/,
    /^https?:\/\/127\.0\.0\.1(:[0-9]+)?$/,
  ];

  return allowedPatterns.some((pattern) => pattern.test(clean) || pattern.test(raw));
}

function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

function verifyToken(token: string|null|undefined): boolean {
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

async function saveKvBackup(client: any, key: string, data: any): Promise<void> {
  try {
    const backupKey = `${key}_last_backup`;
    await client.set(backupKey, data, { ex: 30 * 24 * 60 * 60 });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Backup] Warning: could not snapshot key "${key}":`, err);
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();

  // 1. GET: Public high-speed read for customers and search engine bots
  if (req.method === 'GET') {
    try {
      let data = await client.get('catalog_bouquets');
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {}
      }
      if (data !== undefined && data !== null) {
        return res.status(200).json(data);
      }
      return res.status(200).json(null);
    } catch (e) {
      console.error('Error fetching catalog from KV:', e);
      return res.status(200).json(null);
    }
  }

  // 2. POST: Protected admin-only write with RBAC token verification & automatic backup
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization;
    const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

    if (!verifyToken(token)) {
      return res.status(401).json({
        error: 'Доступ запрещён: требуется авторизация администратора.',
      });
    }

    try {
      let items = req.body;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {
          return res.status(400).json({ error: 'Неверный формат JSON' });
        }
      }

      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Ожидается массив букетов' });
      }

      const sanitizedItems = items.map((item, idx) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Элемент #${idx + 1} имеет неверный формат`);
        }
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        if (!title) {
          throw new Error(`У букета #${idx + 1} отсутствует название`);
        }
        const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `custom_${Date.now()}_${idx}`;
        const rawPrice = typeof item.price === 'string' ? item.price.replace(/\s+/g, '') : item.price;
        const price = Number(rawPrice) || 0;

        return {
          ...item,
          id,
          title,
          price,
        };
      });

      // 1. Save directly to primary key (fast, reliable)
      await client.set('catalog_bouquets', sanitizedItems);

      // 2. Save rolling backup asynchronously without blocking response
      saveKvBackup(client, 'catalog_bouquets', sanitizedItems).catch(() => {});

      return res.status(200).json({ success: true, count: sanitizedItems.length });
    } catch (e) {
      console.error('Error saving catalog to KV:', e);
      const message = e instanceof Error ? e.message : 'Ошибка сохранения каталога';
      return res.status(400).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
