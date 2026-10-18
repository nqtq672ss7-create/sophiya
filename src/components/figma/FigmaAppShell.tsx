import React, { useState, useMemo, useEffect } from 'react';
import { FigmaSplashScreen } from './FigmaSplashScreen';
import { FigmaCatalogScreen } from './FigmaCatalogScreen';
import { FigmaBottomNav, FigmaTab } from './FigmaBottomNav';
import { FigmaProductDetailModal } from './FigmaProductDetailModal';
import { FigmaFilterModal } from './FigmaFilterModal';
import { FigmaCartScreen } from './FigmaCartScreen';
import { FigmaProfileScreen } from './FigmaProfileScreen';
import { FigmaDesktopHeader } from './FigmaDesktopHeader';
import { FigmaFooter } from './FigmaFooter';
import { AuthModal } from '../auth/AuthModal';
import { SalonAdminClientsModal } from '../admin/SalonAdminClientsModal';
import { BOUQUETS_CATALOG } from '../../data/bouquets';
import { Bouquet, CartItem, FilterOptions } from '../../types/figma-app';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';

export const FigmaAppShell: React.FC = () => {
  const { customer, openAuthModal } = useAuth();
  const { bouquets } = useCatalog();

  const [showSplash, setShowSplash] = useState(false);
  const [activeTab, setActiveTab] = useState<FigmaTab>('catalog');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedBouquet, setSelectedBouquet] = useState<Bouquet | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdminCrmOpen, setIsAdminCrmOpen] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: 0,
    maxPrice: 30000,
    category: 'Все',
    color: 'Все',
  });

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const cartTotal = useMemo(() => {
    const raw = cartItems.reduce((sum, item) => sum + item.bouquet.price * item.quantity, 0);
    const discount = customer?.discountPercent || 0;
    return raw - Math.round((raw * discount) / 100);
  }, [cartItems, customer]);

  const filteredBouquets = useMemo(() => {
    return bouquets.filter((b) => {
      if (filters.category !== 'Все' && b.category !== filters.category) return false;
      if (filters.color !== 'Все' && b.color !== filters.color) return false;
      if (b.price < filters.minPrice) return false;
      if (filters.maxPrice > 0 && b.price > filters.maxPrice) return false;
      return true;
    });
  }, [filters, bouquets]);

  const handleAddToCart = (bouquet: Bouquet, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCartItems((prev) => {
      const existing = prev.find((i) => i.bouquet.id === bouquet.id);
      if (existing) {
        return prev.map((i) =>
          i.bouquet.id === bouquet.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { bouquet, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (bouquetId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.bouquet.id === bouquetId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (bouquetId: string) => {
    setCartItems((prev) => prev.filter((item) => item.bouquet.id !== bouquetId));
  };

  // Secret access to CRM for owner: /admin, /crm, #admin, or #crm in URL
  const handleCloseAdminCrm = () => {
    setIsAdminCrmOpen(false);
    const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
    const hash = window.location.hash.toLowerCase();
    if (path === '/admin' || path === '/crm') {
      window.history.replaceState({}, '', '/' + window.location.search);
    } else if (hash === '#admin' || hash === '#crm') {
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
  };

  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      const hash = window.location.hash.toLowerCase();
      if (
        path === '/admin' ||
        path === '/crm' ||
        hash === '#admin' ||
        hash === '#crm'
      ) {
        setIsAdminCrmOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  // Secret keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')
      ) {
        e.preventDefault();
        setIsAdminCrmOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col text-zinc-900 selection:bg-[#6C1E26] selection:text-white">
      {/* 1. Header: Minimalist Luxury Navigation with Official Logo (Desktop only) */}
      <div className="hidden md:block">
        <FigmaDesktopHeader
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          cartCount={cartCount}
          cartTotal={cartTotal}
          onSecretCrmTrigger={() => setIsAdminCrmOpen(true)}
        />
      </div>

      {/* 2. Main Content Area */}
      <main className="flex-1 w-full flex flex-col justify-between">
        <div>
          {activeTab === 'catalog' && (
            <FigmaCatalogScreen
              bouquets={filteredBouquets}
              onSelectBouquet={(b) => setSelectedBouquet(b)}
              onAddToCart={handleAddToCart}
              onOpenFilter={() => setIsFilterOpen(true)}
              activeCategory={filters.category}
              onSelectCategory={(cat) => setFilters((prev) => ({ ...prev, category: cat }))}
              userDiscount={customer?.discountPercent || 0}
            />
          )}

          {activeTab === 'cart' && (
            <FigmaCartScreen
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onExploreCatalog={() => setActiveTab('catalog')}
              onClearCart={() => setCartItems([])}
            />
          )}

          {activeTab === 'profile' && (
            <FigmaProfileScreen
              onOpenAuth={openAuthModal}
              onOpenCrm={() => setIsAdminCrmOpen(true)}
              onGoToCatalog={() => {
                setActiveTab('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>

        {/* Floating Bottom Nav ONLY on small mobile screens (< 768px) */}
        <FigmaBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          cartCount={cartCount}
          className="md:hidden"
        />

        {/* Luxury Desktop Footer */}
        <FigmaFooter
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCrm={() => setIsAdminCrmOpen(true)}
        />
      </main>

      {/* 3. Modals & Overlays */}
      {/* Product Detail Modal */}
      <FigmaProductDetailModal
        bouquet={selectedBouquet}
        onClose={() => setSelectedBouquet(null)}
        onAddToCart={(b) => handleAddToCart(b)}
        userDiscount={customer?.discountPercent || 0}
      />

      {/* Filter Modal */}
      <FigmaFilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        options={filters}
        onApply={(newOpts) => setFilters(newOpts)}
      />

      {/* Splash Screen */}
      {showSplash && <FigmaSplashScreen onEnter={() => setShowSplash(false)} />}

      {/* Global Modals: Auth & CRM */}
      <AuthModal />
      <SalonAdminClientsModal
        isOpen={isAdminCrmOpen}
        onClose={handleCloseAdminCrm}
      />
    </div>
  );
};
