import crypto from 'node:crypto';

export const CUSTOMER_COOKIE_NAME = 'sophiya_ctok';
const CUSTOMERS_STORE = 'salon_customers';
const CUSTOMER_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const REGISTRATIONS_PER_HOUR = 5;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

export function normalizePhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return '7' + digits.slice(1);
  if (digits.length === 10) return '7' + digits;
  return digits;
}

export function formatPhoneDisplay(phoneDigits) {
  return `+7 (${phoneDigits.slice(1, 4)}) ${phoneDigits.slice(4, 7)}-${phoneDigits.slice(7, 9)}-${phoneDigits.slice(9, 11)}`;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hexDigest] = parts;
  if (!salt || !hexDigest) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hexDigest, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function calculateLoyaltyFromSpent(totalSpent) {
  const spent = Math.max(0, Number(totalSpent) || 0);
  if (spent >= 50000) return { tier: 'Платиновый', discountPercent: 10 };
  if (spent >= 25000) return { tier: 'Золотой', discountPercent: 7 };
  if (spent >= 10000) return { tier: 'Серебряный', discountPercent: 5 };
  return { tier: 'Клиент', discountPercent: 0 };
}

export function stripCustomerSecrets(customer) {
  if (!customer || typeof customer !== 'object') return customer;
  const { passwordHash, ...safe } = customer;
  return {
    ...safe,
    hasPassword: Boolean(passwordHash),
  };
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || '';
  return secret.length >= 32 ? secret : '';
}

export function signCustomerToken(customer) {
  const secret = getAuthSecret();
  if (!secret) throw new Error('AUTH_SECRET is not configured');
  const payload = {
    role: 'customer',
    cid: customer.id,
    phoneDigits: normalizePhoneDigits(customer.phone),
    iat: Date.now(),
    exp: Date.now() + CUSTOMER_TTL_MS,
    nonce: crypto.randomBytes(8).toString('hex'),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifyCustomerToken(token) {
  const secret = getAuthSecret();
  if (!secret || !token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.role !== 'customer' || !payload.cid) return null;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function extractCookieValue(req, name) {
  const cookieHeader = req.headers?.cookie;
  if (typeof cookieHeader !== 'string' || !cookieHeader) return '';
  for (const pair of cookieHeader.split(';')) {
    const eq = pair.indexOf('=');
    if (eq === -1) continue;
    const k = pair.slice(0, eq).trim();
    if (k === name) {
      const v = pair.slice(eq + 1).trim();
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return '';
}

export function extractCustomerSession(req) {
  const token = extractCookieValue(req, CUSTOMER_COOKIE_NAME);
  return verifyCustomerToken(token);
}

function appendSetCookie(res, cookieStr) {
  const prev = typeof res.getHeader === 'function' ? res.getHeader('Set-Cookie') : undefined;
  if (!prev) {
    res.setHeader('Set-Cookie', cookieStr);
  } else if (Array.isArray(prev)) {
    res.setHeader('Set-Cookie', [...prev, cookieStr]);
  } else {
    res.setHeader('Set-Cookie', [String(prev), cookieStr]);
  }
}

export function setCustomerCookie(res, token) {
  const secureFlag = process.env.NODE_ENV === 'development' ? '' : '; Secure';
  appendSetCookie(
    res,
    `${CUSTOMER_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${Math.floor(CUSTOMER_TTL_MS / 1000)}; HttpOnly; SameSite=Lax${secureFlag}`
  );
}

export function clearCustomerCookie(res) {
  const secureFlag = process.env.NODE_ENV === 'development' ? '' : '; Secure';
  appendSetCookie(
    res,
    `${CUSTOMER_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secureFlag}`
  );
}

function mapOrderStatusRu(order) {
  if (order.orderStatus === 'delivered') return 'Доставлен';
  if (order.orderStatus === 'in_transit') return 'В пути';
  return 'Собирается';
}

export function buildCustomerView(customer, allOrders) {
  const phoneDigits = normalizePhoneDigits(customer.phone);
  const matchingOrders = (Array.isArray(allOrders) ? allOrders : []).filter(
    (o) =>
      o &&
      (o.customerId === customer.id ||
        (phoneDigits.length === 11 && normalizePhoneDigits(o.phone) === phoneDigits))
  );

  const qualifyingOrders = matchingOrders.filter(
    (o) =>
      o.paymentStatus === 'paid' ||
      (o.paymentMethod === 'cash' && o.orderStatus === 'delivered')
  );

  const qualifyingSpent = qualifyingOrders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0
  );

  const totalSpent = Math.max(Number(customer.totalSpent || 0), qualifyingSpent);
  const ordersCount = Math.max(Number(customer.ordersCount || 0), qualifyingOrders.length);
  const calc = calculateLoyaltyFromSpent(totalSpent);
  const manualDiscount = Number(customer.discountPercent || 0);
  const discountPercent = Math.min(
    25,
    Math.max(calc.discountPercent, Number.isFinite(manualDiscount) && manualDiscount > 0 ? manualDiscount : 0)
  );
  const tier = calc.discountPercent >= manualDiscount ? calc.tier : customer.tier || calc.tier;

  const mappedOrders = matchingOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    date: o.createdAt,
    items: Array.isArray(o.items) ? o.items.map((it) => `${it.title} (${it.quantity} шт)`) : [],
    totalAmount: (Number(o.totalAmount) || 0) + (Number(o.discountAmount) || 0),
    discountApplied: Number(o.discountAmount) || 0,
    finalAmount: Number(o.totalAmount) || 0,
    status: mapOrderStatusRu(o),
    paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod,
  }));

  const seenIds = new Set(mappedOrders.map((o) => o.id));
  const legacyOrders = Array.isArray(customer.orders)
    ? customer.orders.filter((o) => o && !seenIds.has(o.id))
    : [];

  return {
    ...stripCustomerSecrets(customer),
    totalSpent,
    ordersCount,
    discountPercent,
    tier,
    orders: [...mappedOrders, ...legacyOrders],
  };
}

function sendJson(res, status, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(status).json(payload);
  }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export async function handleCustomerAuth(req, res, body, deps) {
  const { kvClient, getClientIp, readAllOrders, anonymizeCustomerOrders } = deps;

  if (req.method === 'GET') {
    const session = extractCustomerSession(req);
    if (!session) {
      return sendJson(res, 200, { authenticated: false, customer: null });
    }
    try {
      const list = ((await kvClient.get(CUSTOMERS_STORE)) || []).filter(Boolean);
      const found = list.find(
        (c) =>
          c.id === session.cid ||
          (session.phoneDigits && normalizePhoneDigits(c.phone) === session.phoneDigits)
      );
      if (!found) {
        clearCustomerCookie(res);
        return sendJson(res, 200, { authenticated: false, customer: null });
      }
      const allOrders = typeof readAllOrders === 'function' ? await readAllOrders() : [];
      return sendJson(res, 200, {
        authenticated: true,
        customer: buildCustomerView(found, allOrders),
      });
    } catch {
      return sendJson(res, 503, { error: 'Сервис личного кабинета временно недоступен' });
    }
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  if (!body || typeof body !== 'object') {
    return sendJson(res, 400, { error: 'Некорректный формат запроса' });
  }
  if (body.company_website || body.honeypot || body.hp_token) {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  const action = String(body.action || '').trim();

  if (action === 'logout') {
    clearCustomerCookie(res);
    return sendJson(res, 200, { ok: true });
  }

  if (action === 'deleteAccount') {
    const session = extractCustomerSession(req);
    if (!session) {
      return sendJson(res, 401, { error: 'Требуется вход в личный кабинет' });
    }
    try {
      const existing = ((await kvClient.get(CUSTOMERS_STORE)) || []).filter(Boolean);
      const target = existing.find((c) => c.id === session.cid);
      const targetPhoneDigits = target ? normalizePhoneDigits(target.phone) : session.phoneDigits;
      const updated = existing.filter(
        (c) =>
          c.id !== session.cid &&
          (!targetPhoneDigits || normalizePhoneDigits(c.phone) !== targetPhoneDigits)
      );
      await kvClient.set(CUSTOMERS_STORE, updated);
      if (typeof anonymizeCustomerOrders === 'function') {
        await anonymizeCustomerOrders(session.cid, targetPhoneDigits);
      }
      clearCustomerCookie(res);
      return sendJson(res, 200, { ok: true });
    } catch {
      return sendJson(res, 503, { error: 'Не удалось удалить профиль. Попробуйте позже.' });
    }
  }

  if (!getAuthSecret()) {
    return sendJson(res, 503, { error: 'Авторизация клиентов временно не настроена на сервере' });
  }

  const ip = getClientIp(req);
  const safeIp = String(ip || 'unknown').replace(/[^a-zA-Z0-9_.:-]/g, '_');

  if (action === 'register') {
    if (body.consent !== true) {
      return sendJson(res, 400, { error: 'Подтвердите согласие на обработку персональных данных' });
    }

    const phoneDigits = normalizePhoneDigits(body.phone);
    const firstName = String(body.firstName || '').trim().slice(0, 50);
    const lastName = String(body.lastName || '').trim().slice(0, 50);
    const birthDate = String(body.birthDate || '').trim().slice(0, 10);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^7\d{10}$/.test(phoneDigits)) {
      return sendJson(res, 400, { error: 'Укажите корректный 11-значный российский номер телефона' });
    }
    if (!firstName || !lastName) {
      return sendJson(res, 400, { error: 'Укажите имя и фамилию' });
    }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      return sendJson(res, 400, { error: 'Некорректная дата рождения' });
    }
    if (password.length < 6 || password.length > 128) {
      return sendJson(res, 400, { error: 'Пароль должен содержать от 6 до 128 символов' });
    }

    try {
      const rlKey = `ratelimit_creg_${safeIp}`;
      const attempts = Number(await kvClient.incr(rlKey));
      if (attempts === 1) await kvClient.expire(rlKey, 3600);
      if (attempts > REGISTRATIONS_PER_HOUR) {
        return sendJson(res, 429, { error: 'Слишком много регистраций. Попробуйте позже.' });
      }
    } catch {
      return sendJson(res, 503, { error: 'Сервис регистрации временно недоступен' });
    }

    try {
      const existing = ((await kvClient.get(CUSTOMERS_STORE)) || []).filter(Boolean);
      const duplicate = existing.find((c) => normalizePhoneDigits(c.phone) === phoneDigits);
      if (duplicate) {
        return sendJson(res, 409, {
          error: 'Клиент с таким номером уже зарегистрирован. Войдите с паролем или напишите в MAX для сброса пароля.',
        });
      }

      const created = {
        id: `cust_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        phone: formatPhoneDisplay(phoneDigits),
        firstName,
        lastName,
        ...(birthDate ? { birthDate } : {}),
        passwordHash: hashPassword(password),
        totalSpent: 0,
        ordersCount: 0,
        discountPercent: 0,
        tier: 'Клиент',
        orders: [],
        registeredAt: new Date().toISOString().split('T')[0],
      };

      await kvClient.set(CUSTOMERS_STORE, [created, ...existing]);
      const token = signCustomerToken(created);
      setCustomerCookie(res, token);

      const allOrders = typeof readAllOrders === 'function' ? await readAllOrders() : [];
      return sendJson(res, 200, {
        authenticated: true,
        customer: buildCustomerView(created, allOrders),
      });
    } catch {
      return sendJson(res, 503, { error: 'Не удалось завершить регистрацию. Попробуйте позже.' });
    }
  }

  if (action === 'login') {
    const phoneDigits = normalizePhoneDigits(body.phone);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^7\d{10}$/.test(phoneDigits) || !password || password.length > 128) {
      return sendJson(res, 400, { error: 'Укажите номер телефона и пароль' });
    }

    const rlKey = `ratelimit_clogin_${safeIp}_${phoneDigits}`;
    let rlRecord = null;
    try {
      rlRecord = await kvClient.get(rlKey);
      const now = Date.now();
      if (rlRecord && rlRecord.lockedUntil && now < rlRecord.lockedUntil) {
        const waitSec = Math.ceil((rlRecord.lockedUntil - now) / 1000);
        return sendJson(res, 429, {
          error: `Слишком много неверных попыток входа. Попробуйте через ${waitSec} сек.`,
        });
      }
    } catch {
      return sendJson(res, 503, { error: 'Сервис входа временно недоступен' });
    }

    let list;
    try {
      list = ((await kvClient.get(CUSTOMERS_STORE)) || []).filter(Boolean);
    } catch {
      return sendJson(res, 503, { error: 'Сервис входа временно недоступен' });
    }

    const found = list.find((c) => normalizePhoneDigits(c.phone) === phoneDigits);
    const ok = Boolean(found && found.passwordHash && verifyPassword(password, found.passwordHash));

    if (!ok) {
      try {
        const next = rlRecord && typeof rlRecord === 'object' ? { ...rlRecord } : { count: 0 };
        next.count = (Number(next.count) || 0) + 1;
        if (next.count >= LOGIN_MAX_FAILURES) {
          next.lockedUntil = Date.now() + LOGIN_LOCK_MS;
        }
        await kvClient.set(rlKey, next, { ex: Math.ceil(LOGIN_LOCK_MS / 1000) });
      } catch {
        return sendJson(res, 503, { error: 'Сервис входа временно недоступен' });
      }

      if (found && !found.passwordHash) {
        return sendJson(res, 401, {
          error: 'Для этого номера ещё не задан пароль. Напишите нам в MAX, и мы активируем вход в кабинет.',
        });
      }
      return sendJson(res, 401, { error: 'Неверный номер телефона или пароль' });
    }

    try {
      await kvClient.del(rlKey);
    } catch {}

    const token = signCustomerToken(found);
    setCustomerCookie(res, token);

    let allOrders = [];
    try {
      allOrders = typeof readAllOrders === 'function' ? await readAllOrders() : [];
    } catch {}

    return sendJson(res, 200, {
      authenticated: true,
      customer: buildCustomerView(found, allOrders),
    });
  }

  return sendJson(res, 400, { error: 'Неизвестное действие' });
}
