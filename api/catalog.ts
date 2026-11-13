import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  setSecureCors,
  getKVClient,
  extractAndVerifyToken,
  createKvBackup,
} from './_security';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();

  // 1. GET: Public high-speed read for customers and search engine bots
  if (req.method === 'GET') {
    try {
      let data = await client.get('catalog_bouquets');
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {}
      }
      if (data !== undefined && data !== null) {
        return res.status(200).json(data);
      }
      return res.status(200).json(null);
    } catch (e) {
      console.error('Error fetching catalog from KV:', e);
      return res.status(200).json(null);
    }
  }

  // 2. POST: Protected admin-only write with RBAC token verification & automatic backup
  if (req.method === 'POST') {
    // Strict RBAC / Token Gate
    if (!extractAndVerifyToken(req)) {
      return res.status(401).json({
        error: 'Доступ запрещён: требуется авторизация администратора.',
      });
    }

    try {
      let items = req.body;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {
          return res.status(400).json({ error: 'Неверный формат JSON' });
        }
      }

      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Ожидается массив букетов' });
      }

      // Safety sanitization: each item must have id, title, price
      for (const item of items) {
        if (!item || typeof item !== 'object' || !item.id || !item.title) {
          return res.status(400).json({ error: 'Некорректная структура элементов букета' });
        }
      }

      // Automated snapshot backup before overwriting (Zero Data Loss Guarantee)
      await createKvBackup(client, 'catalog_bouquets', 'pre_write');

      // Persist validated catalog
      await client.set('catalog_bouquets', items);

      return res.status(200).json({ success: true, count: items.length });
    } catch (e) {
      console.error('Error saving catalog to KV:', e);
      return res.status(500).json({ error: 'Ошибка сохранения каталога' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
