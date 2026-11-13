import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';
import crypto from 'crypto';

const ALLOWED_ORIGINS = [
  'https://xn----ctbjn3arftl7c8b.xn--p1ai',
  'https://цветы-софия.рф',
  'https://sitesophiya.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];

const SECRET_SALT =
  process.env.AUTH_SECRET ||
  process.env.KV_REST_API_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  'sophiya_sovereign_flower_vault_key_2026';

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
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
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

async function notifyTelegram(customer: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const isNew = !customer.ordersCount || customer.ordersCount === 0;
  const title = isNew
    ? '*НОВЫЙ КЛИЕНТ В САЛОНЕ «СОФИЯ»*'
    : '*ОБНОВЛЕНИЕ ДАННЫХ КЛИЕНТА «СОФИЯ»*';

  const text =
    `${title}\n\n` +
    `*Клиент:* ${customer.firstName} ${customer.lastName}\n` +
    `*Телефон:* \`${customer.phone}\`\n` +
    `*День рождения:* ${customer.birthDate || 'Не указан'}\n` +
    `*Дата регистрации:* ${customer.registeredAt || new Date().toISOString().split('T')[0]}\n` +
    `*Время (МСК):* ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('Failed to dispatch Telegram backup notice:', err);
  }
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

  // 2. POST: Upsert customer (registration / loyalty club)
  if (req.method === 'POST') {
    try {
      const customer = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!customer || !customer.id || !customer.phone) {
        return res.status(400).json({ error: 'Некорректные данные клиента' });
      }

      customer.firstName = String(customer.firstName || '').slice(0, 50).trim();
      customer.lastName = String(customer.lastName || '').slice(0, 50).trim();
      customer.phone = String(customer.phone || '').slice(0, 30).trim();

      notifyTelegram(customer).catch(() => {});

      try {
        const existing = (await client.get<any[]>('salon_customers')) || [];
        const updated = [customer, ...existing.filter((c) => c.id !== customer.id)];
        await client.set('salon_customers', updated);
      } catch (err) {
        console.error('Error saving customer to KV:', err);
      }

      return res.status(200).json({ success: true, customer });
    } catch (e) {
      console.error('Error saving customer in API:', e);
      return res.status(500).json({ error: 'Failed to persist customer' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
