import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  setSecureCors,
  getKVClient,
  getClientIp,
  checkRateLimit,
  recordFailedLogin,
  resetFailedLogin,
  generateToken,
  isPasswordValid,
} from '../_security';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = getKVClient();
  const ip = getClientIp(req);

  // 1. Anti-bot Honeypot trap: bots fill hidden fields
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (body.company_website || body.honeypot || body.hp_token) {
    return res.status(400).json({ error: 'Bad request' });
  }

  // 2. Brute-force Rate Limiting (max 5 failed attempts per 15 mins)
  const rateLimit = await checkRateLimit(client, ip);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Слишком много попыток входа. Доступ временно ограничен на ${rateLimit.remainingWait || 900} сек. для защиты от подбора.`,
      retryAfter: rateLimit.remainingWait,
    });
  }

  // 3. Credential verification (server-side, timing-safe)
  const password = body.password || body.pin;
  if (!isPasswordValid(password)) {
    await recordFailedLogin(client, ip);
    return res.status(401).json({
      error: 'Неверный PIN-код или пароль доступа.',
    });
  }

  // 4. Success: Clear rate-limit strikes, issue cryptographic token
  await resetFailedLogin(client, ip);
  const token = generateToken();

  return res.status(200).json({
    success: true,
    token,
    role: 'admin',
    expiresIn: '24h',
  });
}
