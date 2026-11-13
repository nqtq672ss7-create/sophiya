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

async function notifyTelegramReview(review: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || !review) return;

  const text =
    '*НОВЫЙ ОТЗЫВ НА МОДЕРАЦИИ «СОФИЯ»*\n\n' +
    `*Автор:* ${escapeMarkdown(review.author)}\n` +
    `*Оценка:* ${escapeMarkdown(review.rating)}/5\n` +
    (review.bouquetTitle ? `*Букет:* ${escapeMarkdown(review.bouquetTitle)}\n` : '') +
    `*Отзыв:* «${escapeMarkdown(review.comment)}»\n\n` +
    'Опубликовать или удалить можно в CRM, вкладка «Отзывы клиентов».';

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
    });
  } catch (err) {
    console.error('Failed to dispatch Telegram review notice:', err);
  }
}

const PUBLIC_KEY = 'salon_reviews';
const PENDING_KEY = 'salon_reviews_pending';
const SUBMISSIONS_PER_HOUR = 3;
const MAX_PENDING = 200;

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (typeof first === 'string' && first.trim()) return first.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function bearerToken(req: VercelRequest): string {
  const authHeader = req.headers.authorization;
  return typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';
}

function moscowDate(): string {
  return new Date()
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' })
    .replace(/\s*г\.$/, '');
}

function parseBody(req: VercelRequest): any {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return undefined;
  }
}

// Builds a review from untrusted input. Returns an error string when invalid.
function buildSubmittedReview(input: any): { review?: any; error?: string } {
  if (!input || typeof input !== 'object') return { error: 'Некорректный отзыв' };
  const author = String(input.author ?? '').trim().slice(0, 60);
  const comment = String(input.comment ?? '').trim();
  const bouquetTitle = String(input.bouquetTitle ?? '').trim().slice(0, 120);
  const rating = Number(input.rating);

  if (!author) return { error: 'Укажите имя' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Оценка должна быть от 1 до 5' };
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();

  // 1. GET: published reviews are public; admin also gets hidden ones and the pending queue
  if (req.method === 'GET') {
    const isAdmin = verifyToken(bearerToken(req));
    const wantsPending = String(req.query?.pending ?? '') === '1';

    if (wantsPending && !isAdmin) {
      return res.status(401).json({ error: 'Доступ запрещён: требуется авторизация администратора.' });
    }

    try {
      if (wantsPending) {
        const pending = await client.get<any[]>(PENDING_KEY);
        return res.status(200).json(Array.isArray(pending) ? pending : []);
      }
      const data = await client.get<any[]>(PUBLIC_KEY);
      if (!data) return res.status(200).json(null);
      if (!Array.isArray(data) || isAdmin) return res.status(200).json(data);
      return res.status(200).json(data.filter((r) => r && r.isPublished === true));
    } catch (e) {
      console.error('Error fetching reviews from KV:', e);
      return res.status(200).json(null);
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseBody(req);
  if (body === undefined || body === null) {
    return res.status(400).json({ error: 'Некорректный запрос' });
  }

  // 2a. POST action=create: public, goes to the moderation queue only
  if (!Array.isArray(body) && body.action === 'create') {
    if (body.company_website || body.honeypot || body.hp_token) {
      return res.status(400).json({ error: 'Bad request' });
    }

    try {
      const key = 'ratelimit_reviews_' + getClientIp(req).replace(/[^a-zA-Z0-9_.:-]/g, '_');
      const attempts = await client.incr(key);
      if (attempts === 1) await client.expire(key, 3600);
      if (attempts > SUBMISSIONS_PER_HOUR) {
        return res.status(429).json({ error: 'Слишком много отзывов с одного адреса. Попробуйте позже.' });
      }
    } catch (err) {
      console.error('Rate limit store unavailable:', err);
      return res.status(503).json({ error: 'Сервис временно недоступен' });
    }

    const { review, error } = buildSubmittedReview(body.review);
    if (!review) return res.status(400).json({ error });

    try {
      const pending = (await client.get<any[]>(PENDING_KEY)) || [];
      if (pending.length >= MAX_PENDING) {
        return res.status(429).json({ error: 'Очередь отзывов переполнена. Попробуйте позже.' });
      }
      await client.set(PENDING_KEY, [review, ...pending]);
      notifyTelegramReview(review).catch(() => {});
      return res.status(200).json({ success: true, status: 'pending' });
    } catch (e) {
      console.error('Error saving pending review to KV:', e);
      return res.status(500).json({ error: 'Не удалось сохранить отзыв' });
    }
  }

  // Everything below is admin-only
  if (!verifyToken(bearerToken(req))) {
    return res.status(401).json({
      error: 'Доступ запрещён: требуется авторизация администратора.',
    });
  }

  // 2b. POST action=moderate: approve or reject a pending review
  if (!Array.isArray(body) && body.action === 'moderate') {
    const id = String(body.id ?? '');
    if (!id || (body.decision !== 'approve' && body.decision !== 'reject')) {
      return res.status(400).json({ error: 'Некорректный запрос модерации' });
    }
    try {
      const pending = (await client.get<any[]>(PENDING_KEY)) || [];
      const target = pending.find((r) => r && r.id === id);
      if (!target) return res.status(404).json({ error: 'Отзыв не найден в очереди' });

      if (body.decision === 'approve') {
        const published = (await client.get<any[]>(PUBLIC_KEY)) || [];
        await client.set(PUBLIC_KEY, [{ ...target, isPublished: true, isVerified: false }, ...published]);
      }
      await client.set(PENDING_KEY, pending.filter((r) => r && r.id !== id));
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('Error moderating review:', e);
      return res.status(500).json({ error: 'Не удалось обработать отзыв' });
    }
  }

  // 2c. POST array: admin replaces the public list (the pending queue is untouched)
  if (!Array.isArray(body)) {
    return res.status(400).json({ error: 'Ожидается массив отзывов' });
  }
  try {
    await client.set(PUBLIC_KEY, body);
    return res.status(200).json({ success: true, count: body.length });
  } catch (e) {
    console.error('Error saving reviews to KV:', e);
    return res.status(500).json({ error: 'Failed to persist reviews' });
  }
}
