import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, kv } from '@vercel/kv';
import {
  handleCustomerAuth,
  normalizePhoneDigits,
} from '../server/customer-auth-handler.mjs';

const ORDERS_LEGACY_STORE = 'sophiya_orders_v1';
const ORDER_ITEM_PREFIX = 'sophiya_order_item:';
const ORDER_IDS_LIST = 'sophiya_order_ids';

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

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  let decoded = origin;
  try {
    decoded = decodeURI(origin);
  } catch {}
  const clean = decoded.toLowerCase().trim().replace(/\/+$/, '');
  const raw = origin.toLowerCase().trim().replace(/\/+$/, '');
  const allowedPatterns: RegExp[] = [
    /^https:\/\/(www\.)?xn----ctbjn3arftl7c8b\.xn--p1ai$/,
    /^https:\/\/(www\.)?цветы-софия\.рф$/,
  ];
  if (process.env.NODE_ENV !== 'production') {
    allowedPatterns.push(/^http:\/\/localhost(:[0-9]+)?$/, /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/);
  }
  return allowedPatterns.some((pattern) => pattern.test(clean) || pattern.test(raw));
}

function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string | undefined;
  res.setHeader('Vary', 'Origin');
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.removeHeader('X-Powered-By');
}

function getClientIp(req: VercelRequest): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

function parseJsonVal(v: unknown) {
  if (typeof v === 'string') {
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  }
  return v && typeof v === 'object' ? v : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getKVClient();
  let body: any = {};
  if (req.method === 'POST') {
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    } catch {
      return res.status(400).json({ error: 'Некорректный формат JSON' });
    }
  }

  const readAllOrders = async () => {
    const ids = await client.lrange<string>(ORDER_IDS_LIST, 0, 299);
    const out: any[] = [];
    if (Array.isArray(ids) && ids.length > 0) {
      const seen = new Set<string>();
      for (const id of ids) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const ord = parseJsonVal(await client.get(`${ORDER_ITEM_PREFIX}${id}`));
        if (ord) out.push(ord);
      }
      return out;
    }
    const legacy = await client.get<any[]>(ORDERS_LEGACY_STORE);
    return Array.isArray(legacy) ? legacy : [];
  };

  const anonymizeCustomerOrders = async (cid: string, phoneDigits: string) => {
    const ids = await client.lrange<string>(ORDER_IDS_LIST, 0, 499);
    if (!Array.isArray(ids)) return;
    for (const id of ids) {
      if (!id) continue;
      const key = `${ORDER_ITEM_PREFIX}${id}`;
      const ord = parseJsonVal(await client.get(key));
      if (!ord) continue;
      const matches =
        ord.customerId === cid ||
        (phoneDigits && normalizePhoneDigits(ord.phone) === phoneDigits);
      if (matches) {
        const scrubbed = {
          ...ord,
          customerName: 'Удалено (152-ФЗ)',
          recipientName: 'Удалено (152-ФЗ)',
          phone: '',
          recipientPhone: '',
          address: '',
          email: '',
          postcardText: '',
          comment: '',
        };
        delete scrubbed.customerId;
        await client.set(key, scrubbed);
      }
    }
  };

  return await handleCustomerAuth(req, res, body, {
    kvClient: client,
    getClientIp,
    readAllOrders,
    anonymizeCustomerOrders,
  });
}
