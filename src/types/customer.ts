export type LoyaltyTierName = 'Знакомство' | 'Серебряный' | 'Золотой' | 'Платиновый';

export interface LoyaltyTier {
  name: LoyaltyTierName;
  minSpend: number;
  discountPercent: number;
  badgeColor: string;
  description: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Знакомство',
    minSpend: 0,
    discountPercent: 3,
    badgeColor: 'text-sofiya-viola',
    description: 'Приветственная скидка 3% на все букеты',
  },
  {
    name: 'Серебряный',
    minSpend: 10000,
    discountPercent: 5,
    badgeColor: 'text-zinc-300',
    description: 'Постоянная скидка 5% при сумме заказов от 10 000 ₽',
  },
  {
    name: 'Золотой',
    minSpend: 25000,
    discountPercent: 7,
    badgeColor: 'text-amber-300',
    description: 'Скидка 7% + приоритетная доставка при заказах от 25 000 ₽',
  },
  {
    name: 'Платиновый',
    minSpend: 50000,
    discountPercent: 10,
    badgeColor: 'text-purple-300',
    description: 'Максимальная скидка 10% + персональный флорист',
  },
];

export interface CustomerOrder {
  id: string;
  date: string;
  items: string[];
  totalAmount: number;
  discountApplied: number;
  finalAmount: number;
  status: 'Доставлен' | 'В пути' | 'Собирается';
}

export interface Customer {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  totalSpent: number;
  ordersCount: number;
  discountPercent: number;
  tier: LoyaltyTierName;
  orders: CustomerOrder[];
  registeredAt: string;
}

export function calculateLoyaltyTier(totalSpent: number): { tier: LoyaltyTier; nextTier: LoyaltyTier | null; amountToNextTier: number } {
  let currentTier = LOYALTY_TIERS[0];
  let nextTier: LoyaltyTier | null = LOYALTY_TIERS[1];

  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (totalSpent >= LOYALTY_TIERS[i].minSpend) {
      currentTier = LOYALTY_TIERS[i];
      nextTier = i < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[i + 1] : null;
      break;
    }
  }

  const amountToNextTier = nextTier ? Math.max(0, nextTier.minSpend - totalSpent) : 0;

  return { tier: currentTier, nextTier, amountToNextTier };
}
