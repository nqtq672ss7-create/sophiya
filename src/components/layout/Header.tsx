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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-3 bg-sofiya-black-purple/95 backdrop-blur-md border-b border-sofiya-viola/15 shadow-2xl'
          : 'py-5 bg-gradient-to-b from-sofiya-black-purple/90 via-sofiya-black-purple/40 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Brand Wordmark & Butterfly Symbol */}
        <a href="#" className="flex items-center gap-3 group">
          <img
            src="/logo-light.png"
            alt="Салон цветов София"
            className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </a>

        {/* Center: Editorial Salon Coordinates (No AI pills) */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-sofiya-petal/70 font-sans">
          <span className="text-white font-medium">Нижнекамск</span>
          <span className="text-sofiya-viola/40">/</span>
          <span>пр. Шинников, 13В</span>
          <span className="text-sofiya-viola/40">/</span>
          <span className="text-sofiya-viola">10:00 — 21:00</span>
        </div>

        {/* Right: Working Contacts & Clean Luxury CTA */}
        <div className="flex items-center gap-6">
          {/* Working Phone & WhatsApp */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-sans">
            <a
              href="https://wa.me/79172563235?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D1%8C%20%D0%B1%D1%83%D0%BA%D0%B5%D1%82%20%D0%B2%20%D1%81%D0%B0%D0%BB%D0%BE%D0%BD%D0%B5%20%D0%A1%D0%BE%D1%84%D0%B8%D1%8F"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sofiya-petal/80 hover:text-white transition-colors tracking-wide py-1 border-b border-transparent hover:border-sofiya-viola"
            >
              <MessageCircle className="w-3.5 h-3.5 text-sofiya-viola" />
              <span>WhatsApp</span>
            </a>

            <a
              href="tel:+79172563235"
              className="text-white hover:text-sofiya-viola transition-colors font-medium tracking-wider"
            >
              +7 (917) 256-32-35
            </a>
          </div>

          {/* Minimalist Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2 border border-sofiya-viola/30 hover:border-sofiya-viola bg-sofiya-red-berry/20 hover:bg-sofiya-red-berry/40 text-sofiya-petal text-[11px] font-sans uppercase tracking-[0.2em] transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sofiya-viola" />
            <span className="hidden md:inline">Корзина</span>
            {cartCount > 0 && (
              <span className="ml-1 text-white font-bold">
                ({cartCount})
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-sofiya-petal lg:hidden hover:text-white"
            aria-label="Открыть меню"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 px-6 py-6 bg-sofiya-black-purple border-b border-sofiya-viola/20 text-sofiya-petal">
          <div className="flex flex-col gap-4 text-xs uppercase tracking-widest font-sans">
            <div className="pb-3 border-b border-sofiya-viola/15">
              <span className="text-sofiya-viola block text-[10px] mb-1">Адрес салона:</span>
              <span className="text-white">г. Нижнекамск, пр. Шинников, 13В</span>
              <span className="text-sofiya-petal/60 block mt-1">Ежедневно: 10:00 — 21:00</span>
            </div>

            <a
              href="tel:+79172563235"
              className="text-white text-sm font-semibold tracking-wider flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-sofiya-viola" />
              <span>+7 (917) 256-32-35</span>
            </a>

            <a
              href="https://wa.me/79172563235"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sofiya-viola flex items-center gap-2"
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
