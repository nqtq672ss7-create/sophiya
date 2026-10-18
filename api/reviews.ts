import type { VercelRequest, VercelResponse } from '@vercel/node';

const KVDB_BUCKET_ID = 'sophiya_salon_customers_v1';
const REVIEWS_ENDPOINT = `https://kvdb.io/${KVDB_BUCKET_ID}/reviews_list_v1`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Fetch global reviews
  if (req.method === 'GET') {
    try {
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        const resp = await fetch(`${process.env.KV_REST_API_URL}/get/reviews`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        });
        if (resp.ok) {
          const json = await resp.json();
          if (json.result) return res.status(200).json(JSON.parse(json.result));
        }
      }

      const cloudResp = await fetch(REVIEWS_ENDPOINT);
      if (cloudResp.ok) {
        const data = await cloudResp.json();
        if (Array.isArray(data)) return res.status(200).json(data);
      }

      return res.status(200).json(null);
    } catch (e) {
      console.error('Error fetching reviews in API:', e);
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

      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        await fetch(`${process.env.KV_REST_API_URL}/set/reviews`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(JSON.stringify(items)),
        });
      }

      await fetch(REVIEWS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });

      return res.status(200).json({ success: true, count: items.length });
    } catch (e) {
      console.error('Error saving reviews in API:', e);
      return res.status(500).json({ error: 'Failed to persist reviews' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
