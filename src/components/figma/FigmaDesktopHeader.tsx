import React from 'react';
import { Phone, ShoppingCart, User, ShieldCheck, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { FigmaTab } from './FigmaBottomNav';
import { useAuth } from '../../context/AuthContext';

interface FigmaDesktopHeaderProps {
  activeTab: FigmaTab;
  onTabChange: (tab: FigmaTab) => void;
  cartCount: number;
  cartTotal: number;
  onOpenCrm: () => void;
  onOpenSplash: () => void;
  isMobileFrameView: boolean;
  onToggleFrameView: () => void;
}

export const FigmaDesktopHeader: React.FC<FigmaDesktopHeaderProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  cartTotal,
  onOpenCrm,
  onOpenSplash,
  isMobileFrameView,
  onToggleFrameView,
}) => {
  const { customer, openAuthModal } = useAuth();

  return (
    <header className="w-full bg-[#FAF7F5] border-b border-[#6C1E26]/15 select-none font-sans sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      {/* 1. Top Announcement & Contacts Strip */}
      <div className="bg-[#5A121A] text-white/90 text-[11px] sm:text-xs py-2 px-4 sm:px-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-white/80">
            <span className="flex items-center gap-1.5 font-light">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Нижнекамск, пр. Шинников, 13В
            </span>
            <span className="text-white/30 hidden md:inline">•</span>
            <span className="hidden md:inline text-white/70">
              Ежедневно 08:00 – 21:00
            </span>
            <span className="text-white/30 hidden lg:inline">•</span>
            <span className="hidden lg:inline text-amber-200/90 font-light">
              🚀 Экспресс-доставка от 30 мин • Фото в WhatsApp
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="https://wa.me/79172563235"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>WhatsApp: <strong className="font-semibold">+7 (917) 256-32-35</strong></span>
            </a>

            <button
              onClick={onOpenSplash}
              className="hidden sm:flex items-center gap-1 text-[#C5A880] hover:text-white transition-colors text-[11px]"
              title="Показать стартовую анимацию"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Заставка</span>
            </button>

            <button
              onClick={onToggleFrameView}
              className="hidden lg:flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 transition-all"
              title="Переключить вид: полноэкранный ПК или симулятор iPhone"
            >
              {isMobileFrameView ? (
                <>
                  <Monitor className="w-3 h-3 text-amber-300" />
                  <span>Перейти в ПК-версию</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3 h-3 text-amber-300" />
                  <span>Режим iPhone</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onTabChange('catalog')}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#6C1E26] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <span className="font-serif text-xl sm:text-2xl text-[#C5A880] font-light">S</span>
          </div>

          <div>
            <span className="font-serif text-2xl sm:text-3xl text-[#6C1E26] font-normal tracking-wide block leading-none">
              SweetSofi
            </span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 font-light block mt-1">
              салон авторской флористики
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onTabChange('catalog')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'catalog'
                ? 'bg-[#6C1E26] text-white shadow-sm'
                : 'text-zinc-700 hover:text-[#6C1E26] hover:bg-zinc-100/70'
            }`}
          >
            Каталог букетов
          </button>

          <button
            onClick={() => onTabChange('cart')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'cart'
                ? 'bg-[#6C1E26] text-white shadow-sm'
                : 'text-zinc-700 hover:text-[#6C1E26] hover:bg-zinc-100/70'
            }`}
          >
            <span>Корзина</span>
            {cartCount > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                activeTab === 'cart'
                  ? 'bg-white text-[#6C1E26]'
                  : 'bg-[#6C1E26] text-white'
              }`}>
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-[#6C1E26] text-white shadow-sm'
                : 'text-zinc-700 hover:text-[#6C1E26] hover:bg-zinc-100/70'
            }`}
          >
            <span>Личный кабинет</span>
            {customer && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                -{customer.discountPercent}%
              </span>
            )}
          </button>
        </nav>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Official Phone Direct Call */}
          <a
            href="tel:+79172563235"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-300 hover:border-[#6C1E26] text-zinc-800 text-xs font-medium hover:text-[#6C1E26] transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-[#6C1E26]" />
            <span>+7 (917) 256-32-35</span>
          </a>

          {/* CRM Admin Button */}
          <button
            onClick={onOpenCrm}
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
            title="Открыть CRM клиентов салона"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#6C1E26]" />
            <span>CRM Салона</span>
          </button>

          {/* Customer Profile / Login */}
          {customer ? (
            <button
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 shadow-sm text-xs font-medium text-zinc-800 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-[#6C1E26] text-white flex items-center justify-center text-[11px] font-serif">
                {customer.firstName[0]}
              </div>
              <span className="hidden sm:inline">{customer.firstName}</span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#6C1E26]/30 text-[#6C1E26] hover:bg-[#6C1E26]/5 text-xs font-medium transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Войти</span>
            </button>
          )}

          {/* Cart Quick Button */}
          <button
            onClick={() => onTabChange('cart')}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white shadow-md text-xs sm:text-sm font-medium transition-all active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Корзина</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-[#6C1E26] text-xs font-bold leading-none">
                {cartCount}
              </span>
            )}
            {cartTotal > 0 && (
              <span className="hidden lg:inline font-serif text-sm border-l border-white/20 pl-2">
                {cartTotal.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
