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

function escapeMarkdown(value: unknown): string {
  return String(value ?? '').replace(/([_*`\[\]()~>#+\-=|{}.!\\])/g, '\\$1');
}

async function notifyTelegram(customer: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    '*НОВЫЙ КЛИЕНТ В САЛОНЕ «СОФИЯ»*\n\n' +
    `*Клиент:* ${escapeMarkdown(customer.firstName)} ${escapeMarkdown(customer.lastName)}\n` +
    `*Телефон:* ${escapeMarkdown(customer.phone)}\n` +
    `*День рождения:* ${escapeMarkdown(customer.birthDate || 'Не указан')}\n` +
    `*Дата регистрации:* ${escapeMarkdown(customer.registeredAt)}\n` +
    `*Время \\(МСК\\):* ${escapeMarkdown(new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }))}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
    });
  } catch (err) {
    console.error('Failed to dispatch Telegram notice:', err);
  }
}

const TIER_NAMES = ['Клиент', 'Серебряный', 'Золотой', 'Платиновый'];
const REGISTRATIONS_PER_HOUR = 5;

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof first === 'string' && first.trim()) return first.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function normalizePhoneDigits(phone: unknown): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  return digits;
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function nonNegativeNumber(value: unknown, max: number): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();

  // 1. GET: Admin-only access to customer PII (phone numbers, full names)
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

    if (!verifyToken(token)) {
      return res.status(401).json({
        error: 'Доступ к базе клиентов ограничен администратором салона.',
      });
    }

    try {
      const list = await client.get<any[]>('salon_customers');
      if (Array.isArray(list)) {
        return res.status(200).json(list);
      }
      return res.status(200).json([]);
    } catch (e) {
      console.error('Error fetching customers from KV:', e);
      return res.status(200).json([]);
    }
  }

  // 2. POST: public registration (create-only) or admin update
  if (req.method === 'POST') {
    let input: any;
    try {
      input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Некорректные данные клиента' });
    }
    if (!input || typeof input !== 'object') {
      return res.status(400).json({ error: 'Некорректные данные клиента' });
    }

    const authHeader = req.headers.authorization;
    const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
    const isAdmin = verifyToken(token);

    const id = cleanText(input.id, 64);
    const phoneDigits = normalizePhoneDigits(input.phone);
    const firstName = cleanText(input.firstName, 50);
    const lastName = cleanText(input.lastName, 50);
    const birthDate = cleanText(input.birthDate, 10);

    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || phoneDigits.length !== 11 || !firstName || !lastName) {
      return res.status(400).json({ error: 'Некорректные данные клиента' });
    }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return res.status(400).json({ error: 'Некорректная дата рождения' });
    }

    if (!isAdmin) {
      try {
        const key = 'ratelimit_customers_' + getClientIp(req).replace(/[^a-zA-Z0-9_.:-]/g, '_');
        const attempts = await client.incr(key);
        if (attempts === 1) await client.expire(key, 3600);
        if (attempts > REGISTRATIONS_PER_HOUR) {
          return res.status(429).json({ error: 'Слишком много запросов. Попробуйте позже.' });
        }
      } catch (err) {
        console.error('Rate limit store unavailable:', err);
        return res.status(503).json({ error: 'Сервис временно недоступен' });
      }
    }

    const phone = '+7 (' + phoneDigits.slice(1, 4) + ') ' + phoneDigits.slice(4, 7) + '-' + phoneDigits.slice(7, 9) + '-' + phoneDigits.slice(9, 11);

    try {
      const existing = ((await client.get<any[]>('salon_customers')) || []).filter(Boolean);
      const byId = existing.find((c) => c.id === id);
      const byPhone = existing.find((c) => normalizePhoneDigits(c.phone) === phoneDigits);

      if (!isAdmin) {
        // Public callers may only create. They cannot touch existing records or loyalty data.
        if (byId || byPhone) {
          return res.status(409).json({ error: 'Клиент с таким номером уже зарегистрирован' });
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
          orders: [] as unknown[],
          registeredAt: new Date().toISOString().split('T')[0],
        };
        await client.set('salon_customers', [created, ...existing]);
        notifyTelegram(created).catch(() => {});
        return res.status(200).json({ success: true, customer: created });
      }

      // Admin update: loyalty fields are validated, nothing else is trusted.
      const totalSpent = nonNegativeNumber(input.totalSpent, 1e9);
      const ordersCount = nonNegativeNumber(input.ordersCount, 1e6);
      const discountPercent = nonNegativeNumber(input.discountPercent, 100);
      const tier = TIER_NAMES.includes(input.tier) ? input.tier : null;
      if (totalSpent === null || ordersCount === null || discountPercent === null || !tier) {
        return res.status(400).json({ error: 'Некорректные данные лояльности' });
      }
      const orders = Array.isArray(input.orders) ? input.orders.slice(0, 500) : [];
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
        registeredAt: cleanText(input.registeredAt, 10) || byId?.registeredAt || new Date().toISOString().split('T')[0],
      };
      await client.set('salon_customers', [record, ...existing.filter((c) => c.id !== id)]);
      return res.status(200).json({ success: true, customer: record });
    } catch (err) {
      console.error('Error saving customer to KV:', err);
      return res.status(500).json({ error: 'Не удалось сохранить клиента' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
