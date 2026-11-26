import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer } from '../types/customer';
import { CustomerDatabaseService } from '../services/customerDb';

interface AuthContextType {
  customer: Customer|null;
  isAuthLoading: boolean;
  isAuthModalOpen: boolean;
  isProfileModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  registerCustomer: (data: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    password: string;
    consent: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (phone: string, password: string) => Promise<{ success: boolean; error?: string; needsPasswordSetup?: boolean }>;
  claimCustomerPassword: (data: {
    phone: string;
    firstName: string;
    password: string;
    consent: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  refreshCustomerSession: () => Promise<void>;
  logout: () => Promise<void>;
  forgetCustomerData: () => Promise<{ ok: boolean; error?: string }>;
  allCustomers: Customer[];
  refreshCustomers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType|undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customersDb, setCustomersDb] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer|null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const refreshCustomerSession = useCallback(async () => {
    try {
      const sessionCustomer = await CustomerDatabaseService.fetchCustomerSession();
      setCustomer(sessionCustomer);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomerSession();
  }, [refreshCustomerSession]);

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

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);
  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  const loginWithPassword = async (
    phone: string,
    password: string
  ): Promise<{ success: boolean; error?: string; needsPasswordSetup?: boolean }> => {
    const result = await CustomerDatabaseService.loginWithPassword(phone, password);
    if (!result.success || !result.customer) {
      return {
        success: false,
        error: result.error || 'Неверный номер телефона или пароль',
        needsPasswordSetup: result.needsPasswordSetup,
      };
    }
    setCustomer(result.customer);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const claimCustomerPassword = async (data: {
    phone: string;
    firstName: string;
    password: string;
    consent: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const result = await CustomerDatabaseService.claimPassword(data);
    if (!result.success || !result.customer) {
      return { success: false, error: result.error || 'Не удалось задать пароль' };
    }
    setCustomer(result.customer);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const registerCustomer = async (data: {
    phone: string;
    firstName: string;
    lastName: string;
    birthDate?: string;
    password: string;
    consent: boolean;
  }): Promise<{ success: boolean; error?: string }> => {
    const result = await CustomerDatabaseService.registerWithPassword(data);
    if (!result.success || !result.customer) {
      return { success: false, error: result.error || 'Не удалось завершить регистрацию' };
    }
    setCustomer(result.customer);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const logout = async () => {
    setCustomer(null);
    setIsProfileModalOpen(false);
    await CustomerDatabaseService.logoutSession();
  };

  const forgetCustomerData = async (): Promise<{ ok: boolean; error?: string }> => {
    const res = await CustomerDatabaseService.deleteAccountServer();
    if (res.ok) {
      if (customer) {
        CustomerDatabaseService.forgetCustomer(customer.id);
      }
      setCustomer(null);
      setIsProfileModalOpen(false);
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        isAuthLoading,
        isAuthModalOpen,
        isProfileModalOpen,
        openAuthModal,
        closeAuthModal,
        openProfileModal,
        closeProfileModal,
        registerCustomer,
        loginWithPassword,
        claimCustomerPassword,
        refreshCustomerSession,
        logout,
        forgetCustomerData,
        allCustomers: customersDb,
        refreshCustomers,
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
