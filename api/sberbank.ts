import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS = [
  'https://xn----ctbjn3arftl7c8b.xn--p1ai',
  'https://цветы-софия.рф',
  'https://sitesophiya.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];

function setSecureCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin as string;
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'null');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Cache-Control, Pragma, X-Requested-With'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
}

// Sberbank Internet Acquiring Endpoint
// Merchant Requisites:
// ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ
// ИНН: 165115143005
// Р/С: 40802810762000090051 в ПАО Сбербанк
// БИК: 049205603

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecureCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Return public merchant requisites
  if (req.method === 'GET') {
    return res.status(200).json({
      merchant: {
        name: 'ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ',
        inn: '165115143005',
        ogrnip: '324169000033624',
        account: '40802810762000090051',
        bankName: 'Отделение "Банк Татарстан" №8610 ПАО Сбербанк',
        bik: '049205603',
        corrAccount: '30101810600000000603',
        salonAddress: 'г. Нижнекамск, пр. Шинников, 13В',
        phone: '+7 (917) 256-32-35',
      },
      ready: true,
      hasCredentials: Boolean(process.env.SBER_USER_NAME && process.env.SBER_PASSWORD),
    });
  }

  // 2. POST: Register payment in Sberbank Gateway
  if (req.method === 'POST') {
    const { orderId, amount, description } = req.body || {};

    const userName = process.env.SBER_USER_NAME;
    const password = process.env.SBER_PASSWORD;

    if (userName && password) {
      try {
        const sberUrl = process.env.SBER_TEST_MODE === 'true'
          ? 'https://3dsec.sberbank.ru/payment/rest/register.do'
          : 'https://securepayments.sberbank.ru/payment/rest/register.do';

        const params = new URLSearchParams({
          userName,
          password,
          orderNumber: `${orderId}_${Date.now()}`,
          amount: String(Math.round(amount * 100)), // in kopecks
          returnUrl: `https://xn----ctbjn3arftl7c8b.xn--p1ai/?payment=success&orderId=${orderId}`,
          failUrl: `https://xn----ctbjn3arftl7c8b.xn--p1ai/?payment=fail&orderId=${orderId}`,
          description: description || `Заказ цветов ${orderId} в салоне София (ИП Обручников Д.В.)`,
        });

        const sberRes = await fetch(`${sberUrl}?${params.toString()}`);
        const sberData = await sberRes.json();

        return res.status(200).json(sberData);
      } catch (err: any) {
        return res.status(500).json({ error: 'Sber gateway error', details: err.message });
      }
    }

    // Default fast settlement response
    return res.status(200).json({
      success: true,
      mode: 'direct_settlement',
      orderId,
      amount,
      payee: 'ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ',
      account: '40802810762000090051',
      bik: '049205603',
      bank: 'ПАО Сбербанк',
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
