import type { VercelRequest, VercelResponse } from '@vercel/node';

// Persistent Cloud DB Endpoint fallback (KVdb bucket dedicated to цветы-софия.рф)
const KVDB_BUCKET_ID = 'sophiya_salon_customers_v1';
const KVDB_ENDPOINT = `https://kvdb.io/${KVDB_BUCKET_ID}/customers_list`;

// Send instant Telegram notification to the salon owner so no client is ever lost
async function notifyTelegram(customer: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const isNew = !customer.ordersCount || customer.ordersCount === 0;
  const title = isNew
    ? '🌸 *НОВАЯ КЛУБНАЯ КАРТА В САЛОНЕ «СОФИЯ»!*'
    : '💐 *ОБНОВЛЕНИЕ ДАННЫХ КЛИЕНТА «СОФИЯ»*';

  const text =
    `${title}\n\n` +
    `👤 *Клиент:* ${customer.firstName} ${customer.lastName}\n` +
    `📱 *Телефон:* \`${customer.phone}\`\n` +
    `🎂 *День рождения:* ${customer.birthDate || 'Не указан'}\n` +
    `💳 *Статус лояльности:* ${customer.tier} (${customer.discountPercent}% скидка)\n` +
    `💰 *Сумма покупок:* ${customer.totalSpent || 0} ₽ (${customer.ordersCount || 0} заказов)\n` +
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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Fetch all customers
  if (req.method === 'GET') {
    try {
      // 1.1 Supabase PostgreSQL
      if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/customers?select=*`, {
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
          },
        });
        if (resp.ok) {
          const rawRows = await resp.json();
          if (Array.isArray(rawRows)) {
            const mapped = rawRows.map((row: any) => ({
              id: row.id,
              phone: row.phone,
              firstName: row.first_name || row.firstName,
              lastName: row.last_name || row.lastName,
              birthDate: row.birth_date || row.birthDate,
              totalSpent: Number(row.total_spent ?? row.totalSpent ?? 0),
              ordersCount: Number(row.orders_count ?? row.ordersCount ?? 0),
              discountPercent: Number(row.discount_percent ?? row.discountPercent ?? 3),
              tier: row.tier || 'Знакомство',
              orders: row.orders || [],
              registeredAt: row.registered_at || row.registeredAt,
            }));
            return res.status(200).json(mapped);
          }
        }
      }

      // 1.2 Upstash / Vercel KV
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const resp = await fetch(`${process.env.KV_REST_API_URL}/get/customers`, {
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          },
        });
        if (resp.ok) {
          const json = await resp.json();
          const list = json.result ? JSON.parse(json.result) : [];
          return res.status(200).json(list);
        }
      }

      // 1.3 Fallback: Persistent Cloud Store
      const cloudResp = await fetch(KVDB_ENDPOINT);
      if (cloudResp.ok) {
        const list = await cloudResp.json();
        return res.status(200).json(Array.isArray(list) ? list : []);
      }
      return res.status(200).json([]);
    } catch (e) {
      console.error('Error fetching customers in API:', e);
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

      // Trigger Telegram notification in background
      notifyTelegram(customer).catch(() => {});

      // 2.1 Supabase PostgreSQL
      if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const dbRecord = {
          id: customer.id,
          phone: customer.phone,
          first_name: customer.firstName,
          last_name: customer.lastName,
          birth_date: customer.birthDate || null,
          total_spent: customer.totalSpent || 0,
          orders_count: customer.ordersCount || 0,
          discount_percent: customer.discountPercent || 3,
          tier: customer.tier || 'Знакомство',
          orders: customer.orders || [],
          registered_at: customer.registeredAt || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        };

        const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/customers`, {
          method: 'POST',
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(dbRecord),
        });
        if (resp.ok) {
          return res.status(200).json({ success: true, customer });
        }
      }

      // 2.2 Upstash / Vercel KV
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const getResp = await fetch(`${process.env.KV_REST_API_URL}/get/customers`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        });
        let list: any[] = [];
        if (getResp.ok) {
          const json = await getResp.json();
          if (json.result) list = JSON.parse(json.result);
        }
        const updated = [customer, ...list.filter((c: any) => c.id !== customer.id)];
        await fetch(`${process.env.KV_REST_API_URL}/set/customers`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(JSON.stringify(updated)),
        });
        return res.status(200).json({ success: true, customer });
      }

      // 2.3 Fallback: Persistent Cloud Store
      let currentList: any[] = [];
      try {
        const cloudResp = await fetch(KVDB_ENDPOINT);
        if (cloudResp.ok) {
          const data = await cloudResp.json();
          if (Array.isArray(data)) currentList = data;
        }
      } catch {}

      const merged = [customer, ...currentList.filter((c: any) => c.id !== customer.id)];
      await fetch(KVDB_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });

      return res.status(200).json({ success: true, customer });
    } catch (e) {
      console.error('Error saving customer in API:', e);
      return res.status(500).json({ error: 'Failed to persist customer' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
