import React from 'react';
import { Home, ShoppingCart } from 'lucide-react';

export type FigmaTab = 'catalog'|'cart'|'profile';

interface FigmaBottomNavProps {
  activeTab: FigmaTab;
  onTabChange: (tab: FigmaTab) => void;
  cartCount: number;
  className?: string;
  onNavigate?: (path: string, options?: { tab?: FigmaTab }) => void;
}

export const FigmaBottomNav: React.FC<FigmaBottomNavProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  className = '',
  onNavigate,
}) => {
  const handleClick = (e: React.MouseEvent, path: string, tab: FigmaTab) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path, { tab });
    } else {
      onTabChange(tab);
    }
  };

  return (
    <div className={`sticky bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 -mt-16 ${className}`}>
      <nav className="pointer-events-auto bg-[#1C1215] rounded-xl p-1.5 shadow-2xl border border-white/10 flex items-center gap-2">
        <a
          href="/"
          onClick={(e) => handleClick(e, '/', 'catalog')}
          className={`px-5 h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
            activeTab === 'catalog'
              ? 'bg-[#6C1E26] text-white shadow-md'
              : 'text-[#C8B9BE] hover:text-white'
          }`}
          aria-label="Каталог"
        >
          <Home className="w-4 h-4" />
          <span>Каталог</span>
        </a>

        <a
          href="/cart/"
          onClick={(e) => handleClick(e, '/cart/', 'cart')}
          className={`relative px-5 h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${
            activeTab === 'cart'
              ? 'bg-[#6C1E26] text-white shadow-md'
              : 'text-[#C8B9BE] hover:text-white'
          }`}
          aria-label="Корзина"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Корзина</span>
          {cartCount > 0 && (
            <span className="min-w-[18px] h-4.5 px-1 rounded-md bg-[#E8D5B7] text-[#1C1215] text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </a>
      </nav>
    </div>
  );
};
