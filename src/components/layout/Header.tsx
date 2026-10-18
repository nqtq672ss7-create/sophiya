import React, { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, ShoppingBag, Compass, Clock, Menu, X } from 'lucide-react';

interface HeaderProps {
  onOpenStudio?: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenStudio,
  onOpenCart,
  cartCount = 0,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-3 bg-sofiya-black-purple/85 backdrop-blur-xl border-b border-sofiya-viola/20 shadow-2xl'
          : 'py-5 bg-gradient-to-b from-sofiya-black-purple/95 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Brand Logo with Butterfly */}
        <a href="#" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Салон цветов София Нижнекамск"
            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </a>

        {/* Center: Location & Schedule Pill (Desktop) */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full glass-panel border border-sofiya-viola/25 text-xs text-sofiya-petal">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">Салон открыт</span>
          </div>
          <span className="text-sofiya-viola/60">•</span>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-sofiya-viola" />
            <span>Нижнекамск, пр. Шинников, 13В</span>
          </div>
          <span className="text-sofiya-viola/60">•</span>
          <span className="text-zinc-400">10:00 — 21:00</span>
        </div>

        {/* Right: Quick Actions (WhatsApp, Phone, Cart) */}
        <div className="flex items-center gap-3">
          {/* Direct WhatsApp link */}
          <a
            href="https://wa.me/79870000000?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D1%83%D1%82%D0%BE%D1%87%D0%BD%D0%B8%D1%82%D1%8C%20%D0%BF%D0%BE%20%D0%BF%D0%BE%D0%B2%D0%BE%D0%B4%D1%83%20%D1%86%D0%B2%D0%B5%D1%82%D0%BE%D0%B2%20%D0%B2%20%D1%81%D0%B0%D0%BB%D0%BE%D0%BD%D0%B5%20%D0%BD%D0%B0%20%D0%A8%D0%B8%D0%BD%D0%BD%D0%B8%D0%BA%D0%BE%D0%B2%2013%D0%92"
            target="_blank"
            rel="noopener noreferrer"
            title="Написать флористу в WhatsApp"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full glass-panel hover:bg-emerald-950/40 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition-all text-xs tracking-wider"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          {/* 3D Atelier Shortcut */}
          <button
            onClick={onOpenStudio}
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full border border-sofiya-viola/40 hover:border-sofiya-viola text-xs tracking-wider text-sofiya-petal hover:bg-sofiya-viola/15 transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-sofiya-viola" />
            <span>3D Ателье</span>
          </button>

          {/* Cart Button in Red Berry with Glow */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-sofiya-red-berry text-white font-medium text-xs tracking-wider hover:bg-sofiya-red-berry/90 transition-all shadow-[0_0_20px_rgba(108,30,38,0.4)] hover:shadow-[0_0_28px_rgba(108,30,38,0.6)]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Корзина</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-sofiya-petal text-sofiya-black-purple text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full glass-panel text-sofiya-petal lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-6 bg-sofiya-black-purple/95 border-b border-sofiya-viola/20 backdrop-blur-2xl">
          <div className="flex flex-col gap-4 text-sm text-sofiya-petal">
            <div className="flex items-center gap-2 text-xs text-zinc-300 pb-3 border-b border-white/10">
              <MapPin className="w-4 h-4 text-sofiya-viola shrink-0" />
              <span>Нижнекамск, пр. Шинников, 13В</span>
            </div>
            <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="hover:text-sofiya-viola">
              Каталог букетов
            </a>
            <a href="#studio" onClick={() => setMobileMenuOpen(false)} className="hover:text-sofiya-viola flex items-center gap-2">
              <Compass className="w-4 h-4 text-sofiya-viola" />
              <span>3D Конструктор</span>
            </a>
            <a href="#delivery" onClick={() => setMobileMenuOpen(false)} className="hover:text-sofiya-viola">
              Доставка по Нижнекамску
            </a>
            <a href="#contacts" onClick={() => setMobileMenuOpen(false)} className="hover:text-sofiya-viola">
              Контакты салона
            </a>
            <a
              href="https://wa.me/79870000000"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Написать в WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
