import React, { useState } from 'react';
import { ShoppingBag, User, Phone, ShieldCheck } from 'lucide-react';
import { FigmaTab } from './FigmaBottomNav';
import { useAuth } from '../../context/AuthContext';

interface FigmaDesktopHeaderProps {
  activeTab: FigmaTab;
  onTabChange: (tab: FigmaTab) => void;
  cartCount: number;
  cartTotal?: number;
  onSecretCrmTrigger?: () => void;
  onNavigate?: (path: string, options?: { tab?: FigmaTab }) => void;
}

export const FigmaDesktopHeader: React.FC<FigmaDesktopHeaderProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  cartTotal = 0,
  onSecretCrmTrigger,
  onNavigate,
}) => {
  const { customer, openAuthModal } = useAuth();
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate('/');
    } else {
      onTabChange('catalog');
    }
    const next = logoClicks + 1;
    if (next >= 3) {
      setLogoClicks(0);
      onSecretCrmTrigger?.();
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 1200);
    }
  };

  const handleLinkClick = (e: React.MouseEvent, path: string, tab?: FigmaTab) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path, tab ? { tab } : undefined);
    } else if (tab) {
      onTabChange(tab);
    }
  };

  return (
    <header className="w-full bg-[#FAF7F5]/95 backdrop-blur-md border-b border-zinc-200/60 sticky top-0 z-40 select-none font-sans transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-22 sm:h-26 flex items-center justify-between gap-4">
        {/* 1. Left: Official Brand Logo «София» (Triple-click secret trigger for owner CRM) */}
        <div
          onClick={handleLogoClick}
          className="cursor-pointer flex items-center group py-2"
          title="Салон цветов «София»"
        >
          <img
            src="/logo.png"
            alt="Салон цветов София"
            className="h-16 sm:h-20 lg:h-24 w-auto object-contain group-hover:opacity-90 transition-opacity"
          />
        </div>

        {/* 2. Center: Minimalist Navigation Links with Real URLs */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/', 'catalog')}
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
          </a>

          <a
            href="/rozy/"
            onClick={(e) => handleLinkClick(e, '/rozy/')}
            className="transition-colors relative py-1 text-zinc-600 hover:text-[#6C1E26]"
          >
            Розы
          </a>

          <a
            href="/monobukety/"
            onClick={(e) => handleLinkClick(e, '/monobukety/')}
            className="transition-colors relative py-1 text-zinc-600 hover:text-[#6C1E26]"
          >
            Монобукеты
          </a>

          <a
            href="/avtorskie-bukety/"
            onClick={(e) => handleLinkClick(e, '/avtorskie-bukety/')}
            className="transition-colors relative py-1 text-zinc-600 hover:text-[#6C1E26]"
          >
            Авторские
          </a>

          <a
            href="/dostavka/"
            onClick={(e) => handleLinkClick(e, '/dostavka/')}
            className="transition-colors relative py-1 text-zinc-600 hover:text-[#6C1E26]"
          >
            Доставка
          </a>

          <a
            href="/cart/"
            onClick={(e) => handleLinkClick(e, '/cart/', 'cart')}
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
          </a>

          <a
            href="/profile/"
            onClick={(e) => handleLinkClick(e, '/profile/', 'profile')}
            className={`transition-colors relative py-1 flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'text-[#6C1E26] font-semibold'
                : 'text-zinc-600 hover:text-[#6C1E26]'
            }`}
          >
            <span>Личный кабинет</span>
            {customer && customer.discountPercent > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                -{customer.discountPercent}%
              </span>
            )}
            {activeTab === 'profile' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C1E26] rounded-full animate-fadeIn" />
            )}
          </a>
        </nav>

        {/* 3. Right: Clean Contacts & Actions */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Direct Phone / Call Us & WhatsApp */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="tel:+79172563235"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#6C1E26]/10 hover:bg-[#6C1E26]/15 text-[#6C1E26] transition-all text-xs sm:text-sm font-semibold active:scale-95 shadow-sm"
              title="Позвонить в салон цветов"
            >
              <Phone className="w-3.5 h-3.5 fill-[#6C1E26]" />
              <span>Позвоните нам</span>
            </a>

            <a
              href="https://wa.me/79172563235"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 transition-all text-xs sm:text-sm font-semibold active:scale-95"
              title="Написать в WhatsApp"
            >
              WhatsApp
            </a>
          </div>

          {/* Quick Cart Pill Button */}
          <a
            href="/cart/"
            onClick={(e) => handleLinkClick(e, '/cart/', 'cart')}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-all shadow-md active:scale-95 cursor-pointer"
            title="Открыть корзину"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 text-zinc-900 text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {cartTotal > 0 ? `${cartTotal.toLocaleString('ru-RU')} ₽` : 'Корзина'}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
};
