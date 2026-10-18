import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Bouquet } from '../types/figma-app';
import { BOUQUETS_CATALOG } from '../data/bouquets';

interface CatalogContextType {
  bouquets: Bouquet[];
  addBouquet: (newBouquet: Omit<Bouquet, 'id'>) => Bouquet;
  updateBouquet: (id: string, updates: Partial<Bouquet>) => void;
  deleteBouquet: (id: string) => void;
  toggleStock: (id: string) => void;
  resetToDefault: () => void;
  clearAllBouquets: () => void;
  refreshCatalog: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const STORAGE_KEY = 'sophiya_catalog_bouquets_v3';
const BACKUP_STORAGE_KEY = 'sophiya_catalog_bouquets_v2';

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bouquets, setBouquets] = useState<Bouquet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
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
  const syncToCloud = async (items: Bouquet[]) => {
    try {
      await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Failed to sync catalog to cloud:', e);
    }
  };

  // Fetch catalog from cloud on mount
  const refreshCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote)) {
          setBouquets(remote);
          saveToStorage(remote);
        } else {
          // Cloud not yet initialized: seed it with current local bouquets
          const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(BACKUP_STORAGE_KEY);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                syncToCloud(parsed);
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote catalog:', err);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const addBouquet = (newBouquetData: Omit<Bouquet, 'id'>): Bouquet => {
    const newBouquet: Bouquet = {
      ...newBouquetData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setBouquets((prev) => {
      const updated = [newBouquet, ...prev];
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
    return newBouquet;
  };

  const updateBouquet = (id: string, updates: Partial<Bouquet>) => {
    setBouquets((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
  };

  const deleteBouquet = (id: string) => {
    setBouquets((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
  };

  const toggleStock = (id: string) => {
    setBouquets((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, inStock: !b.inStock } : b));
      saveToStorage(updated);
      syncToCloud(updated);
      return updated;
    });
  };

  const clearAllBouquets = () => {
    setBouquets([]);
    saveToStorage([]);
    syncToCloud([]);
  };

  const resetToDefault = () => {
    setBouquets(BOUQUETS_CATALOG);
    saveToStorage(BOUQUETS_CATALOG);
    syncToCloud(BOUQUETS_CATALOG);
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
