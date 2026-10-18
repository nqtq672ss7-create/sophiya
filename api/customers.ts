import type { VercelRequest, VercelResponse } from '@vercel/node';

// Persistent Cloud DB Endpoint fallback (KVdb bucket dedicated to цветы-софия.рф)
const KVDB_BUCKET_ID = 'sophiya_salon_customers_v1';
const KVDB_ENDPOINT = `https://kvdb.io/${KVDB_BUCKET_ID}/customers_list`;

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
      // If Supabase is configured
      if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/customers?select=*`, {
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
          },
        });
        if (resp.ok) {
          const data = await resp.json();
          return res.status(200).json(data);
        }
      }

      // If Upstash / Vercel KV is configured
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

      // Fallback: Persistent Cloud Store
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

      // If Supabase is configured
      if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)) {
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
        const resp = await fetch(`${process.env.SUPABASE_URL}/rest/v1/customers`, {
          method: 'POST',
          headers: {
            apikey: key as string,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(customer),
        });
        if (resp.ok) {
          return res.status(200).json({ success: true, customer });
        }
      }

      // If Upstash / Vercel KV is configured
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        // Fetch existing, merge, and save
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

      // Fallback: Persistent Cloud Store
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
