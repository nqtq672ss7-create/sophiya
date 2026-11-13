import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  setSecureCors,
  getKVClient,
  extractAndVerifyToken,
  createKvBackup,
} from './_security';

// Telegram notification for new customer registrations
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
    if (!extractAndVerifyToken(req)) {
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

      // Input sanitization
      customer.firstName = String(customer.firstName || '').slice(0, 50).trim();
      customer.lastName = String(customer.lastName || '').slice(0, 50).trim();
      customer.phone = String(customer.phone || '').slice(0, 30).trim();

      // Telegram notification
      notifyTelegram(customer).catch(() => {});

      try {
        await createKvBackup(client, 'salon_customers', 'pre_write');
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
