import React, { useState, useMemo } from 'react';
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
import { Smartphone, Monitor } from 'lucide-react';

export const FigmaAppShell: React.FC = () => {
  const { customer, openAuthModal } = useAuth();

  const [showSplash, setShowSplash] = useState(false);
  const [activeTab, setActiveTab] = useState<FigmaTab>('catalog');
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { bouquet: BOUQUETS_CATALOG[0], quantity: 1 },
  ]);
  const [selectedBouquet, setSelectedBouquet] = useState<Bouquet | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdminCrmOpen, setIsAdminCrmOpen] = useState(false);
  
  // Default is FALSE so desktop users see the full-width luxury responsive adaptation!
  const [isMobileFrameView, setIsMobileFrameView] = useState(false);

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
    return BOUQUETS_CATALOG.filter((b) => {
      if (filters.category !== 'Все' && b.category !== filters.category) return false;
      if (filters.color !== 'Все' && b.color !== filters.color) return false;
      if (b.price < filters.minPrice) return false;
      if (filters.maxPrice > 0 && b.price > filters.maxPrice) return false;
      return true;
    });
  }, [filters]);

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

  return (
    <div className={`min-h-screen ${isMobileFrameView ? 'bg-[#1C1315]' : 'bg-[#FAF7F5]'} flex flex-col text-zinc-900 selection:bg-[#6C1E26] selection:text-white transition-colors duration-300`}>
      {/* 1. Header: Universal Desktop & Tablet Luxury Header */}
      <FigmaDesktopHeader
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCrm={() => setIsAdminCrmOpen(true)}
        onOpenSplash={() => setShowSplash(true)}
        isMobileFrameView={isMobileFrameView}
        onToggleFrameView={() => setIsMobileFrameView(!isMobileFrameView)}
      />

      {/* 2. Main Content Area */}
      {isMobileFrameView ? (
        /* Mobile iPhone Frame Preview Mode */
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[430px] rounded-[44px] overflow-hidden border-[8px] border-[#2C2123] shadow-2xl bg-[#FAF7F5] relative min-h-[844px] flex flex-col justify-between">
            {/* Screen Content */}
            <div className="flex-1">
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
                />
              )}
            </div>

            {/* Mobile Bottom Navigation */}
            <FigmaBottomNav
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              cartCount={cartCount}
            />
          </div>
        </div>
      ) : (
        /* Full-Width Responsive Desktop & Tablet Mode */
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
      )}

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
        onClose={() => setIsAdminCrmOpen(false)}
      />
    </div>
  );
};
