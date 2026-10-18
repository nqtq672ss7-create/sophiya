import React, { useState, useEffect } from 'react';
import { Sparkles, Phone, Compass, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  onOpenStudio: () => void;
  onOpenOrder: () => void;
  cartItemCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStudio, onOpenOrder, cartItemCount = 0 }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'py-3.5 glass-panel shadow-2xl border-b border-gold/20'
          : 'py-6 bg-gradient-to-b from-atelier-950/90 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Atelier Brand Identity */}
        <a href="#" className="flex flex-col group">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl md:text-3xl tracking-[0.25em] gold-gradient-text font-normal">
              SOPHIYA
            </span>
            <span className="text-gold text-xs opacity-70 group-hover:rotate-45 transition-transform duration-500">
              ⚜
            </span>
          </div>
          <span className="text-[9px] tracking-[0.35em] text-zinc-400 font-sans uppercase -mt-0.5">
            Haute Floristry & Botanical 3D Atelier
          </span>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs tracking-[0.2em] uppercase text-zinc-300">
          <a
            href="#studio"
            className="hover:text-gold transition-colors duration-300 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-gold" />
            <span>3D Ателье</span>
          </a>
          <a href="#catalog" className="hover:text-gold transition-colors duration-300">
            Коллекции
          </a>
          <a href="#philosophy" className="hover:text-gold transition-colors duration-300">
            Философия
          </a>
          <a href="#concierge" className="hover:text-gold transition-colors duration-300">
            Консьерж
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onOpenStudio}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 hover:border-gold text-xs tracking-wider uppercase text-gold hover:bg-gold/10 transition-all duration-300"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Конструктор</span>
          </button>

          <button
            onClick={onOpenOrder}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-gold via-gold-metallic to-gold-dim text-atelier-950 font-medium text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_28px_rgba(212,175,55,0.5)] transition-all duration-300 transform hover:scale-[1.02]"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="font-semibold">Заказать букет</span>
            {cartItemCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-atelier-950 text-gold rounded-full text-[10px]">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
