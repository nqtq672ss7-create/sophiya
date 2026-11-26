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

function generateToken(): string {
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

function isPasswordValid(password: string | null | undefined): boolean {
  const adminPass = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPass) return false;
  if (!password || typeof password !== 'string') return false;
  const given = crypto.createHash('sha256').update(password.trim()).digest();
  const expected = crypto.createHash('sha256').update(adminPass).digest();
  return crypto.timingSafeEqual(given, expected);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SECRET_OK || !process.env.ADMIN_PASSWORD?.trim()) {
    console.error('Admin login is not configured: set ADMIN_PASSWORD and AUTH_SECRET (32+ chars).');
    return res.status(503).json({ error: 'Вход администратора не настроен на сервере.' });
  }

  const client = getKVClient();
  const ip = getClientIp(req);
  const safeIp = ip.replace(/[^a-zA-Z0-9_.:-]/g, '_');
  const rlStore = `ratelimit_login_${safeIp}`;

  let body: any;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return res.status(400).json({ error: 'Bad request' });
  }
  if (body.company_website || body.honeypot || body.hp_token) {
    return res.status(400).json({ error: 'Bad request' });
  }

  // Fail-closed brute-force rate limiting check
  let existingRecord: any = null;
  try {
    existingRecord = await client.get(rlStore);
    const now = Date.now();
    if (existingRecord && existingRecord.lockedUntil && now < existingRecord.lockedUntil) {
      const remainingWait = Math.ceil((existingRecord.lockedUntil - now) / 1000);
      return res.status(429).json({
        error: `Слишком много попыток входа. Доступ заблокирован на ${remainingWait} сек.`,
        retryAfter: remainingWait,
      });
    }
  } catch {
    return res.status(503).json({
      error: 'Сервис авторизации временно недоступен. Попробуйте позже.',
    });
  }

  const password = body.password || body.pin;
  if (!isPasswordValid(password)) {
    try {
      let record: any = existingRecord;
      if (!record || typeof record !== 'object') {
        record = { count: 0, firstAttempt: Date.now() };
      }
      record.count += 1;
      if (record.count >= 5) {
        record.lockedUntil = Date.now() + 15 * 60 * 1000;
      }
      await client.set(rlStore, record, { ex: 15 * 60 });
    } catch {
      return res.status(503).json({
        error: 'Сервис авторизации временно недоступен. Попробуйте позже.',
      });
    }

    return res.status(401).json({
      error: 'Неверный PIN-код или пароль доступа.',
    });
  }

  try {
    await client.del(rlStore);
  } catch {}

  const token = generateToken();
  return res.status(200).json({
    success: true,
    token,
    role: 'admin',
    expiresIn: '24h',
  });
}
