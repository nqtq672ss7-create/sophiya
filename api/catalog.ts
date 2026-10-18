import type { VercelRequest, VercelResponse } from '@vercel/node';

const KVDB_BUCKET_ID = 'sophiya_salon_customers_v1';
const CATALOG_ENDPOINT = `https://kvdb.io/${KVDB_BUCKET_ID}/catalog_bouquets_v1`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Fetch current global catalog
  if (req.method === 'GET') {
    try {
      // 1.1 Supabase if available
      if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/catalog?select=*`, {
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
          },
        });
        if (resp.ok) {
          const rows = await resp.json();
          if (Array.isArray(rows) && rows.length > 0) {
            return res.status(200).json(rows);
          }
        }
      }

      // 1.2 Upstash / Vercel KV if available
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const resp = await fetch(`${process.env.KV_REST_API_URL}/get/catalog`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        });
        if (resp.ok) {
          const json = await resp.json();
          if (json.result) {
            return res.status(200).json(JSON.parse(json.result));
          }
        }
      }

      // 1.3 Persistent Cloud KV store
      const cloudResp = await fetch(CATALOG_ENDPOINT);
      if (cloudResp.ok) {
        const data = await cloudResp.json();
        if (Array.isArray(data)) {
          return res.status(200).json(data);
        }
      }

      return res.status(200).json(null);
    } catch (e) {
      console.error('Error fetching catalog in API:', e);
      return res.status(200).json(null);
    }
  }

  // 2. POST: Update global catalog across all devices
  if (req.method === 'POST') {
    try {
      const items = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Expected array of bouquets' });
      }

      // 2.1 Upstash / Vercel KV
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        await fetch(`${process.env.KV_REST_API_URL}/set/catalog`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(JSON.stringify(items)),
        });
      }

      // 2.2 Persistent Cloud Store
      await fetch(CATALOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });

      return res.status(200).json({ success: true, count: items.length });
    } catch (e) {
      console.error('Error saving catalog in API:', e);
      return res.status(500).json({ error: 'Failed to persist catalog' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
