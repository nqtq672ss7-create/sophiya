import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Telegram backup notification
async function notifyTelegram(customer: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const isNew = !customer.ordersCount || customer.ordersCount === 0;
  const title = isNew
    ? '🌸 *НОВЫЙ КЛИЕНТ В САЛОНЕ «СОФИЯ»!*'
    : '💐 *ОБНОВЛЕНИЕ ДАННЫХ КЛИЕНТА «СОФИЯ»*';

  const text =
    `${title}\n\n` +
    `👤 *Клиент:* ${customer.firstName} ${customer.lastName}\n` +
    `📱 *Телефон:* \`${customer.phone}\`\n` +
    `🎂 *День рождения:* ${customer.birthDate || 'Не указан'}\n` +
    `📅 *Дата регистрации:* ${customer.registeredAt || new Date().toISOString().split('T')[0]}\n` +
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
    console.error('Failed to dispatch Telegram backup notice:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Fetch all customers
  if (req.method === 'GET') {
    try {
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const list = await kv.get<any[]>('salon_customers');
        if (Array.isArray(list)) {
          return res.status(200).json(list);
        }
      }
      return res.status(200).json([]);
    } catch (e) {
      console.error('Error fetching customers from Vercel KV:', e);
      return res.status(200).json([]);
    }
  }

  // 2. POST: Upsert customer
  if (req.method === 'POST') {
    try {
      const customer = req.body;
      if (!customer || !customer.id || !customer.phone) {
        return res.status(400).json({ error: 'Invalid customer data' });
      }

      // Notify Telegram
      notifyTelegram(customer).catch(() => {});

      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const existing = (await kv.get<any[]>('salon_customers')) || [];
        const updated = [customer, ...existing.filter((c) => c.id !== customer.id)];
        await kv.set('salon_customers', updated);
      }

      return res.status(200).json({ success: true, customer });
    } catch (e) {
      console.error('Error saving customer to Vercel KV:', e);
      return res.status(500).json({ error: 'Failed to persist customer' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
