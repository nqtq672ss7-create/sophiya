import React, { useState } from 'react';
import { Phone, SlidersHorizontal, ShoppingCart, Search, ChevronRight, MessageSquare, Clock, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { FigmaReviewsSection } from './FigmaReviewsSection';
import { FigmaSeoSection } from '../seo/FigmaSeoSection';
import { FigmaMapSection } from './FigmaMapSection';
import { SeoRoute, formatShownCount } from '../../utils/routes';
import { WhatsAppIcon } from '../common/WhatsAppIcon';
import { BouquetCard } from '../catalog/BouquetCard';

interface FigmaCatalogScreenProps {
  bouquets: Bouquet[];
  onSelectBouquet: (bouquet: Bouquet) => void;
  onAddToCart: (bouquet: Bouquet, e: React.MouseEvent) => void;
  onOpenFilter: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  userDiscount?: number;
  onOpenCrm?: () => void;
  currentRoute: SeoRoute;
  onNavigate: (path: string) => void;
}

export const FigmaCatalogScreen: React.FC<FigmaCatalogScreenProps> = ({
  bouquets,
  onSelectBouquet,
  onAddToCart,
  onOpenFilter,
  activeCategory,
  onSelectCategory,
  userDiscount = 0,
  onOpenCrm,
  currentRoute,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const CATEGORY_ITEMS = [
    { label: 'Все', path: '/', category: 'Все' },
    { label: 'Розы', path: '/rozy/', category: 'Монобукеты' },
    { label: 'Монобукеты', path: '/monobukety/', category: 'Монобукеты' },
    { label: 'Авторские', path: '/avtorskie-bukety/', category: 'Авторские' },
    { label: 'Коробки', path: '/cvety-v-korobke/', category: 'Коробки' },
    { label: 'Корзины', path: '/korziny-cvetov/', category: 'Корзины' },
    { label: 'Свадебные', path: '/svadebnye-bukety/', category: 'Авторские' },
    { label: 'Пионы', path: '/piony/', category: 'Монобукеты' },
    { label: 'Хризантемы', path: '/hrizantemy/', category: 'Монобукеты' },
  ];

  const displayedBouquets = bouquets.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query) ||
      b.characteristics.flowersCount.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-24 text-[#1C1215] font-sans">
      {/* 1. Mobile-only Top Brand Header */}
      <div className="md:hidden bg-rose-texture-hero text-white pt-6 pb-4 px-5 sm:px-6 shadow-md border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div
            onClick={onOpenCrm}
            className="flex items-center cursor-pointer group"
            title="Салон цветов София (Панель управления)"
          >
            <img
              src="/logo-light.png"
              alt="Салон цветов София"
              className="h-16 sm:h-20 w-auto object-contain group-active:scale-95 transition-transform"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:+79172563235"
              className="w-10 h-10 rounded-xl bg-white text-[#8B1A2B] shadow-md flex items-center justify-center hover:bg-white/95 active:scale-95 transition-colors"
              aria-label="Позвонить в салон"
              title="Позвонить: +7 (917) 256-32-35"
            >
              <Phone className="w-4 h-4 fill-[#8B1A2B]" />
            </a>

            <a
              href="https://wa.me/79172563235"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-md flex items-center justify-center hover:bg-emerald-700 active:scale-95 transition-colors"
              aria-label="Написать в WhatsApp"
              title="Написать в WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Breadcrumbs (Visible on non-root pages) */}
      {currentRoute.path !== '/' && (
        <nav
          aria-label="Хлебные крошки"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 text-xs text-[#7C636B] font-sans"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          <ol className="flex items-center gap-2 list-none p-0 m-0">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="flex items-center gap-2">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/');
                }}
                itemProp="item"
                className="hover:text-[#8B1A2B] text-[#5C454C] transition-colors"
              >
                <span itemProp="name">Главная</span>
              </a>
              <meta itemProp="position" content="1" />
              <span className="text-[#A08890]">/</span>
            </li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-[#1C1215] font-semibold">
              <span itemProp="name">{currentRoute.breadcrumbLabel}</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>
      )}

      {/* 3. Primary Hero Banner: Single H1 Tag (Visible on ALL devices) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 w-full">
        <div className="relative overflow-hidden rounded-xl bg-rose-texture-hero text-white p-5 sm:p-8 lg:p-12 shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
            <div className="max-w-2xl space-y-4">
              {/* THE ONLY H1 ON THE ENTIRE PAGE - ALWAYS VISIBLE */}
              <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
                {currentRoute.h1}
              </h1>

              {/* Guarantees Pills */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-light text-white/90">
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Доставка от 30 мин</span>
                </span>
                <a
                  href="https://yandex.ru/maps/org/sofiya/105599949171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer"
                  title="Салон «София» на Яндекс Картах"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>пр. Шинников, 13В</span>
                </a>
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Фото букета в WhatsApp</span>
                </span>
              </div>
            </div>

            {/* Quick Contact & WhatsApp Card (Desktop & Mobile accessible) */}
            <div className="w-full lg:w-80 bg-[#1C1215]/80 border border-white/15 rounded-xl p-5 sm:p-6 shrink-0 text-center space-y-3 shadow-xl">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-medium block">
                Связь с шеф-флористом
              </span>

              <a
                href="tel:+79172563235"
                className="font-sans text-2xl text-white font-semibold block hover:text-[#C5A880] transition-colors"
              >
                +7 (917) 256-32-35
              </a>

              <p className="text-xs text-white/70 font-light">
                Индивидуальная сборка или подбор сортов по фото в WhatsApp
              </p>

              <a
                href="https://wa.me/79172563235"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Написать в WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Filter & Category Bar with Real Canonical Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-[#E5DDD9]">
          {/* Category Tabs (PillNav Style) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth">
            {CATEGORY_ITEMS.map((item) => {
              const isActive =
                currentRoute.path === item.path ||
                (currentRoute.path === '/' && item.category === activeCategory);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.path);
                    onSelectCategory(item.category);
                  }}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors shrink-0 whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-[#8B1A2B] text-white shadow-sm font-semibold'
                      : 'bg-white hover:bg-[#FAF7F5] text-[#5C454C] hover:text-[#1C1215] border border-[#E5DDD9] hover:border-[#8B1A2B] shadow-sm'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Search Input & Filter Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A08890]" />
              <input
                type="text"
                placeholder="Поиск букета..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E5DDD9] text-xs sm:text-sm focus:outline-none focus:border-[#8B1A2B] transition-colors shadow-sm"
              />
            </div>

            <button
              onClick={onOpenFilter}
              className="px-4 py-2 rounded-xl bg-white border border-[#E5DDD9] text-[#5C454C] hover:text-[#8B1A2B] hover:border-[#8B1A2B] transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium shrink-0 cursor-pointer shadow-sm active:scale-95"
              title="Открыть фильтры"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Фильтры</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Bouquets Catalog Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-[#E5DDD9]">
          <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold tracking-tight">
            {currentRoute.path === '/' ? 'Каталог букетов' : `Каталог: ${currentRoute.breadcrumbLabel}`}
          </h2>
          <span className="text-xs text-[#7C636B] font-light">
            {formatShownCount(displayedBouquets.length)}
          </span>
        </div>

        {displayedBouquets.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-[#E5DDD9] p-8 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#8B1A2B]/10 flex items-center justify-center text-[#8B1A2B] mb-4">
              <Sparkles className="w-6 h-6 text-[#8B1A2B]" />
            </div>
            <h3 className="font-sans text-xl sm:text-2xl text-[#1C1215] font-semibold mb-2">
              Позиции в категории «{currentRoute.breadcrumbLabel}» собираются под заказ
            </h3>
            <p className="text-xs sm:text-sm text-[#7C636B] font-light max-w-md mx-auto mb-6 leading-relaxed">
              Наши шеф-флористы соберут букет из свежих цветов сегодняшней поставки с обязательным фотоотчетом в WhatsApp перед передачей курьеру.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/79172563235?text=${encodeURIComponent(
                  `Здравствуйте! Хочу заказать букет в категории «${currentRoute.breadcrumbLabel}» в Нижнекамске.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-2 shadow"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Связаться с шеф-флористом</span>
              </a>
              <button
                onClick={() => {
                  setSearchQuery('');
                  onSelectCategory('Все');
                  onNavigate('/');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FAF7F5] hover:bg-[#E5DDD9] text-[#1C1215] border border-[#E5DDD9] text-xs font-medium cursor-pointer"
              >
                Посмотреть весь каталог
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedBouquets.map((bouquet) => (
              <BouquetCard
                key={bouquet.id}
                bouquet={bouquet}
                userDiscount={userDiscount}
                onSelectBouquet={onSelectBouquet}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* 7. Rotating Reviews Section */}
      <FigmaReviewsSection />

      {/* 8. Local SEO & Trust Features Section */}
      <FigmaSeoSection />

      {/* 9. Interactive Salon Map Section (Yandex Maps) */}
      <FigmaMapSection />
    </div>
  );
};
