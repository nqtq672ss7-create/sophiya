import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';
import crypto from 'crypto';

const SECRET_SALT = process.env.AUTH_SECRET || '';
const SECRET_OK = SECRET_SALT.length >= 32;
const CALLBACKS_STORE = 'sophiya_callbacks_v1';
const MAX_CALLBACKS_PER_HOUR = 4;
const MAX_STORED_CALLBACKS = 200;

export interface CallbackLead {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  comment?: string;
  status: 'new' | 'done';
}

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

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  let decoded = origin;
  try {
    decoded = decodeURI(origin);
  } catch {}

  const clean = decoded.toLowerCase().trim().replace(/\/+$/, '');
  const raw = origin.toLowerCase().trim().replace(/\/+$/, '');

  const allowedPatterns: RegExp[] = [
    /^https:\/\/(www\.)?xn----ctbjn3arftl7c8b\.xn--p1ai$/,
    /^https:\/\/(www\.)?цветы-софия\.рф$/,
  ];
  if (process.env.NODE_ENV !== 'production') {
    allowedPatterns.push(/^http:\/\/localhost(:[0-9]+)?$/, /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/);
  }

  return allowedPatterns.some((pattern) => pattern.test(clean) || pattern.test(raw));
}

function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
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
  res.removeHeader('X-Powered-By');
}

function getClientIp(req: VercelRequest): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
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

function verifyToken(token: string | null | undefined): boolean {
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

function bearerToken(req: VercelRequest): string {
  const authHeader = req.headers.authorization;
  return typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
}

function normalizePhoneDigits(phone: unknown): string {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 10) return '7' + digits;
  return digits;
}

function formatRussianPhone(digits11: string): string {
  return `+7 (${digits11.slice(1, 4)}) ${digits11.slice(4, 7)}-${digits11.slice(7, 9)}-${digits11.slice(9, 11)}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();

  if (req.method === 'GET') {
    if (!verifyToken(bearerToken(req))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const list = await client.get<CallbackLead[]>(CALLBACKS_STORE);
      return res.status(200).json({ callbacks: Array.isArray(list) ? list : [] });
    } catch {
      return res.status(503).json({ error: 'Сервис заявок временно недоступен' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body: any;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Некорректный формат запроса' });
  }

  if (body?.action === 'done' || body?.action === 'delete') {
    if (!verifyToken(bearerToken(req))) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const targetId = String(body?.id || '').trim();
    if (!targetId) {
      return res.status(400).json({ error: 'Не указан id заявки' });
    }
    try {
      const existing: CallbackLead[] = (await client.get<CallbackLead[]>(CALLBACKS_STORE)) || [];
      const updated =
        body.action === 'delete'
          ? existing.filter((item) => item?.id !== targetId)
          : existing.map((item) => (item?.id === targetId ? { ...item, status: 'done' as const } : item));
      await client.set(CALLBACKS_STORE, updated);
      return res.status(200).json({ ok: true, callbacks: updated });
    } catch {
      return res.status(503).json({ error: 'Не удалось обновить заявку' });
    }
  }

  if (body?.company_website || body?.honeypot || body?.hp_token) {
    return res.status(400).json({ error: 'Bad request' });
  }

  if (body?.consent !== true) {
    return res.status(400).json({ error: 'Подтвердите согласие на обработку персональных данных' });
  }

  const digits = normalizePhoneDigits(body?.phone);
  if (!/^7\d{10}$/.test(digits)) {
    return res.status(400).json({ error: 'Укажите корректный российский номер телефона (+7...)' });
  }

  const ip = getClientIp(req);
  try {
    const rlStore = 'ratelimit_callback_' + ip.replace(/[^a-zA-Z0-9_.:-]/g, '_');
    const count = await client.incr(rlStore);
    if (count === 1) await client.expire(rlStore, 3600);
    if (count > MAX_CALLBACKS_PER_HOUR) {
      return res.status(429).json({
        error: 'Слишком много заявок с одного адреса. Позвоните нам напрямую: +7 (917) 256-32-35.',
      });
    }
  } catch {
    return res.status(503).json({ error: 'Сервис заявок временно недоступен' });
  }

  const name = String(body?.name || '').trim().slice(0, 80) || 'Клиент';
  const comment = String(body?.comment || '').trim().slice(0, 500);
  const createdAt = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lead: CallbackLead = {
    id: `cb_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
    createdAt,
    name,
    phone: formatRussianPhone(digits),
    ...(comment ? { comment } : {}),
    status: 'new',
  };

  try {
    const existingRaw = await client.get<CallbackLead[]>(CALLBACKS_STORE);
    const existing = Array.isArray(existingRaw) ? existingRaw : [];
    const updated = [lead, ...existing].slice(0, MAX_STORED_CALLBACKS);
    await client.set(CALLBACKS_STORE, updated);
    return res.status(200).json({ ok: true, id: lead.id });
  } catch {
    return res.status(503).json({ error: 'Не удалось сохранить заявку. Попробуйте снова.' });
  }
}
