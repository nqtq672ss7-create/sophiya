import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';

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

// Telegram backup notification for reviews
async function notifyTelegramReview(review: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || !review) return;

  const stars = '⭐'.repeat(Math.max(1, Math.min(5, review.rating || 5)));
  const text =
    `💐 *НОВЫЙ ОТЗЫВ НА САЙТЕ «СОФИЯ»!*\n\n` +
    `👤 *Автор:* ${review.author || 'Гость'}\n` +
    `✨ *Оценка:* ${stars} (${review.rating || 5}/5)\n` +
    (review.bouquetTitle ? `🌸 *Букет:* ${review.bouquetTitle}\n` : '') +
    `💬 *Отзыв:* «${review.comment || ''}»\n\n` +
    `⏰ *Время (МСК):* ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();

  // 1. GET: Fetch global reviews
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

  // 2. POST: Update global reviews
  if (req.method === 'POST') {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Expected array of reviews' });
      }

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
