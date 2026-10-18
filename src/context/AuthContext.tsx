import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer } from '../types/customer';
import { CustomerDatabaseService, normalizePhone, formatRussianPhone } from '../services/customerDb';

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
  registerCustomer: (data: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  completeRegistration: (firstName: string, lastName: string, birthDate?: string) => void;
  logout: () => void;
  addOrderToCustomer: (orderSummary: { items: string[]; totalAmount: number }) => void;
  allCustomers: Customer[];
  refreshCustomers: () => Promise<void>;
  pendingPhone: string;
  setPendingPhone: (phone: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize clean database without fake seed accounts
  const [customersDb, setCustomersDb] = useState<Customer[]>(() => {
    return CustomerDatabaseService.getLocalCustomers();
  });

  const [customer, setCustomer] = useState<Customer | null>(() => {
    return CustomerDatabaseService.getCurrentCustomer();
  });

  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sync with cloud on initial load
  const refreshCustomers = useCallback(async () => {
    try {
      const all = await CustomerDatabaseService.fetchAllCustomers();
      setCustomersDb(all);
      // If current customer is logged in, refresh their data as well
      if (customer) {
        const updatedSelf = all.find((c) => c.id === customer.id);
        if (updatedSelf) {
          setCustomer(updatedSelf);
          CustomerDatabaseService.setCurrentCustomer(updatedSelf);
        }
      }
    } catch (e) {
      console.warn('Failed to refresh customers from cloud:', e);
    }
  }, [customer]);

  useEffect(() => {
    refreshCustomers();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  // Direct login by phone
  const loginWithPhone = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    const found = await CustomerDatabaseService.findByPhone(phone);
    if (!found) {
      return {
        success: false,
        error: `Номер ${formatRussianPhone(phone)} ещё не зарегистрирован в клубе привилегий.`,
      };
    }
    setCustomer(found);
    CustomerDatabaseService.setCurrentCustomer(found);
    setIsAuthModalOpen(false);
    setIsProfileModalOpen(true);
    return { success: true };
  };

  // Direct real registration
  const registerCustomer = async (data: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const result = await CustomerDatabaseService.registerCustomer(data);
    if (!result.success || !result.customer) {
      return { success: false, error: result.error || 'Ошибка при сохранении клиента' };
    }

    setCustomer(result.customer);
    setCustomersDb(CustomerDatabaseService.getLocalCustomers());
    setIsAuthModalOpen(false);
    setIsProfileModalOpen(true);
    return { success: true };
  };

  // Request OTP for verification
  const requestOtp = async (phone: string): Promise<boolean> => {
    setPendingPhone(phone);
    // In production, triggers SMS gateway provider
    return true;
  };

  // Verify OTP
  const verifyOtp = async (_code: string): Promise<{ success: boolean; isNewUser: boolean }> => {
    const normalized = normalizePhone(pendingPhone);
    const existing = await CustomerDatabaseService.findByPhone(normalized);

    if (existing) {
      setCustomer(existing);
      CustomerDatabaseService.setCurrentCustomer(existing);
      setIsAuthModalOpen(false);
      return { success: true, isNewUser: false };
    }

    return { success: true, isNewUser: true };
  };

  // Complete registration for multi-step flows
  const completeRegistration = async (firstName: string, lastName: string, birthDate?: string) => {
    await registerCustomer({
      phone: pendingPhone,
      firstName,
      lastName,
      birthDate,
    });
  };

  const logout = () => {
    setCustomer(null);
    CustomerDatabaseService.setCurrentCustomer(null);
    setIsProfileModalOpen(false);
  };

  const addOrderToCustomer = async ({ items, totalAmount }: { items: string[]; totalAmount: number }) => {
    if (!customer) return;
    const updated = await CustomerDatabaseService.recordOrder(customer.id, { items, totalAmount });
    if (updated) {
      setCustomer(updated);
      setCustomersDb(CustomerDatabaseService.getLocalCustomers());
    }
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
        registerCustomer,
        loginWithPhone,
        completeRegistration,
        logout,
        addOrderToCustomer,
        allCustomers: customersDb,
        refreshCustomers,
        pendingPhone,
        setPendingPhone,
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
