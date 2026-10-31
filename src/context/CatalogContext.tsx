import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Bouquet } from '../types/figma-app';
import { BOUQUETS_CATALOG } from '../data/bouquets';
import { getApiUrl } from '../config/api';

interface CatalogContextType {
  bouquets: Bouquet[];
  addBouquet: (newBouquet: Omit<Bouquet, 'id'>) => Promise<Bouquet>;
  updateBouquet: (id: string, updates: Partial<Bouquet>) => Promise<void>;
  deleteBouquet: (id: string) => Promise<boolean>;
  toggleStock: (id: string) => Promise<boolean>;
  resetToDefault: () => Promise<void>;
  clearAllBouquets: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  syncCatalog: () => Promise<boolean>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const STORAGE_KEY = 'sophiya_catalog_bouquets_v3';
const BACKUP_STORAGE_KEY = 'sophiya_catalog_bouquets_v2';

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [bouquets, setBouquets] = useState<Bouquet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load bouquets from storage:', e);
    }
    return BOUQUETS_CATALOG;
  });

  // Save changes to localStorage
  const saveToStorage = (items: Bouquet[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save bouquets:', e);
    }
  };

  // Sync catalog to cloud server
  const syncToCloud = async (items: Bouquet[]): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/catalog'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      return res.ok;
    } catch (e) {
      console.warn('Failed to sync catalog to cloud:', e);
      return false;
    }
  };

  // Fetch catalog from cloud on mount
  const refreshCatalog = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(getApiUrl(`/api/catalog?t=${Date.now()}`), {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote)) {
          // Automatic seed/repair: If cloud only contains 1 test item and local has the full catalogue
          if (remote.length === 1 && remote[0].id === '6' && BOUQUETS_CATALOG.length > 1) {
            console.info('Seeding cloud with initial full catalog...');
            await syncToCloud(BOUQUETS_CATALOG);
            setBouquets(BOUQUETS_CATALOG);
            saveToStorage(BOUQUETS_CATALOG);
            setLastSyncedAt(new Date());
            return;
          }

          if (remote.length > 0) {
            // Server is the Single Source of Truth: no ghost/zombie resurrecting from localStorage
            setBouquets(remote);
            saveToStorage(remote);
            setLastSyncedAt(new Date());
          } else {
            // Cloud not yet initialized: seed with default catalog
            await syncToCloud(BOUQUETS_CATALOG);
            setBouquets(BOUQUETS_CATALOG);
            saveToStorage(BOUQUETS_CATALOG);
            setLastSyncedAt(new Date());
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote catalog:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const addBouquet = async (newBouquetData: Omit<Bouquet, 'id'>): Promise<Bouquet> => {
    const newBouquet: Bouquet = {
      ...newBouquetData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = [newBouquet, ...bouquets];
    setBouquets(updated);
    saveToStorage(updated);
    setIsSyncing(true);
    try {
      const ok = await syncToCloud(updated);
      if (ok) setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
    return newBouquet;
  };

  const updateBouquet = async (id: string, updates: Partial<Bouquet>): Promise<void> => {
    const updated = bouquets.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBouquets(updated);
    saveToStorage(updated);
    setIsSyncing(true);
    try {
      const ok = await syncToCloud(updated);
      if (ok) setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteBouquet = async (id: string): Promise<boolean> => {
    const updated = bouquets.filter((b) => b.id !== id);
    setBouquets(updated);
    saveToStorage(updated);
    setIsSyncing(true);
    try {
      const ok = await syncToCloud(updated);
      if (ok) setLastSyncedAt(new Date());
      return ok;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleStock = async (id: string): Promise<boolean> => {
    const updated = bouquets.map((b) => (b.id === id ? { ...b, inStock: !b.inStock } : b));
    setBouquets(updated);
    saveToStorage(updated);
    setIsSyncing(true);
    try {
      const ok = await syncToCloud(updated);
      if (ok) setLastSyncedAt(new Date());
      return ok;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllBouquets = async (): Promise<void> => {
    setBouquets([]);
    saveToStorage([]);
    setIsSyncing(true);
    try {
      await syncToCloud([]);
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToDefault = async (): Promise<void> => {
    setBouquets(BOUQUETS_CATALOG);
    saveToStorage(BOUQUETS_CATALOG);
    setIsSyncing(true);
    try {
      await syncToCloud(BOUQUETS_CATALOG);
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const syncCatalog = async (): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const ok = await syncToCloud(bouquets);
      if (ok) {
        setLastSyncedAt(new Date());
      }
      return ok;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <CatalogContext.Provider
      value={{
        bouquets,
        addBouquet,
        updateBouquet,
        deleteBouquet,
        toggleStock,
        resetToDefault,
        clearAllBouquets,
        refreshCatalog,
        isSyncing,
        lastSyncedAt,
        syncCatalog,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
