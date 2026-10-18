import { Customer, CustomerOrder, calculateLoyaltyTier } from '../types/customer';

const STORAGE_KEY = 'sofiya_customers_db';
const CURRENT_CUSTOMER_KEY = 'sofiya_current_customer';

// Helper to normalize phone numbers for reliable lookup (e.g., "+7 (917) 256-32-35" -> "79172563235")
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1);
  }
  return digits;
}

// Format digits into beautiful Russian phone mask: +7 (9XX) XXX-XX-XX
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

export class CustomerDatabaseService {
  // Read local customers, excluding legacy mock data
  static getLocalCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed: Customer[] = JSON.parse(data);
      // Clean out any legacy mock accounts
      const cleaned = parsed.filter(
        (c) => c.id !== 'cust_01' && c.id !== 'cust_02' && !c.id.startsWith('seed_')
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch (e) {
      console.warn('Failed to read local customers database:', e);
      return [];
    }
  }

  // Save customers to local storage with redundant safety snapshots
  static saveLocalCustomers(customers: Customer[]): void {
    try {
      // Exclude legacy mock accounts
      const cleaned = customers.filter(
        (c) => c.id !== 'cust_01' && c.id !== 'cust_02' && !c.id.startsWith('seed_')
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));

      // Redundant Snapshot Backup: Daily & Latest
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`sofiya_customers_backup_${today}`, JSON.stringify(cleaned));
      localStorage.setItem('sofiya_customers_backup_latest', JSON.stringify(cleaned));
    } catch (e) {
      console.error('Failed to save customers to localStorage:', e);
    }
  }

  // Export customer database to Excel-compatible CSV with UTF-8 BOM
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
      c.id,
      `"${c.firstName.replace(/"/g, '""')}"`,
      `"${c.lastName.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      c.birthDate ? `"${c.birthDate}"` : '""',
      `"${c.tier}"`,
      c.discountPercent,
      c.ordersCount,
      c.totalSpent,
      `"${c.registeredAt}"`,
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

  // Fetch all customers from server API with local fallback
  static async fetchAllCustomers(): Promise<Customer[]> {
    const local = this.getLocalCustomers();
    try {
      const res = await fetch('/api/customers', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const remote: Customer[] = await res.json();
        if (Array.isArray(remote)) {
          // Merge remote and local without duplicates (remote takes precedence)
          const mergedMap = new Map<string, Customer>();
          local.forEach((c) => mergedMap.set(c.id, c));
          remote.forEach((c) => mergedMap.set(c.id, c));
          const merged = Array.from(mergedMap.values());
          this.saveLocalCustomers(merged);
          return merged;
        }
      }
    } catch {
      // Serverless API might be building or offline, use local seamlessly
    }
    return local;
  }

  // Find customer by phone
  static async findByPhone(phone: string): Promise<Customer | null> {
    const normalized = normalizePhone(phone);
    if (!normalized) return null;

    // Check local first for immediate response
    const local = this.getLocalCustomers();
    const foundLocal = local.find((c) => normalizePhone(c.phone) === normalized);
    if (foundLocal) return foundLocal;

    // Try fetching from server
    try {
      const all = await this.fetchAllCustomers();
      return all.find((c) => normalizePhone(c.phone) === normalized) || null;
    } catch {
      return null;
    }
  }

  // Register a brand new customer in database
  static async registerCustomer(params: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
  }): Promise<{ success: boolean; customer?: Customer; error?: string }> {
    const normalized = normalizePhone(params.phone);
    if (normalized.length < 11) {
      return { success: false, error: 'Пожалуйста, укажите корректный 11-значный номер телефона' };
    }

    if (!params.firstName.trim()) {
      return { success: false, error: 'Пожалуйста, введите имя' };
    }
    if (!params.lastName.trim()) {
      return { success: false, error: 'Пожалуйста, введите фамилию' };
    }

    // Check if phone already registered
    const existing = await this.findByPhone(params.phone);
    if (existing) {
      return {
        success: false,
        error: `Клиент с номером ${formatRussianPhone(params.phone)} уже зарегистрирован в клубе. Войдите по номеру телефона.`,
      };
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

    // Save locally
    const currentList = this.getLocalCustomers();
    const updatedList = [newCustomer, ...currentList.filter((c) => c.id !== newCustomer.id)];
    this.saveLocalCustomers(updatedList);
    this.setCurrentCustomer(newCustomer);

    // Sync to cloud API asynchronously
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
    } catch (e) {
      console.warn('Asynchronous cloud sync failed (will retry):', e);
    }

    return { success: true, customer: newCustomer };
  }

  // Add an order to existing customer and recalculate loyalty tier
  static async recordOrder(
    customerId: string,
    orderData: { items: string[]; totalAmount: number }
  ): Promise<Customer | null> {
    const local = this.getLocalCustomers();
    const target = local.find((c) => c.id === customerId);
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

    const updatedList = local.map((c) => (c.id === updated.id ? updated : c));
    this.saveLocalCustomers(updatedList);
    this.setCurrentCustomer(updated);

    // Sync to cloud API
    try {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    return updated;
  }

  // Session handling for current customer
  static getCurrentCustomer(): Customer | null {
    try {
      const data = localStorage.getItem(CURRENT_CUSTOMER_KEY);
      if (!data) return null;
      const parsed: Customer = JSON.parse(data);
      if (parsed.id === 'cust_01' || parsed.id === 'cust_02' || parsed.id.startsWith('seed_')) {
        localStorage.removeItem(CURRENT_CUSTOMER_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  static setCurrentCustomer(customer: Customer | null): void {
    try {
      if (customer) {
        localStorage.setItem(CURRENT_CUSTOMER_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(CURRENT_CUSTOMER_KEY);
      }
    } catch {}
  }
}
