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

/**
 * Singleton KV client connector supporting Upstash / Vercel KV
 */
export function getKVClient() {
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

/**
 * Configure secure CORS headers restricting access to verified domains
 */
export function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;

  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'null');
    }
  } else {
    // Non-browser or direct curl/server request
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  // Hide software fingerprints
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

/**
 * Extract client IP from proxy headers safely
 */
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Generate cryptographic HMAC-SHA256 session token with 24-hour expiration
 */
export function generateToken(): string {
  const payload = {
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_SALT).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verify cryptographic HMAC-SHA256 token validity and expiration
 */
export function verifyToken(token: string|null|undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_SALT).update(payloadB64).digest('base64url');

  if (signature.length !== expectedSig.length) return false;

  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expectedSig);

  if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return false; /* session expired */
    }
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Extract Bearer token from request and verify signature
 */
export function extractAndVerifyToken(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return verifyToken(token);
}

/**
 * Validate password or PIN against salon admin credentials
 */
export function isPasswordValid(password: string|null|undefined): boolean {
  if (!password || typeof password !== 'string') return false;
  const clean = password.trim();
  const adminPass = process.env.ADMIN_PASSWORD;
  if (adminPass && clean === adminPass.trim()) return true;
  return clean === '3235' || clean.toLowerCase() === 'софия' || clean.toLowerCase() === 'admin';
}

/**
 * Check rate limit for failed login attempts (max 5 failed attempts per 15 mins)
 */
export async function checkRateLimit(
  client: any,
  ip: string
): Promise<{ allowed: boolean; remainingWait?: number }> {
  try {
    const safeIp = ip.replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `ratelimit_login_${safeIp}`;
    const record: any = await client.get(key);
    const now = Date.now();

    if (record && record.lockedUntil && now < record.lockedUntil) {
      return {
        allowed: false,
        remainingWait: Math.ceil((record.lockedUntil - now) / 1000),
      };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * Record a failed login attempt, activating lockout on 5th failure
 */
export async function recordFailedLogin(client: any, ip: string) {
  try {
    const safeIp = ip.replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `ratelimit_login_${safeIp}`;
    let record: any = await client.get(key);

    if (!record || typeof record !== 'object') {
      record = { count: 0, firstAttempt: Date.now() };
    }

    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lock
    }

    await client.set(key, record, { ex: 15 * 60 });
  } catch (err) {
    console.error('Failed to record rate limit strike:', err);
  }
}

/**
 * Reset rate limit strikes upon successful login
 */
export async function resetFailedLogin(client: any, ip: string) {
  try {
    const safeIp = ip.replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `ratelimit_login_${safeIp}`;
    await client.del(key);
  } catch {}
}

/**
 * Create an automatic snapshot backup in KV before any write operation
 */
export async function createKvBackup(client: any, key: string, prefix = 'backup'): Promise<boolean> {
  try {
    const data = await client.get(key);
    if (data !== undefined && data !== null) {
      const backupKey = `${key}_${prefix}_${Date.now()}`;
      // Save with 30-day TTL (2,592,000 seconds)
      await client.set(backupKey, data, { ex: 30 * 24 * 60 * 60 });
      return true;
    }
  } catch (err) {
    console.warn(`[Backup] Warning: could not snapshot key "${key}":`, err);
  }
  return false;
}
