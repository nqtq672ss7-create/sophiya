import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  setSecureCors,
  getKVClient,
  extractAndVerifyToken,
  createKvBackup,
} from './_security';

// Telegram backup notification for reviews
async function notifyTelegramReview(review: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || !review) return;

  const ratingVal = Math.max(1, Math.min(5, review.rating || 5));
  const text =
    `*НОВЫЙ ОТЗЫВ НА САЙТЕ «СОФИЯ»*\n\n` +
    `*Автор:* ${review.author || 'Гость'}\n` +
    `*Оценка:* ${ratingVal}/5\n` +
    (review.bouquetTitle ? `*Букет:* ${review.bouquetTitle}\n` : '') +
    `*Отзыв:* «${review.comment || ''}»\n\n` +
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
    console.error('Failed to dispatch Telegram review notice:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();

  // 1. GET: Fetch global reviews (public)
  if (req.method === 'GET') {
    try {
      const data = await client.get('salon_reviews');
      if (data) {
        return res.status(200).json(data);
      }
      return res.status(200).json(null);
    } catch (e) {
      console.error('Error fetching reviews from KV:', e);
      return res.status(200).json(null);
    }
  }

  // 2. POST: Admin review moderation & creation (authenticated)
  if (req.method === 'POST') {
    if (!extractAndVerifyToken(req)) {
      return res.status(401).json({
        error: 'Доступ запрещён: требуется авторизация администратора.',
      });
    }

    try {
      const items = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Ожидается массив отзывов' });
      }

      await createKvBackup(client, 'salon_reviews', 'pre_write');
      await client.set('salon_reviews', items);

      if (items.length > 0 && items[0]?.date === 'Сегодня') {
        notifyTelegramReview(items[0]).catch(() => {});
      }

      return res.status(200).json({ success: true, count: items.length });
    } catch (e) {
      console.error('Error saving reviews to KV:', e);
      return res.status(500).json({ error: 'Failed to persist reviews' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
