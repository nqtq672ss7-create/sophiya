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
  lastSyncedAt: Date|null;
  syncCatalog: () => Promise<boolean>;
}

const CatalogContext = createContext<CatalogContextType|undefined>(undefined);

// Bumped storage key so that old 5-bouquet demo caches on phones are instantly purged
const CATALOG_STORE_ID = 'sophiya_catalog_bouquets_v6_live';
const LEGACY_STORE_IDS = [
  'sophiya_catalog_bouquets_v5_live',
  'sophiya_catalog_bouquets_v4_clean',
  'sophiya_catalog_bouquets_v3',
  'sophiya_catalog_bouquets_v2',
  'sophiya_catalog_bouquets',
];

function isStaleDemoCache(items: Bouquet[]): boolean {
  if (items.length === 0) return false;
  const hasOnlyLegacyDemoIds = items.every((b) => ['1', '2', '3', '4', '5', '6'].includes(b.id));
  return hasOnlyLegacyDemoIds && BOUQUETS_CATALOG.length > items.length;
}

const IDB_NAME = 'sophiya_catalog_db';
const IDB_STORE = 'catalog';
const IDB_RECORD_ID = 'live_v1';
const CATALOG_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

function openCatalogDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetCatalog(): Promise<Bouquet[]|null> {
  try {
    const db = await openCatalogDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_RECORD_ID);
      req.onsuccess = () => {
        const val = req.result;
        resolve(Array.isArray(val) && val.length > 0 ? val : null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSetCatalog(items: Bouquet[]): Promise<void> {
  try {
    const db = await openCatalogDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(items, IDB_RECORD_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date|null>(null);
  const hasRemoteSyncRef = React.useRef<boolean>(false);
  const inFlightRef = React.useRef<boolean>(false);
  const lastFetchMsRef = React.useRef<number>(0);

  // Initial state: localStorage -> SSR-injected __INITIAL_CATALOG__ -> static BOUQUETS_CATALOG fallback
  const [bouquets, setBouquets] = useState<Bouquet[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        LEGACY_STORE_IDS.forEach((k) => localStorage.removeItem(k));
        const saved = localStorage.getItem(CATALOG_STORE_ID);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && !isStaleDemoCache(parsed)) {
            return parsed;
          }
        }
        const ssrCatalog = (window as unknown as { __INITIAL_CATALOG__?: Bouquet[] }).__INITIAL_CATALOG__;
        if (Array.isArray(ssrCatalog) && ssrCatalog.length > 0) {
          return ssrCatalog;
        }
      }
    } catch (e) {
      console.warn('Storage init fallback:', e);
    }
    return BOUQUETS_CATALOG;
  });

  const saveToStorage = (items: Bouquet[]) => {
    void idbSetCatalog(items);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CATALOG_STORE_ID, JSON.stringify(items));
      }
    } catch (e) {
      try {
        LEGACY_STORE_IDS.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(CATALOG_STORE_ID, JSON.stringify(items));
      } catch {
        try {
          localStorage.removeItem(CATALOG_STORE_ID);
        } catch {}
        console.warn('localStorage quota exceeded, persisted catalog in IndexedDB:', e);
      }
    }
  };

  const syncToCloud = async (payload: any): Promise<{ ok: boolean; status?: number; error?: string; data?: any }> => {
    const token =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('sophiya_admin_token')
        : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const bodyStr = JSON.stringify(payload);

    const maxAttempts = 3;
    let lastErrorMsg = 'Не удалось синхронизировать каталог с облаком.';
    let lastStatus = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 20000) : null;

        const res = await fetch(getApiUrl('/api/catalog'), {
          method: 'POST',
          headers,
          body: bodyStr,
          signal: controller?.signal,
        });

        if (timer) clearTimeout(timer);

        if (res.ok) {
          const resData = await res.json().catch(() => ({}));
          return { ok: true, status: res.status, data: resData };
        }

        lastStatus = res.status;
        let serverError = '';
        try {
          const data = await res.json();
          if (data && typeof data.error === 'string') {
            serverError = data.error;
          }
        } catch {}

        if (res.status === 401) {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('sophiya_admin_token');
            localStorage.removeItem('sophiya_admin_token_v1');
            window.dispatchEvent(new CustomEvent('sophiya_admin_session_expired'));
          }
          return {
            ok: false,
            status: 401,
            error: serverError || 'Время сессии истекло. Пожалуйста, введите пароль снова.',
          };
        }

        if (res.status === 413) {
          return {
            ok: false,
            status: 413,
            error: 'Слишком большой объем данных букета. Рекомендуется выбрать другое фото.',
          };
        }

        lastErrorMsg = serverError || `Ошибка сервера (${res.status}).`;

        if (res.status >= 400 && res.status < 500) {
          return { ok: false, status: res.status, error: lastErrorMsg };
        }
      } catch (err: any) {
        const isAbort = err?.name === 'AbortError';
        lastErrorMsg = isAbort
          ? 'Таймаут соединения с облачной базой. Проверьте скорость интернета.'
          : 'Сбой интернет-соединения при отправке данных в облако.';
        console.warn(`[CatalogSync] Попытка ${attempt}/${maxAttempts} не удалась:`, err);
      }

      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }

    return { ok: false, status: lastStatus, error: lastErrorMsg };
  };

  // Fetch the definitive catalog from cloud
  const refreshCatalog = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    lastFetchMsRef.current = Date.now();
    setIsSyncing(true);
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;

      const res = await fetch(getApiUrl('/api/catalog'), {
        cache: 'no-cache',
        signal: controller?.signal,
      });
      if (timer) clearTimeout(timer);

      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          hasRemoteSyncRef.current = true;
          setBouquets(remote);
          saveToStorage(remote);
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.warn('Failed to fetch remote catalog:', err);
    } finally {
      inFlightRef.current = false;
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  // Fetch once on mount and throttled (>= 5 min) on tab visibility resume
  useEffect(() => {
    let active = true;
    idbGetCatalog().then((cached) => {
      if (active && cached && !hasRemoteSyncRef.current && !isStaleDemoCache(cached)) {
        setBouquets(cached);
      }
    });
    refreshCatalog();

    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastFetchMsRef.current >= CATALOG_REFRESH_COOLDOWN_MS
      ) {
        refreshCatalog();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshCatalog]);

  // When adding: uses fast granular cloud action so payload is tiny (~30 KB) and never times out!
  const addBouquet = async (newBouquetData: Omit<Bouquet, 'id'>): Promise<Bouquet> => {
    setIsSyncing(true);
    const newBouquet: Bouquet = {
      ...newBouquetData,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };

    try {
      const result = await syncToCloud({ action: 'add', item: newBouquet });
      if (!result.ok) {
        throw new Error(result.error || 'Не удалось сохранить букет в облачную базу');
      }

      setBouquets((prev) => {
        const updated = [newBouquet, ...prev.filter((b) => b.id !== newBouquet.id)];
        saveToStorage(updated);
        return updated;
      });
      setLastSyncedAt(new Date());
      return newBouquet;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateBouquet = async (id: string, updates: Partial<Bouquet>): Promise<void> => {
    setIsSyncing(true);
    try {
      const result = await syncToCloud({ action: 'update', id, updates });
      if (!result.ok) throw new Error(result.error || 'Не удалось обновить букет в облачной базе');

      setBouquets((prev) => {
        const updated = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
        saveToStorage(updated);
        return updated;
      });
      setLastSyncedAt(new Date());
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteBouquet = async (id: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const result = await syncToCloud({ action: 'delete', id });
      if (!result.ok) throw new Error(result.error || 'Не удалось удалить букет из облачной базы');

      setBouquets((prev) => {
        const updated = prev.filter((b) => b.id !== id);
        saveToStorage(updated);
        return updated;
      });
      setLastSyncedAt(new Date());
      return true;
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleStock = async (id: string): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const result = await syncToCloud({ action: 'toggleStock', id });
      if (!result.ok) throw new Error(result.error || 'Не удалось изменить статус наличия');

      setBouquets((prev) => {
        const updated = prev.map((b) => (b.id === id ? { ...b, inStock: !b.inStock } : b));
        saveToStorage(updated);
        return updated;
      });
      setLastSyncedAt(new Date());
      return true;
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAllBouquets = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      const result = await syncToCloud([]);
      if (result.ok) {
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
      const result = await syncToCloud(BOUQUETS_CATALOG);
      if (result.ok) {
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
      const result = await syncToCloud(bouquets);
      if (result.ok) {
        setLastSyncedAt(new Date());
      }
      return result.ok;
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
