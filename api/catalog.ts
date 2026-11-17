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
    /^https?:\/\/([a-zA-Z0-9_-]+\.)?github\.io(:[0-9]+)?$/,
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

function sanitizeSingleBouquet(item: any, fallbackId?: string) {
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
  const sanitized: any = {
    ...item,
    id,
    title,
    price,
  };
  if (Number.isFinite(parsedOldPrice) && parsedOldPrice > price) {
    sanitized.oldPrice = parsedOldPrice;
  } else {
    delete sanitized.oldPrice;
  }

  return sanitized;
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
      let payload = req.body;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return res.status(400).json({ error: 'Неверный формат JSON' });
        }
      }

      // Helper to fetch current KV bouquets
      const getCurrentBouquets = async (): Promise<any[]> => {
        let raw = await client.get('catalog_bouquets');
        if (typeof raw === 'string') {
          try {
            raw = JSON.parse(raw);
          } catch {}
        }
        return Array.isArray(raw) ? raw : [];
      };

      // 1. Granular Action: ADD
      if (payload && payload.action === 'add' && payload.item) {
        const single = sanitizeSingleBouquet(payload.item);
        const current = await getCurrentBouquets();
        const updated = [single, ...current.filter((b) => b.id !== single.id)];
        await client.set('catalog_bouquets', updated);
        saveKvBackup(client, 'catalog_bouquets', updated).catch(() => {});
        return res.status(200).json({ success: true, item: single, count: updated.length });
      }

      // 2. Granular Action: UPDATE
      if (payload && payload.action === 'update' && payload.id) {
        const id = String(payload.id).trim();
        const updates = payload.updates || {};
        const current = await getCurrentBouquets();
        let found = false;
        const updated = current.map((b) => {
          if (b.id === id) {
            found = true;
            const merged = { ...b, ...updates };
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
            return merged;
          }
          return b;
        });
        if (!found) {
          return res.status(404).json({ error: `Букет с ID ${id} не найден` });
        }
        await client.set('catalog_bouquets', updated);
        saveKvBackup(client, 'catalog_bouquets', updated).catch(() => {});
        return res.status(200).json({ success: true, count: updated.length });
      }

      // 3. Granular Action: DELETE
      if (payload && payload.action === 'delete' && payload.id) {
        const id = String(payload.id).trim();
        const current = await getCurrentBouquets();
        const updated = current.filter((b) => b.id !== id);
        await client.set('catalog_bouquets', updated);
        saveKvBackup(client, 'catalog_bouquets', updated).catch(() => {});
        return res.status(200).json({ success: true, count: updated.length });
      }

      // 4. Granular Action: TOGGLE STOCK
      if (payload && payload.action === 'toggleStock' && payload.id) {
        const id = String(payload.id).trim();
        const current = await getCurrentBouquets();
        let newStock = false;
        const updated = current.map((b) => {
          if (b.id === id) {
            newStock = !b.inStock;
            return { ...b, inStock: newStock };
          }
          return b;
        });
        await client.set('catalog_bouquets', updated);
        saveKvBackup(client, 'catalog_bouquets', updated).catch(() => {});
        return res.status(200).json({ success: true, inStock: newStock, count: updated.length });
      }

      // 5. Batch / Array Replacement (Backward Compatibility)
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : null;
      if (!items) {
        return res.status(400).json({ error: 'Ожидается массив букетов или валидное действие (action)' });
      }

      const sanitizedItems = items.map((item, idx) =>
        sanitizeSingleBouquet(item, `custom_${Date.now()}_${idx}`)
      );

      // Save directly to primary key
      await client.set('catalog_bouquets', sanitizedItems);

      // Save rolling backup asynchronously without blocking response
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
