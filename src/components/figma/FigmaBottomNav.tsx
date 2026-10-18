import React from 'react';
import { Home, ShoppingCart, User } from 'lucide-react';

export type FigmaTab = 'catalog' | 'cart' | 'profile';

interface FigmaBottomNavProps {
  activeTab: FigmaTab;
  onTabChange: (tab: FigmaTab) => void;
  cartCount: number;
}

export const FigmaBottomNav: React.FC<FigmaBottomNavProps> = ({
  activeTab,
  onTabChange,
  cartCount,
}) => {
  return (
    <div className="sticky bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 -mt-16">
      <nav className="pointer-events-auto bg-[#1C1C1E] rounded-3xl p-1.5 shadow-2xl border border-white/10 flex items-center gap-2">
        {/* Catalog Tab */}
        <button
          onClick={() => onTabChange('catalog')}
          className={`w-14 h-12 rounded-2xl flex items-center justify-center transition-all ${
            activeTab === 'catalog'
              ? 'bg-[#6C1E26] text-white shadow-md'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Каталог"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Cart Tab with Badge */}
        <button
          onClick={() => onTabChange('cart')}
          className={`relative w-14 h-12 rounded-2xl flex items-center justify-center transition-all ${
            activeTab === 'cart'
              ? 'bg-[#6C1E26] text-white shadow-md'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Корзина"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onTabChange('profile')}
          className={`w-14 h-12 rounded-2xl flex items-center justify-center transition-all ${
            activeTab === 'profile'
              ? 'bg-[#6C1E26] text-white shadow-md'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Профиль"
        >
          <User className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
};
