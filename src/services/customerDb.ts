import { Customer, CustomerOrder, calculateLoyaltyTier } from '../types/customer';
import { getApiUrl } from '../config/api';

const LEGACY_LOCAL_PII_STORES = [
  'sofiya_customers_db',
  'sofiya_customers_backup_latest',
  'sofiya_current_customer',
];

function purgeLegacyLocalPii(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const storeName of LEGACY_LOCAL_PII_STORES) {
      localStorage.removeItem(storeName);
    }
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sofiya_customers_backup_')) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1);
  }
  return digits;
}

export function formatRussianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  let clean = digits;
  if (clean.startsWith('8') || clean.startsWith('7')) {
    clean = clean.slice(1);
  }
  clean = clean.slice(0, 10);

  let formatted = '+7';
  if (clean.length > 0) {
    formatted += ' (' + clean.slice(0, 3);
  }
  if (clean.length >= 3) {
    formatted += ') ' + clean.slice(3, 6);
  }
  if (clean.length >= 6) {
    formatted += '-' + clean.slice(6, 8);
  }
  if (clean.length >= 8) {
    formatted += '-' + clean.slice(8, 10);
  }
  return formatted;
}

function sanitizeCsvCell(raw: unknown): string {
  const str = String(raw ?? '').replace(/\r?\n/g, ' ').trim();
  const isSafeFormattedPhone = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(str);
  const neutralized = !isSafeFormattedPhone && /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${neutralized.replace(/"/g, '""')}"`;
}

let inMemoryCustomers: Customer[] = [];

export class CustomerDatabaseService {
  static getLocalCustomers(): Customer[] {
    purgeLegacyLocalPii();
    return inMemoryCustomers;
  }

  static saveLocalCustomers(customers: Customer[]): void {
    purgeLegacyLocalPii();
    inMemoryCustomers = customers.filter(
      (c) => c.id !== 'cust_01' && c.id !== 'cust_02' && !c.id.startsWith('seed_')
    );
  }

  static exportToCSV(customers: Customer[]): void {
    const BOM = '\uFEFF';
    const headers = [
      'ID',
      'Имя',
      'Фамилия',
      'Телефон',
      'Дата рождения',
      'Статус клуба',
      'Скидка (%)',
      'Заказов (шт)',
      'Сумма покупок (руб)',
      'Дата регистрации',
    ];

    const rows = customers.map((c) => [
      sanitizeCsvCell(c.id),
      sanitizeCsvCell(c.firstName),
      sanitizeCsvCell(c.lastName),
      sanitizeCsvCell(c.phone),
      sanitizeCsvCell(c.birthDate || ''),
      sanitizeCsvCell(c.tier),
      Number(c.discountPercent) || 0,
      Number(c.ordersCount) || 0,
      Number(c.totalSpent) || 0,
      sanitizeCsvCell(c.registeredAt),
    ]);

    const csvContent = BOM + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `sofiya_baza_klientov_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async fetchAllCustomers(): Promise<Customer[]> {
    purgeLegacyLocalPii();
    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('sophiya_admin_token') : null;
      if (!token) return [];
      const res = await fetch(getApiUrl('/api/customers'), {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const remote: Customer[] = await res.json();
        if (Array.isArray(remote)) {
          this.saveLocalCustomers(remote);
          return inMemoryCustomers;
        }
      }
    } catch {}
    return inMemoryCustomers;
  }

  static async fetchCustomerSession(): Promise<Customer|null> {
    purgeLegacyLocalPii();
    try {
      const res = await fetch(getApiUrl('/api/customer-auth'), {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      if (data?.authenticated && data?.customer) {
        return data.customer as Customer;
      }
      return null;
    } catch {
      return null;
    }
  }

  static async registerWithPassword(params: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    password: string;
    consent: boolean;
  }): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const normalized = normalizePhone(params.phone);
    if (normalized.length < 11) {
      return { success: false, error: 'Укажите корректный 11-значный номер телефона' };
    }
    if (!params.firstName.trim() || !params.lastName.trim()) {
      return { success: false, error: 'Укажите имя и фамилию' };
    }
    if (!params.password || params.password.length < 6) {
      return { success: false, error: 'Пароль должен содержать минимум 6 символов' };
    }
    if (!params.consent) {
      return { success: false, error: 'Подтвердите согласие на обработку персональных данных' };
    }

    try {
      const res = await fetch(getApiUrl('/api/customer-auth'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          phone: params.phone,
          firstName: params.firstName.trim(),
          lastName: params.lastName.trim(),
          birthDate: params.birthDate || '',
          password: params.password,
          consent: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.customer) {
        return { success: false, error: data?.error || 'Не удалось завершить регистрацию' };
      }
      return { success: true, customer: data.customer as Customer };
    } catch {
      return { success: false, error: 'Нет связи с сервером. Попробуйте позже.' };
    }
  }

  static async loginWithPassword(
    phone: string,
    password: string
  ): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const normalized = normalizePhone(phone);
    if (normalized.length < 11) {
      return { success: false, error: 'Укажите полный 11-значный номер телефона' };
    }
    if (!password) {
      return { success: false, error: 'Введите пароль' };
    }
    try {
      const res = await fetch(getApiUrl('/api/customer-auth'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          phone,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.customer) {
        return { success: false, error: data?.error || 'Неверный номер телефона или пароль' };
      }
      return { success: true, customer: data.customer as Customer };
    } catch {
      return { success: false, error: 'Нет связи с сервером. Попробуйте позже.' };
    }
  }

  static async logoutSession(): Promise<void> {
    purgeLegacyLocalPii();
    try {
      await fetch(getApiUrl('/api/customer-auth'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {}
  }

  static async deleteAccountServer(): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(getApiUrl('/api/customer-auth'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteAccount' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error || 'Не удалось удалить профиль' };
      }
      purgeLegacyLocalPii();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Нет связи с сервером. Попробуйте позже.' };
    }
  }

  static async findByPhone(phone: string): Promise<Customer|null> {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;
    return inMemoryCustomers.find((c) => normalizePhone(c.phone) === normalized) || null;
  }

  static async registerCustomer(params: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
  }): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const normalized = normalizePhone(params.phone);
    if (normalized.length < 11) {
      return { success: false, error: 'Укажите корректный 11-значный номер телефона' };
    }
    if (!params.firstName.trim() || !params.lastName.trim()) {
      return { success: false, error: 'Укажите имя и фамилию' };
    }

    const newCustomer: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      phone: formatRussianPhone(params.phone),
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      birthDate: params.birthDate || undefined,
      totalSpent: 0,
      ordersCount: 0,
      discountPercent: 0,
      tier: 'Клиент',
      orders: [],
      registeredAt: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await fetch(getApiUrl('/api/customers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Не удалось сохранить клиента' };
      }
    } catch {
      return { success: false, error: 'Сервис временно недоступен' };
    }

    return { success: true, customer: newCustomer };
  }

  static async recordOrder(
    customerId: string,
    orderData: { items: string[]; totalAmount: number }
  ): Promise<Customer|null> {
    const target = inMemoryCustomers.find((c) => c.id === customerId);
    if (!target) return null;

    const discountAmount = Math.round((orderData.totalAmount * target.discountPercent) / 100);
    const finalAmount = orderData.totalAmount - discountAmount;

    const newOrder: CustomerOrder = {
      id: `ord_${Date.now()}`,
      date: new Date().toLocaleDateString('ru-RU'),
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      discountApplied: discountAmount,
      finalAmount,
      status: 'Собирается',
    };

    const newTotalSpent = target.totalSpent + finalAmount;
    const { tier } = calculateLoyaltyTier(newTotalSpent);

    const updated: Customer = {
      ...target,
      totalSpent: newTotalSpent,
      ordersCount: target.ordersCount + 1,
      discountPercent: tier.discountPercent,
      tier: tier.name,
      orders: [newOrder, ...target.orders],
    };

    this.saveLocalCustomers(inMemoryCustomers.map((c) => (c.id === updated.id ? updated : c)));
    return updated;
  }

  static getCurrentCustomer(): Customer|null {
    purgeLegacyLocalPii();
    return null;
  }

  static setCurrentCustomer(_customer: Customer|null): void {
    purgeLegacyLocalPii();
  }

  static forgetCustomer(customerId: string): void {
    inMemoryCustomers = inMemoryCustomers.filter((c) => c.id !== customerId);
    purgeLegacyLocalPii();
  }
}
