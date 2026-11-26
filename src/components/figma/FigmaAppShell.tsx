import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { FigmaCatalogScreen } from './FigmaCatalogScreen';
import { FigmaBottomNav, FigmaTab } from './FigmaBottomNav';
import { FigmaDesktopHeader } from './FigmaDesktopHeader';
import { FigmaFooter } from './FigmaFooter';
import type { LegalDocTab } from '../legal/LegalModal';
import { CookieConsentBanner } from '../legal/CookieConsentBanner';
import { CartToast } from '../common/CartToast';
import { Bouquet, CartItem, FilterOptions } from '../../types/figma-app';
import { useAuth } from '../../context/AuthContext';
import { useCatalog } from '../../context/CatalogContext';
import { getRouteByPath, SEO_ROUTES, SeoRoute, filterBouquetsForRoute } from '../../utils/routes';

const FigmaSplashScreen = lazy(() =>
  import('./FigmaSplashScreen').then((m) => ({ default: m.FigmaSplashScreen }))
);
const FigmaProductDetailModal = lazy(() =>
  import('./FigmaProductDetailModal').then((m) => ({ default: m.FigmaProductDetailModal }))
);
const FigmaFilterModal = lazy(() =>
  import('./FigmaFilterModal').then((m) => ({ default: m.FigmaFilterModal }))
);
const FigmaCartScreen = lazy(() =>
  import('./FigmaCartScreen').then((m) => ({ default: m.FigmaCartScreen }))
);
const FigmaProfileScreen = lazy(() =>
  import('./FigmaProfileScreen').then((m) => ({ default: m.FigmaProfileScreen }))
);
const AuthModal = lazy(() =>
  import('../auth/AuthModal').then((m) => ({ default: m.AuthModal }))
);
const SalonAdminClientsModal = lazy(() =>
  import('../admin/SalonAdminClientsModal').then((m) => ({ default: m.SalonAdminClientsModal }))
);
const LegalModal = lazy(() =>
  import('../legal/LegalModal').then((m) => ({ default: m.LegalModal }))
);

export const FigmaAppShell: React.FC = () => {
  const { customer, openAuthModal, isAuthModalOpen } = useAuth();
  const { bouquets } = useCatalog();

  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const initialRoute = getRouteByPath(initialPath);

  const [currentRoute, setCurrentRoute] = useState<SeoRoute>(initialRoute);
  const [showSplash, setShowSplash] = useState(false);
  const [activeTab, setActiveTab] = useState<FigmaTab>(() => {
    if (initialPath.startsWith('/cart')) return 'cart';
    return 'catalog';
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved =
          localStorage.getItem('sophiya_cart_items_v2') ||
          localStorage.getItem('sophiya_cart_items_v1') ||
          localStorage.getItem('sophiya_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load cart from storage:', e);
    }
    return [];
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sophiya_cart_items_v2', JSON.stringify(cartItems));
        if (customer?.phone) {
          localStorage.setItem(`sophiya_cart_${customer.phone}`, JSON.stringify(cartItems));
        }
      }
    } catch (e) {
      console.error('Failed to save cart to storage:', e);
    }
  }, [cartItems, customer?.phone]);

  // If customer logs in and had items previously under this phone, restore them if current cart is empty
  useEffect(() => {
    if (customer?.phone && cartItems.length === 0) {
      try {
        const userSaved = localStorage.getItem(`sophiya_cart_${customer.phone}`);
        if (userSaved) {
          const parsed = JSON.parse(userSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCartItems(parsed);
          }
        }
      } catch {}
    }
  }, [customer?.phone]);
  const [selectedBouquet, setSelectedBouquet] = useState<Bouquet|null>(null);
  const [toastBouquet, setToastBouquet] = useState<Bouquet|null>(null);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdminCrmOpen, setIsAdminCrmOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalDocTab|null>(null);

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
    return cartItems.reduce(
      (sum, item) => sum + (item.bouquet.inStock !== false ? item.bouquet.price * item.quantity : 0),
      0
    );
  }, [cartItems]);

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

    setToastBouquet(bouquet);
    setIsToastOpen(true);
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

      if (options?.tab && options.tab !== 'profile') {
        setActiveTab(options.tab);
      } else if (newPath.startsWith('/cart')) {
        setActiveTab('cart');
      } else {
        setActiveTab('catalog');
        const cat = targetRoute.categoryFilter || targetRoute.targetCategory;
        if (cat) {
          setFilters((prev) => ({ ...prev, category: cat }));
        }
      }

      // Sync SEO metadata in DOM
      if (newPath.startsWith('/cart')) {
        document.title = 'Корзина: Салон цветов «София» Нижнекамск';
      } else {
        document.title = targetRoute.title;
      }
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
      } else {
        setActiveTab('catalog');
        const cat = route.categoryFilter || route.targetCategory;
        if (cat) {
          setFilters((prev) => ({ ...prev, category: cat }));
        }
      }

      if (path.startsWith('/cart')) {
        document.title = 'Корзина: Салон цветов «София» Нижнекамск';
      } else {
        document.title = route.title;
      }
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

  // SPA route rehydration from 404 fallback or direct session recovery
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const redirectPath = sessionStorage.getItem('spa_redirect');
      if (redirectPath) {
        sessionStorage.removeItem('spa_redirect');
        handleNavigate(redirectPath);
      }
    }
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
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col text-[#1C1215] selection:bg-[#6C1E26] selection:text-white">
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
          currentPath={currentRoute.path}
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
              onOpenCrm={() => handleNavigate('/')}
              currentRoute={currentRoute}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'cart' && (
            <Suspense
              fallback={
                <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#7C636B]">
                  Загрузка корзины...
                </div>
              }
            >
              <FigmaCartScreen
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onExploreCatalog={() => handleNavigate('/')}
                onClearCart={() => setCartItems([])}
              />
            </Suspense>
          )}

          {activeTab === 'profile' && (
            <Suspense
              fallback={
                <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#7C636B]">
                  Загрузка личного кабинета...
                </div>
              }
            >
              <FigmaProfileScreen
                onOpenAuth={openAuthModal}
                onOpenCrm={() => {}}
                onGoToCatalog={() => handleNavigate('/')}
              />
            </Suspense>
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
          onNavigate={handleNavigate}
          onOpenLegal={(tab) => setLegalTab(tab)}
        />
      </main>

      {/* 3. Modals & Overlays */}
      {/* Floating Cart Toast Notification */}
      <CartToast
        bouquet={toastBouquet}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
        onNavigateToCart={() => handleNavigate('/cart/')}
      />

      {/* Product Detail Modal */}
      {selectedBouquet && (
        <Suspense fallback={null}>
          <FigmaProductDetailModal
            bouquet={selectedBouquet}
            onClose={() => setSelectedBouquet(null)}
            onAddToCart={(b) => handleAddToCart(b)}
            userDiscount={customer?.discountPercent || 0}
          />
        </Suspense>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <Suspense fallback={null}>
          <FigmaFilterModal
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            options={filters}
            onApply={(newOpts) => setFilters(newOpts)}
          />
        </Suspense>
      )}

      {/* Splash Screen */}
      {showSplash && (
        <Suspense fallback={null}>
          <FigmaSplashScreen onEnter={() => setShowSplash(false)} />
        </Suspense>
      )}

      {/* Global Modals: Auth & CRM */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal onOpenLegal={(tab) => setLegalTab(tab)} />
        </Suspense>
      )}
      {isAdminCrmOpen && (
        <Suspense fallback={null}>
          <SalonAdminClientsModal
            isOpen={isAdminCrmOpen}
            onClose={handleCloseAdminCrm}
          />
        </Suspense>
      )}

      {/* Legal & Cookie Modals */}
      {legalTab && (
        <Suspense fallback={null}>
          <LegalModal
            isOpen={Boolean(legalTab)}
            activeTab={legalTab || 'privacy'}
            onClose={() => setLegalTab(null)}
            onTabChange={(tab) => setLegalTab(tab)}
          />
        </Suspense>
      )}
      <CookieConsentBanner onOpenCookiePolicy={() => setLegalTab('cookie')} />
    </div>
  );
};
