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
import { Bouquet, CartItem, FilterOptions } from '../../types/figma-app';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { getRouteByPath, SEO_ROUTES, SeoRoute, filterBouquetsForRoute } from '../../utils/routes';

export const FigmaAppShell: React.FC = () => {
  const { customer, openAuthModal } = useAuth();
  const { bouquets } = useCatalog();

  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const initialRoute = getRouteByPath(initialPath);

  const [currentRoute, setCurrentRoute] = useState<SeoRoute>(initialRoute);
  const [showSplash, setShowSplash] = useState(false);
  const [activeTab, setActiveTab] = useState<FigmaTab>(() => {
    if (initialPath.startsWith('/cart')) return 'cart';
    if (initialPath.startsWith('/profile')) return 'profile';
    return 'catalog';
  });

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedBouquet, setSelectedBouquet] = useState<Bouquet | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdminCrmOpen, setIsAdminCrmOpen] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: 0,
    maxPrice: 30000,
    category: initialRoute.categoryFilter || initialRoute.targetCategory || 'Все',
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

  const routeBouquets = useMemo(() => {
    return filterBouquetsForRoute(bouquets, currentRoute, filters.category);
  }, [bouquets, currentRoute, filters.category]);

  const filteredBouquets = useMemo(() => {
    return routeBouquets.filter((b) => {
      if (filters.color !== 'Все' && b.color !== filters.color) return false;
      if (b.price < filters.minPrice) return false;
      if (filters.maxPrice > 0 && b.price > filters.maxPrice) return false;
      return true;
    });
  }, [routeBouquets, filters]);

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

  // HTML5 History API Navigation Router
  const handleNavigate = (newPath: string, options?: { tab?: FigmaTab }) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', newPath);
      const targetRoute = getRouteByPath(newPath);
      setCurrentRoute(targetRoute);

      if (options?.tab) {
        setActiveTab(options.tab);
      } else if (newPath.startsWith('/cart')) {
        setActiveTab('cart');
      } else if (newPath.startsWith('/profile')) {
        setActiveTab('profile');
      } else {
        setActiveTab('catalog');
        const cat = targetRoute.categoryFilter || targetRoute.targetCategory;
        if (cat) {
          setFilters((prev) => ({ ...prev, category: cat }));
        }
      }

      // Sync SEO metadata in DOM
      document.title = targetRoute.title;
      const canonicalTag = document.querySelector('link[rel="canonical"]');
      if (canonicalTag) {
        canonicalTag.setAttribute('href', `https://xn----ctbjn3arftl7c8b.xn--p1ai${targetRoute.path}`);
      }
      const descTag = document.querySelector('meta[name="description"]');
      if (descTag) {
        descTag.setAttribute('content', targetRoute.description);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Browser back/forward button integration (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const route = getRouteByPath(path);
      setCurrentRoute(route);

      if (path.startsWith('/cart')) {
        setActiveTab('cart');
      } else if (path.startsWith('/profile')) {
        setActiveTab('profile');
      } else {
        setActiveTab('catalog');
        const cat = route.categoryFilter || route.targetCategory;
        if (cat) {
          setFilters((prev) => ({ ...prev, category: cat }));
        }
      }

      document.title = route.title;
      const canonicalTag = document.querySelector('link[rel="canonical"]');
      if (canonicalTag) {
        canonicalTag.setAttribute('href', `https://xn----ctbjn3arftl7c8b.xn--p1ai${route.path}`);
      }
      const descTag = document.querySelector('meta[name="description"]');
      if (descTag) {
        descTag.setAttribute('content', route.description);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
          onNavigate={handleNavigate}
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
              onOpenCrm={() => setIsAdminCrmOpen(true)}
              currentRoute={currentRoute}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'cart' && (
            <FigmaCartScreen
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onExploreCatalog={() => handleNavigate('/')}
              onClearCart={() => setCartItems([])}
            />
          )}

          {activeTab === 'profile' && (
            <FigmaProfileScreen
              onOpenAuth={openAuthModal}
              onOpenCrm={() => setIsAdminCrmOpen(true)}
              onGoToCatalog={() => handleNavigate('/')}
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
          onNavigate={handleNavigate}
        />

        {/* Luxury Desktop Footer */}
        <FigmaFooter
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenCrm={() => setIsAdminCrmOpen(true)}
          onNavigate={handleNavigate}
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
