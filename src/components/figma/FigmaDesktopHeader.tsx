import React from 'react';
import { ShoppingBag, User, Phone } from 'lucide-react';
import { FigmaTab } from './FigmaBottomNav';
import { useAuth } from '../../context/AuthContext';

interface FigmaDesktopHeaderProps {
  activeTab: FigmaTab;
  onTabChange: (tab: FigmaTab) => void;
  cartCount: number;
  cartTotal?: number;
}

export const FigmaDesktopHeader: React.FC<FigmaDesktopHeaderProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  cartTotal = 0,
}) => {
  const { customer, openAuthModal } = useAuth();

  return (
    <header className="w-full bg-[#FAF7F5]/95 backdrop-blur-md border-b border-zinc-200/60 sticky top-0 z-40 select-none font-sans transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-24 flex items-center justify-between gap-4">
        {/* 1. Left: Official Brand Logo «София» */}
        <div
          onClick={() => onTabChange('catalog')}
          className="cursor-pointer flex items-center gap-3 group py-2"
        >
          <img
            src="/logo.png"
            alt="Салон цветов София"
            className="h-11 sm:h-14 w-auto object-contain group-hover:opacity-90 transition-opacity"
          />
        </div>

        {/* 2. Center: Minimalist Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => onTabChange('catalog')}
            className={`transition-colors relative py-1 ${
              activeTab === 'catalog'
                ? 'text-[#6C1E26] font-semibold'
                : 'text-zinc-600 hover:text-[#6C1E26]'
            }`}
          >
            Каталог
            {activeTab === 'catalog' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C1E26] rounded-full animate-fadeIn" />
            )}
          </button>

          <button
            onClick={() => onTabChange('cart')}
            className={`transition-colors relative py-1 flex items-center gap-1.5 ${
              activeTab === 'cart'
                ? 'text-[#6C1E26] font-semibold'
                : 'text-zinc-600 hover:text-[#6C1E26]'
            }`}
          >
            <span>Корзина</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#6C1E26] text-white text-[11px] font-semibold flex items-center justify-center">
                {cartCount}
              </span>
            )}
            {activeTab === 'cart' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C1E26] rounded-full animate-fadeIn" />
            )}
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`transition-colors relative py-1 flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'text-[#6C1E26] font-semibold'
                : 'text-zinc-600 hover:text-[#6C1E26]'
            }`}
          >
            <span>Личный кабинет</span>
            {customer && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                -{customer.discountPercent}%
              </span>
            )}
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C1E26] rounded-full animate-fadeIn" />
            )}
          </button>
        </nav>

        {/* 3. Right: Clean Contacts & Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Direct Phone / WhatsApp */}
          <a
            href="https://wa.me/79172563235"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-zinc-700 hover:text-[#6C1E26] transition-colors"
            title="Написать в WhatsApp"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">+7 (917) 256-32-35</span>
          </a>

          {/* User Auth / Profile */}
          {customer ? (
            <button
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-2 text-xs sm:text-sm text-zinc-800 hover:text-[#6C1E26] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#6C1E26]/10 text-[#6C1E26] font-serif flex items-center justify-center text-sm font-semibold">
                {customer.firstName[0]}
              </div>
              <span className="hidden lg:inline font-medium">{customer.firstName}</span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-700 hover:text-[#6C1E26] transition-colors"
            >
              <User className="w-4 h-4 text-zinc-500" />
              <span>Войти</span>
            </button>
          )}

          {/* Cart Icon Button */}
          <button
            onClick={() => onTabChange('cart')}
            className="relative p-2.5 rounded-full bg-[#6C1E26] text-white hover:bg-[#5A121A] transition-all shadow-sm active:scale-95 flex items-center gap-2"
            aria-label="Открыть корзину"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="text-xs font-semibold pr-1">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
