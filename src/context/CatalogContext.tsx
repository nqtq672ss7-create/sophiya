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
  isLoading: boolean;
  lastSyncedAt: Date | null;
  syncCatalog: () => Promise<boolean>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

// Bumped storage key so that old dirty browser caches in Vivaldi/Safari are instantly ignored
const STORAGE_KEY = 'sophiya_catalog_bouquets_v4_clean';

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Initial state: starts clean, clears rogue legacy keys
  const [bouquets, setBouquets] = useState<Bouquet[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sophiya_catalog_bouquets_v3');
        localStorage.removeItem('sophiya_catalog_bouquets_v2');
        localStorage.removeItem('sophiya_catalog_bouquets');
      }

      const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Storage init fallback:', e);
    }
    return BOUQUETS_CATALOG;
  });

  const saveToStorage = (items: Bouquet[]) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  };

  const syncToCloud = async (items: Bouquet[]): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/catalog'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
      return res.ok;
    } catch (e) {
      console.error('Failed to sync catalog to cloud:', e);
      return false;
    }
  };

  // Fetch the definitive catalog from cloud
  const refreshCatalog = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(getApiUrl(`/api/catalog?t=${Date.now()}`), {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          // Cloud is the single absolute truth for all devices
          setBouquets(remote);
          saveToStorage(remote);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote catalog:', err);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount AND whenever the user switches back to this tab/window
  useEffect(() => {
    refreshCatalog();

    const onFocus = () => {
      refreshCatalog();
    };
    window.addEventListener('focus', onFocus);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCatalog();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshCatalog]);

  // When adding: fetch latest from cloud first to avoid overwriting another device's changes!
  const addBouquet = async (newBouquetData: Omit<Bouquet, 'id'>): Promise<Bouquet> => {
    setIsSyncing(true);
    const newBouquet: Bouquet = {
      ...newBouquetData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    try {
      // 1. Fetch fresh cloud catalog first
      let currentItems = bouquets;
      try {
        const res = await fetch(getApiUrl(`/api/catalog?t=${Date.now()}`));
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote)) {
            currentItems = remote;
          }
        }
      } catch {}

      const updated = [newBouquet, ...currentItems];
      const ok = await syncToCloud(updated);
      if (!ok) {
        throw new Error('Не удалось сохранить букет в облачную базу');
      }

      setBouquets(updated);
      saveToStorage(updated);
      setLastSyncedAt(new Date());
      return newBouquet;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateBouquet = async (id: string, updates: Partial<Bouquet>): Promise<void> => {
    setIsSyncing(true);
    try {
      let currentItems = bouquets;
      try {
        const res = await fetch(getApiUrl(`/api/catalog?t=${Date.now()}`));
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote)) currentItems = remote;
        }
      } catch {}

      const updated = currentItems.map((b) => (b.id === id ? { ...b, ...updates } : b));
      const ok = await syncToCloud(updated);
      if (!ok) throw new Error('Не удалось обновить букет в облачной базе');

      setBouquets(updated);
      saveToStorage(updated);
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteBouquet = async (id: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      let currentItems = bouquets;
      try {
        const res = await fetch(getApiUrl(`/api/catalog?t=${Date.now()}`));
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote)) currentItems = remote;
        }
      } catch {}

      const updated = currentItems.filter((b) => b.id !== id);
      const ok = await syncToCloud(updated);
      if (!ok) throw new Error('Не удалось удалить букет из облачной базы');

      setBouquets(updated);
      saveToStorage(updated);
      setLastSyncedAt(new Date());
      return true;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleStock = async (id: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      let currentItems = bouquets;
      try {
        const res = await fetch(getApiUrl(`/api/catalog?t=${Date.now()}`));
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote)) currentItems = remote;
        }
      } catch {}

      const updated = currentItems.map((b) => (b.id === id ? { ...b, inStock: !b.inStock } : b));
      const ok = await syncToCloud(updated);
      if (ok) {
        setBouquets(updated);
        saveToStorage(updated);
        setLastSyncedAt(new Date());
      }
      return ok;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllBouquets = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      const ok = await syncToCloud([]);
      if (ok) {
        setBouquets([]);
        saveToStorage([]);
        setLastSyncedAt(new Date());
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToDefault = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      const ok = await syncToCloud(BOUQUETS_CATALOG);
      if (ok) {
        setBouquets(BOUQUETS_CATALOG);
        saveToStorage(BOUQUETS_CATALOG);
        setLastSyncedAt(new Date());
      }
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
        isLoading,
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
