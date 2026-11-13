import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';
import crypto from 'crypto';

const ALLOWED_ORIGINS = [
  'https://xn----ctbjn3arftl7c8b.xn--p1ai',
  'https://цветы-софия.рф',
  'https://sitesophiya.vercel.app',
];

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

function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'null');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
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

async function createKvBackup(client: any, key: string): Promise<boolean> {
  try {
    const data = await client.get(key);
    if (data !== undefined && data !== null) {
      const backupKey = `${key}_pre_write_${Date.now()}`;
      await client.set(backupKey, data, { ex: 30 * 24 * 60 * 60 });
      return true;
    }
  } catch (err) {
    console.warn(`[Backup] Warning: could not snapshot key "${key}":`, err);
  }
  return false;
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

      for (const item of items) {
        if (!item || typeof item !== 'object' || !item.id || !item.title) {
          return res.status(400).json({ error: 'Некорректная структура элементов букета' });
        }
      }

      await createKvBackup(client, 'catalog_bouquets');
      await client.set('catalog_bouquets', items);

      return res.status(200).json({ success: true, count: items.length });
    } catch (e) {
      console.error('Error saving catalog to KV:', e);
      return res.status(500).json({ error: 'Ошибка сохранения каталога' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
