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
  clearAllBouquets: () => void;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const STORAGE_KEY = 'sophiya_catalog_bouquets_v2';

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bouquets, setBouquets] = useState<Bouquet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If the user deleted bouquets (even if 0 remain), honor their choice!
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

  const addBouquet = (newBouquetData: Omit<Bouquet, 'id'>): Bouquet => {
    const newBouquet: Bouquet = {
      ...newBouquetData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setBouquets((prev) => {
      const updated = [newBouquet, ...prev];
      saveToStorage(updated);
      return updated;
    });
    return newBouquet;
  };

  const updateBouquet = (id: string, updates: Partial<Bouquet>) => {
    setBouquets((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      saveToStorage(updated);
      return updated;
    });
  };

  const deleteBouquet = (id: string) => {
    setBouquets((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      saveToStorage(updated);
      return updated;
    });
  };

  const toggleStock = (id: string) => {
    setBouquets((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, inStock: !b.inStock } : b));
      saveToStorage(updated);
      return updated;
    });
  };

  const clearAllBouquets = () => {
    setBouquets([]);
    saveToStorage([]);
  };

  const resetToDefault = () => {
    setBouquets(BOUQUETS_CATALOG);
    saveToStorage(BOUQUETS_CATALOG);
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
