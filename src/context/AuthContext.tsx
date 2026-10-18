import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, CustomerOrder, calculateLoyaltyTier } from '../types/customer';

interface AuthContextType {
  customer: Customer | null;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<{ success: boolean; isNewUser: boolean }>;
  completeRegistration: (firstName: string, lastName: string, birthDate?: string) => void;
  logout: () => void;
  addOrderToCustomer: (orderSummary: { items: string[]; totalAmount: number }) => void;
  allCustomers: Customer[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust_01',
    phone: '+7 (917) 256-32-35',
    firstName: 'Айгуль',
    lastName: 'Сафина',
    birthDate: '1992-05-18',
    totalSpent: 34200,
    ordersCount: 6,
    discountPercent: 7,
    tier: 'Золотой',
    registeredAt: '2024-03-12',
    orders: [
      {
        id: 'ord_101',
        date: '14.10.2024',
        items: ['Бархатный Марсала (25 роз)'],
        totalAmount: 4800,
        discountApplied: 336,
        finalAmount: 4464,
        status: 'Доставлен',
      },
      {
        id: 'ord_102',
        date: '01.09.2024',
        items: ['Французский Сад', 'Открытка ручной работы'],
        totalAmount: 6600,
        discountApplied: 462,
        finalAmount: 6138,
        status: 'Доставлен',
      },
      {
        id: 'ord_103',
        date: '22.07.2024',
        items: ['Пудровая Мелодия'],
        totalAmount: 5600,
        discountApplied: 392,
        finalAmount: 5208,
        status: 'Доставлен',
      },
    ],
  },
  {
    id: 'cust_02',
    phone: '+7 (917) 123-45-67',
    firstName: 'Руслан',
    lastName: 'Гарипов',
    birthDate: '1988-11-04',
    totalSpent: 12400,
    ordersCount: 2,
    discountPercent: 5,
    tier: 'Серебряный',
    registeredAt: '2024-06-15',
    orders: [
      {
        id: 'ord_201',
        date: '08.03.2024',
        items: ['Букет из 51 пиона'],
        totalAmount: 12400,
        discountApplied: 372,
        finalAmount: 12028,
        status: 'Доставлен',
      },
    ],
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customersDb, setCustomersDb] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem('sofiya_customers_db');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SEED_CUSTOMERS;
  });

  const [customer, setCustomer] = useState<Customer | null>(() => {
    try {
      const saved = localStorage.getItem('sofiya_current_customer');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sofiya_customers_db', JSON.stringify(customersDb));
  }, [customersDb]);

  useEffect(() => {
    if (customer) {
      localStorage.setItem('sofiya_current_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('sofiya_current_customer');
    }
  }, [customer]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const requestOtp = async (phone: string): Promise<boolean> => {
    setPendingPhone(phone);
    // In production, trigger SMS gateway / WhatsApp OTP.
    return true;
  };

  const verifyOtp = async (_code: string): Promise<{ success: boolean; isNewUser: boolean }> => {
    // In demo/test environment, any 4-digit code works (e.g. 1111 or 0000)
    const normalizedPhone = pendingPhone.trim();
    const existing = customersDb.find((c) => c.phone.replace(/\D/g, '') === normalizedPhone.replace(/\D/g, ''));

    if (existing) {
      setCustomer(existing);
      setIsAuthModalOpen(false);
      return { success: true, isNewUser: false };
    }

    return { success: true, isNewUser: true };
  };

  const completeRegistration = (firstName: string, lastName: string, birthDate?: string) => {
    const { tier } = calculateLoyaltyTier(0);
    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      phone: pendingPhone,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      totalSpent: 0,
      ordersCount: 0,
      discountPercent: tier.discountPercent,
      tier: tier.name,
      orders: [],
      registeredAt: new Date().toISOString().split('T')[0],
    };

    setCustomersDb((prev) => [newCustomer, ...prev]);
    setCustomer(newCustomer);
    setIsAuthModalOpen(false);
    setIsProfileModalOpen(true);
  };

  const logout = () => {
    setCustomer(null);
    setIsProfileModalOpen(false);
  };

  const addOrderToCustomer = ({ items, totalAmount }: { items: string[]; totalAmount: number }) => {
    if (!customer) return;

    const discountAmount = Math.round((totalAmount * customer.discountPercent) / 100);
    const finalAmount = totalAmount - discountAmount;

    const newOrder: CustomerOrder = {
      id: `ord_${Date.now()}`,
      date: new Date().toLocaleDateString('ru-RU'),
      items,
      totalAmount,
      discountApplied: discountAmount,
      finalAmount,
      status: 'Собирается',
    };

    const newTotalSpent = customer.totalSpent + finalAmount;
    const { tier } = calculateLoyaltyTier(newTotalSpent);

    const updatedCustomer: Customer = {
      ...customer,
      totalSpent: newTotalSpent,
      ordersCount: customer.ordersCount + 1,
      discountPercent: tier.discountPercent,
      tier: tier.name,
      orders: [newOrder, ...customer.orders],
    };

    setCustomer(updatedCustomer);
    setCustomersDb((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAuthModalOpen,
        isProfileModalOpen,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        requestOtp,
        verifyOtp,
        completeRegistration,
        logout,
        addOrderToCustomer,
        allCustomers: customersDb,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
