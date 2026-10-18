import React, { useState, useMemo } from 'react';
import { FigmaSplashScreen } from './FigmaSplashScreen';
import { FigmaCatalogScreen } from './FigmaCatalogScreen';
import { FigmaBottomNav, FigmaTab } from './FigmaBottomNav';
import { FigmaProductDetailModal } from './FigmaProductDetailModal';
import { FigmaFilterModal } from './FigmaFilterModal';
import { FigmaCartScreen } from './FigmaCartScreen';
import { FigmaProfileScreen } from './FigmaProfileScreen';
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
  const [isMobileFrameView, setIsMobileFrameView] = useState(true);

  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: 0,
    maxPrice: 30000,
    category: 'Все',
    color: 'Все',
  });

  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

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
    <div className="min-h-screen bg-[#1C1315] flex flex-col items-center justify-start text-zinc-900 selection:bg-[#6C1E26] selection:text-white">
      {/* Top Desktop Helper Bar */}
      <div className="w-full bg-[#140D0F] border-b border-white/10 px-6 py-2.5 flex items-center justify-between text-xs text-white/70 select-none">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm text-[#C5A880]">SweetSofi</span>
          <span className="text-white/30 hidden sm:inline">•</span>
          <span className="text-[11px] text-white/60 hidden sm:inline">
            Figma-макет: салон цветов на Шинников, 13В
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSplash(true)}
            className="text-[11px] text-[#C5A880] hover:text-white transition-colors"
          >
            Показать Splash Screen
          </button>

          <button
            onClick={() => setIsAdminCrmOpen(true)}
            className="text-[11px] px-2.5 py-1 bg-[#6C1E26] text-white rounded font-medium hover:bg-[#8A202D] transition-colors"
          >
            CRM Владелицы
          </button>

          <button
            onClick={() => setIsMobileFrameView(!isMobileFrameView)}
            className="hidden md:flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white p-1"
            title="Переключить ширину экрана"
          >
            {isMobileFrameView ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Режим iPhone</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Широкий экран</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main App Container */}
      <div
        className={`w-full relative shadow-2xl transition-all duration-300 ${
          isMobileFrameView
            ? 'max-w-[430px] my-0 sm:my-6 rounded-none sm:rounded-[44px] overflow-hidden border-0 sm:border-[8px] sm:border-[#2C2123]'
            : 'max-w-2xl my-0 sm:my-6'
        }`}
      >
        {/* Screen 1: Splash Screen */}
        {showSplash && <FigmaSplashScreen onEnter={() => setShowSplash(false)} />}

        {/* Screen 2: Catalog Screen */}
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

        {/* Screen 3: Cart & Checkout Screen */}
        {activeTab === 'cart' && (
          <FigmaCartScreen
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onExploreCatalog={() => setActiveTab('catalog')}
            onClearCart={() => setCartItems([])}
          />
        )}

        {/* Screen 4: Profile Screen */}
        {activeTab === 'profile' && (
          <FigmaProfileScreen
            onOpenAuth={openAuthModal}
            onOpenCrm={() => setIsAdminCrmOpen(true)}
          />
        )}

        {/* Floating Bottom Nav (Exact Figma) */}
        <FigmaBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          cartCount={cartCount}
        />

        {/* Product Detail Modal (Exact Figma frame 7) */}
        <FigmaProductDetailModal
          bouquet={selectedBouquet}
          onClose={() => setSelectedBouquet(null)}
          onAddToCart={(b) => handleAddToCart(b)}
          userDiscount={customer?.discountPercent || 0}
        />

        {/* Filter Modal (Exact Figma frame 6) */}
        <FigmaFilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          options={filters}
          onApply={(newOpts) => setFilters(newOpts)}
        />
      </div>

      {/* Global Modals: Auth & CRM */}
      <AuthModal />
      <SalonAdminClientsModal
        isOpen={isAdminCrmOpen}
        onClose={() => setIsAdminCrmOpen(false)}
      />
    </div>
  );
};
