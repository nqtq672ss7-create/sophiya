import React, { useState } from 'react';
import { Phone, SlidersHorizontal, ShoppingCart, Search, ChevronRight, MessageSquare, Clock, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { FigmaReviewsSection } from './FigmaReviewsSection';
import { FigmaSeoSection } from '../seo/FigmaSeoSection';
import { FigmaMapSection } from './FigmaMapSection';
import { SeoRoute, formatShownCount } from '../../utils/routes';

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
    <div className="min-h-screen bg-[#FAF7F5] pb-24 text-zinc-900 font-sans">
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

          <a
            href="tel:+79172563235"
            className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-white text-[#6C1E26] shadow-md hover:bg-white/95 active:scale-95 transition-all shrink-0"
            aria-label="Позвонить в салон"
          >
            <span className="w-7 h-7 rounded-full bg-[#6C1E26]/10 flex items-center justify-center text-[#6C1E26]">
              <Phone className="w-3.5 h-3.5 fill-[#6C1E26]" />
            </span>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Связь</span>
              <span className="text-xs font-bold text-[#6C1E26] whitespace-nowrap">Позвоните нам</span>
            </div>
          </a>
        </div>
      </div>

      {/* 2. Breadcrumbs (Visible on non-root pages) */}
      {currentRoute.path !== '/' && (
        <nav
          aria-label="Хлебные крошки"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 text-xs text-zinc-500 font-sans"
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
                className="hover:text-[#6C1E26] text-zinc-600 transition-colors"
              >
                <span itemProp="name">Главная</span>
              </a>
              <meta itemProp="position" content="1" />
              <span className="text-zinc-400">/</span>
            </li>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="text-zinc-900 font-semibold">
              <span itemProp="name">{currentRoute.breadcrumbLabel}</span>
              <meta itemProp="position" content="2" />
            </li>
          </ol>
        </nav>
      )}

      {/* 3. Primary Hero Banner: Single H1 Tag (Visible on ALL devices) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 w-full">
        <div className="relative overflow-hidden rounded-3xl bg-rose-texture-hero text-white p-5 sm:p-8 lg:p-12 shadow-xl border border-white/10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
            <div className="max-w-2xl space-y-4">
              {/* THE ONLY H1 ON THE ENTIRE PAGE - ALWAYS VISIBLE */}
              <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white">
                {currentRoute.h1}
              </h1>

              {/* Guarantees Pills */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-light text-white/90">
                <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Доставка от 30 мин</span>
                </span>
                <a
                  href="https://yandex.ru/maps/org/sofiya/105599949171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
                  title="Салон «София» на Яндекс Картах"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>пр. Шинников, 13В</span>
                </a>
                <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Фото букета в WhatsApp</span>
                </span>
              </div>
            </div>

            {/* Quick Contact & WhatsApp Card (Desktop & Mobile accessible) */}
            <div className="w-full lg:w-80 bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:p-6 shrink-0 text-center space-y-3 shadow-xl">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-medium block">
                Связь с шеф-флористом
              </span>

              <a
                href="tel:+79172563235"
                className="font-serif text-2xl text-white font-semibold block hover:text-[#C5A880] transition-colors"
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
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60">
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
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all shrink-0 whitespace-nowrap active:scale-95 ${
                    isActive
                      ? 'bg-[#6C1E26] text-white shadow-sm font-semibold'
                      : 'bg-white/90 hover:bg-white text-zinc-600 hover:text-zinc-900 border border-zinc-200/70 hover:border-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
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
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Поиск букета..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-zinc-200/80 text-xs sm:text-sm focus:outline-none focus:border-[#6C1E26] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              />
            </div>

            <button
              onClick={onOpenFilter}
              className="px-4 py-2 rounded-full bg-white border border-zinc-200/80 text-zinc-700 hover:text-[#6C1E26] hover:border-[#6C1E26] transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-medium shrink-0 cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:scale-95"
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
        <div className="flex items-baseline justify-between mb-6 pb-2 border-b border-zinc-200">
          <h2 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal">
            {currentRoute.path === '/' ? 'Каталог букетов' : `Каталог: ${currentRoute.breadcrumbLabel}`}
          </h2>
          <span className="text-xs text-zinc-500 font-light">
            {formatShownCount(displayedBouquets.length)}
          </span>
        </div>

        {displayedBouquets.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-zinc-200/80 p-8 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center text-amber-800 text-2xl mb-4">
              🌸
            </div>
            <h3 className="font-serif text-xl sm:text-2xl text-zinc-900 font-normal mb-2">
              Позиции в категории «{currentRoute.breadcrumbLabel}» собираются под заказ
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 font-light max-w-md mx-auto mb-6 leading-relaxed">
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
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium cursor-pointer"
              >
                Посмотреть весь каталог
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedBouquets.map((bouquet) => {
              const discountedPrice =
                userDiscount > 0
                  ? bouquet.price - Math.round((bouquet.price * userDiscount) / 100)
                  : bouquet.price;

              return (
                <div
                  key={bouquet.id}
                  onClick={() => onSelectBouquet(bouquet)}
                  className="bg-white rounded-3xl border border-zinc-200/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden aspect-[4/5] bg-zinc-100">
                    <img
                      src={bouquet.image}
                      alt={`${bouquet.title} в Нижнекамске — салон цветов София`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Stock badge */}
                    <div className="absolute top-3 left-3">
                      {bouquet.inStock ? (
                        <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow">
                          В наличии
                        </span>
                      ) : (
                        <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow">
                          Под заказ
                        </span>
                      )}
                    </div>

                    {/* Category pill */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#6C1E26] text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
                      {bouquet.category}
                    </div>
                  </div>

                  {/* Info Container */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-zinc-400 font-light mb-1">
                        <span>{bouquet.characteristics.flowersCount}</span>
                        <span>{bouquet.characteristics.height}</span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl text-zinc-900 font-medium leading-snug group-hover:text-[#6C1E26] transition-colors mb-2">
                        {bouquet.title}
                      </h3>

                      <p className="text-xs text-zinc-500 font-light line-clamp-2 leading-relaxed mb-4">
                        {bouquet.description}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div>
                      <div className="flex items-baseline justify-between pt-3 border-t border-zinc-100 mb-3">
                        <div>
                          {userDiscount > 0 ? (
                            <div className="flex items-baseline gap-2">
                              <span className="font-serif text-2xl font-bold text-[#6C1E26]">
                                {discountedPrice.toLocaleString('ru-RU')} ₽
                              </span>
                              <span className="text-xs text-zinc-400 line-through">
                                {bouquet.price.toLocaleString('ru-RU')} ₽
                              </span>
                            </div>
                          ) : (
                            <span className="font-serif text-2xl font-bold text-[#6C1E26]">
                              {bouquet.price.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 font-light">
                          {bouquet.characteristics.durability}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={(e) => onAddToCart(bouquet, e)}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>В корзину</span>
                        </button>

                        <a
                          href={`https://wa.me/79172563235?text=${encodeURIComponent(
                            `Здравствуйте! Хочу заказать букет «${bouquet.title}» (${bouquet.price} ₽) с доставкой в Нижнекамске.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 text-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
