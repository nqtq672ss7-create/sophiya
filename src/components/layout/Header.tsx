import React, { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, ShoppingBag, Menu, X } from 'lucide-react';

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
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'py-3.5 bg-sofiya-black-purple/95 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'py-5 bg-gradient-to-b from-sofiya-black-purple/90 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Logo: Clean, high-contrast, perfectly legible */}
        <a href="#" className="flex items-center gap-3">
          <img
            src="/logo-light.png"
            alt="Салон цветов София Нижнекамск"
            className="h-11 sm:h-13 w-auto object-contain"
          />
        </a>

        {/* Center: Clean location text without boxy clutter */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-sofiya-viola shrink-0" />
          <span className="text-white font-medium">Нижнекамск, пр. Шинников, 13В</span>
          <span className="text-zinc-600 mx-1">|</span>
          <span className="text-zinc-400">10:00 — 21:00</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* WhatsApp Direct */}
          <a
            href="https://wa.me/79870000000"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>

          {/* Phone */}
          <a
            href="tel:+78555000000"
            className="hidden md:inline text-xs text-zinc-300 hover:text-white transition-colors font-mono"
          >
            +7 (8555) 00-00-00
          </a>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-sofiya-red-berry hover:bg-sofiya-red-berry/90 text-white text-xs font-medium tracking-wider uppercase transition-all shadow-md"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Корзина</span>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-sofiya-black-purple text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-white lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-6 bg-sofiya-black-purple border-b border-white/10">
          <div className="flex flex-col gap-4 text-sm text-sofiya-petal">
            <div className="text-xs text-zinc-300 pb-3 border-b border-white/10">
              📍 Нижнекамск, пр. Шинников, 13В (10:00 — 21:00)
            </div>
            <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-sofiya-viola">
              Каталог цветов
            </a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-sofiya-viola">
              О салоне
            </a>
            <a href="#delivery" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-sofiya-viola">
              Доставка по городу
            </a>
            <a
              href="https://wa.me/79870000000"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 py-3 rounded-xl bg-emerald-600/20 text-emerald-300 flex items-center justify-center gap-2 text-xs font-medium uppercase"
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
