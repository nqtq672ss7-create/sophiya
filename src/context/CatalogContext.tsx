import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bouquet } from '../types/figma-app';
import { BOUQUETS_CATALOG } from '../data/bouquets';

interface CatalogContextType {
  bouquets: Bouquet[];
  addBouquet: (newBouquet: Omit<Bouquet, 'id'>) => Bouquet;
  updateBouquet: (id: string, updates: Partial<Bouquet>) => void;
  deleteBouquet: (id: string) => void;
  toggleStock: (id: string) => void;
  resetToDefault: () => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const STORAGE_KEY = 'sophiya_catalog_bouquets_v1';

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bouquets, setBouquets] = useState<Bouquet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bouquets));
    } catch (e) {
      console.error('Failed to persist bouquets to storage:', e);
    }
  }, [bouquets]);

  const addBouquet = (newBouquetData: Omit<Bouquet, 'id'>): Bouquet => {
    const newBouquet: Bouquet = {
      ...newBouquetData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setBouquets((prev) => [newBouquet, ...prev]);
    return newBouquet;
  };

  const updateBouquet = (id: string, updates: Partial<Bouquet>) => {
    setBouquets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBouquet = (id: string) => {
    setBouquets((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleStock = (id: string) => {
    setBouquets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, inStock: !b.inStock } : b))
    );
  };

  const resetToDefault = () => {
    setBouquets(BOUQUETS_CATALOG);
    localStorage.removeItem(STORAGE_KEY);
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
