import React, { useState, useEffect } from 'react';
import { MapPin, Phone, MessageCircle, ShoppingBag, Menu, X, User, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenStudio?: () => void;
  onOpenCart?: () => void;
  onOpenAdminClients?: () => void;
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenStudio,
  onOpenCart,
  onOpenAdminClients,
  cartCount = 0,
}) => {
  const { customer, openAuthModal, openProfileModal } = useAuth();
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

        {/* Center: Editorial Salon Coordinates */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-sofiya-petal/70 font-sans">
          <span className="text-white font-medium">Нижнекамск</span>
          <span className="text-sofiya-viola/40">/</span>
          <span>пр. Шинников, 13В</span>
          <span className="text-sofiya-viola/40">/</span>
          <span className="text-sofiya-viola">10:00 — 21:00</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Working Phone & WhatsApp */}
          <div className="hidden xl:flex items-center gap-4 text-xs font-sans">
            <a
              href="https://wa.me/79172563235?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7%D0%B0%D1%82%D1%8C%20%D0%B1%D1%83%D0%BA%D0%B5%D1%82"
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

          {/* Salon Owner CRM Link */}
          {onOpenAdminClients && (
            <button
              onClick={onOpenAdminClients}
              className="hidden md:flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-sofiya-viola/80 hover:text-white px-2.5 py-1.5 border border-sofiya-viola/20 hover:border-sofiya-viola transition-colors"
              title="Открыть базу клиентов и скидок"
            >
              <Users className="w-3 h-3 text-sofiya-viola" />
              <span>CRM Владелицы</span>
            </button>
          )}

          {/* Customer Club Auth / Profile Trigger */}
          {customer ? (
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 px-3 py-1.5 border border-sofiya-viola/40 bg-sofiya-red-berry/20 hover:bg-sofiya-red-berry/40 text-white text-[11px] font-sans tracking-wider uppercase transition-colors"
            >
              <User className="w-3.5 h-3.5 text-sofiya-viola" />
              <span className="max-w-[100px] truncate">{customer.firstName}</span>
              <span className="px-1.5 py-0.2 bg-sofiya-red-berry text-[10px] font-serif text-white border border-sofiya-viola/30">
                {customer.discountPercent}%
              </span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-sofiya-viola/30 hover:border-sofiya-viola text-sofiya-petal hover:text-white text-[11px] font-sans tracking-[0.15em] uppercase transition-colors"
            >
              <User className="w-3.5 h-3.5 text-sofiya-viola" />
              <span>Скидка / Вход</span>
            </button>
          )}

          {/* Minimalist Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2 border border-sofiya-viola/30 hover:border-sofiya-viola bg-sofiya-red-berry/30 hover:bg-sofiya-red-berry/50 text-sofiya-petal text-[11px] font-sans uppercase tracking-[0.2em] transition-all"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-sofiya-viola" />
            <span className="hidden sm:inline">Корзина</span>
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

            {/* Profile or Login */}
            {customer ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openProfileModal();
                }}
                className="text-left text-white py-2 flex items-center justify-between border-b border-sofiya-viola/15"
              >
                <span>Кабинет: {customer.firstName} {customer.lastName}</span>
                <span className="text-sofiya-viola">Скидка {customer.discountPercent}%</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="text-left text-sofiya-viola py-2 flex items-center gap-2 border-b border-sofiya-viola/15"
              >
                <User className="w-4 h-4" />
                <span>Войти / Получить персональную скидку</span>
              </button>
            )}

            {onOpenAdminClients && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminClients();
                }}
                className="text-left text-zinc-300 py-1 flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-sofiya-viola" />
                <span>CRM Владелицы (база клиентов)</span>
              </button>
            )}

            <a
              href="tel:+79172563235"
              className="text-white text-sm font-semibold tracking-wider flex items-center gap-2 pt-2"
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
