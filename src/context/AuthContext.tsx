import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer } from '../types/customer';
import { CustomerDatabaseService } from '../services/customerDb';

interface AuthContextType {
  customer: Customer|null;
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
  forgetCustomerData: () => Promise<void>;
  addOrderToCustomer: (orderSummary: { items: string[]; totalAmount: number }) => void;
  allCustomers: Customer[];
  refreshCustomers: () => Promise<void>;
  pendingPhone: string;
  setPendingPhone: (phone: string) => void;
}

const AuthContext = createContext<AuthContextType|undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customersDb, setCustomersDb] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer|null>(null);
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Admin-only cloud sync (invoked only from unlocked SalonAdminClientsModal)
  const refreshCustomers = useCallback(async () => {
    const hasAdminToken =
      typeof window !== 'undefined' &&
      Boolean(sessionStorage.getItem('sophiya_admin_token'));
    if (!hasAdminToken) return;

    try {
      const all = await CustomerDatabaseService.fetchAllCustomers();
      setCustomersDb(all);
    } catch (e) {
      console.warn('Failed to refresh customers from cloud:', e);
    }
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(false);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openProfileModal = () => setIsProfileModalOpen(false);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  // Disabled unauthenticated phone login until real SMS OTP provider is connected
  const loginWithPhone = async (_phone: string): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error: 'Личный кабинет временно закрыт на обновление. Оформляйте заказы напрямую в корзине без регистрации.',
    };
  };

  const registerCustomer = async (_data: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error: 'Регистрация временно приостановлена. Быстрый заказ доступен в корзине.',
    };
  };

  const requestOtp = async (_phone: string): Promise<boolean> => {
    return false;
  };

  const verifyOtp = async (_code: string): Promise<{ success: boolean; isNewUser: boolean }> => {
    return { success: false, isNewUser: false };
  };

  const completeRegistration = async () => {};

  const logout = () => {
    setCustomer(null);
    CustomerDatabaseService.setCurrentCustomer(null);
    setIsProfileModalOpen(false);
  };

  const forgetCustomerData = async () => {
    if (customer) {
      CustomerDatabaseService.forgetCustomer(customer.id);
      setCustomer(null);
      setIsProfileModalOpen(false);
    }
  };

  const addOrderToCustomer = () => {};

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
        forgetCustomerData,
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
