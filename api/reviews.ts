import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        const data = await kv.get('salon_reviews');
        if (data) {
          return res.status(200).json(data);
        }
      }
      return res.status(200).json(null);
    } catch (e) {
      console.error('Error fetching reviews from Vercel KV:', e);
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
        await kv.set('salon_reviews', items);
      }

      return res.status(200).json({ success: true, count: items.length });
    } catch (e) {
      console.error('Error saving reviews to Vercel KV:', e);
      return res.status(500).json({ error: 'Failed to persist reviews' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
