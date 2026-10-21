import React, { useState } from 'react';
import { Phone, SlidersHorizontal, ShoppingCart, Search, ChevronRight, MessageSquare, Clock, MapPin, Sparkles } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { FigmaReviewsSection } from './FigmaReviewsSection';
import { FigmaSeoSection } from '../seo/FigmaSeoSection';

interface FigmaCatalogScreenProps {
  bouquets: Bouquet[];
  onSelectBouquet: (bouquet: Bouquet) => void;
  onAddToCart: (bouquet: Bouquet, e: React.MouseEvent) => void;
  onOpenFilter: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  userDiscount?: number;
}

export const FigmaCatalogScreen: React.FC<FigmaCatalogScreenProps> = ({
  bouquets,
  onSelectBouquet,
  onAddToCart,
  onOpenFilter,
  activeCategory,
  onSelectCategory,
  userDiscount = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['Все', 'Монобукеты', 'Авторские', 'Коробки', 'Корзины'];

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
      {/* 1. Mobile Header (Only on screens < md: Exact Figma frame 5 with official logo) */}
      <div className="md:hidden relative bg-gradient-to-b from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white pt-7 pb-9 px-5 sm:px-6 shadow-md">
        <div className="flex items-center justify-between mb-5 gap-3">
          <div className="flex items-center">
            <img
              src="/logo-light.png"
              alt="Салон цветов София"
              className="h-16 sm:h-20 w-auto object-contain"
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

        {/* Refined Delivery & City Hero Card */}
        <div className="mt-2 mb-4 p-4 rounded-2xl bg-black/35 backdrop-blur-md border border-white/15 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-white/90">
            <div className="flex items-center gap-1.5 font-semibold text-amber-200">
              <MapPin className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span>г. Нижнекамск, пр. Шинников, 13В</span>
            </div>
            <span className="text-white/60 text-[11px] font-medium">08:00 – 21:00</span>
          </div>

          <div>
            <div className="text-base sm:text-lg font-bold text-white leading-snug">
              Быстрая доставка цветов от 30 минут
            </div>
            <p className="text-xs text-white/80 font-normal mt-0.5">
              Бережно привезём букет в аквабоксе или подготовим самовывоз
            </p>
          </div>

          {/* 3 Spacious, Balanced Benefit Cards */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl py-2 px-1.5 flex flex-col justify-center items-center text-center border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-amber-200/90 font-medium mb-0.5">
                Скорость
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                от 30 мин
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl py-2 px-1.5 flex flex-col justify-center items-center text-center border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-amber-200/90 font-medium mb-0.5">
                Контроль
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                Фото в WhatsApp
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl py-2 px-1.5 flex flex-col justify-center items-center text-center border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-amber-200/90 font-medium mb-0.5">
                Свежесть
              </span>
              <span className="text-xs font-bold text-white leading-tight">
                Каждый день
              </span>
            </div>
          </div>
        </div>

        <h2 className="font-sans text-2xl font-bold tracking-wider uppercase mb-3">
          КАТАЛОГ БУКЕТОВ
        </h2>

        {/* Filter Chips Bar (Exact Figma frame 5) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={onOpenFilter}
            className="h-9 px-3.5 rounded-xl bg-white text-[#6C1E26] flex items-center justify-center shadow-sm shrink-0 hover:bg-white/95 transition-colors"
            title="Открыть фильтры"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenFilter}
            className="h-9 px-4 rounded-xl bg-white text-zinc-800 text-xs font-medium flex items-center gap-1 shadow-sm shrink-0"
          >
            <span>Тип</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={onOpenFilter}
            className="h-9 px-4 rounded-xl bg-white text-zinc-800 text-xs font-medium flex items-center gap-1 shadow-sm shrink-0"
          >
            <span>Цвет</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={onOpenFilter}
            className="h-9 px-4 rounded-xl bg-white text-zinc-800 text-xs font-medium flex items-center gap-1 shadow-sm shrink-0"
          >
            <span>Цена</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Mobile Active Category Subtitle */}
      <div className="md:hidden px-5 sm:px-6 pt-5 pb-2">
        <h3 className="font-sans text-xl sm:text-2xl text-[#6C1E26] font-bold tracking-tight">
          {activeCategory === 'Все' ? 'Поставка свежих цветов каждый день' : activeCategory}
        </h3>
      </div>

      {/* 2. Desktop Hero Banner (Returned with chic Quiet Luxury & Official Sofia Branding) */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white p-8 lg:p-12 shadow-xl border border-white/10">
          {/* Subtle floral watermark / ambient light */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold tracking-wider text-amber-200 border border-white/15">
                <span className="text-[#C5A880]">✦</span>
                <span>Быстрая доставка от 30 мин • Поставка свежих цветов каждый день</span>
              </div>

              <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                Салон цветов «София» в Нижнекамске
              </h1>

              <p className="text-base sm:text-lg text-white/90 font-medium leading-relaxed">
                Свежие поставки каждый день: эквадорские розы, пионы, гортензии и авторские композиции. Доставка по Нижнекамску от 30 минут с обязательным фотоотчетом в WhatsApp перед выездом курьера.
              </p>

              {/* Minimalist guarantees */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-light text-white/90">
                <span className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-full border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Доставка от 30 минут</span>
                </span>
                <span className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-full border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>пр. Шинников, 13В</span>
                </span>
                <span className="flex items-center gap-1.5 bg-black/25 px-3 py-1.5 rounded-full border border-white/10">
                  <span className="text-[#C5A880]">✦</span>
                  <span>Подкормка в подарок</span>
                </span>
              </div>
            </div>

            {/* Quick Contact & WhatsApp Card */}
            <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-6 lg:w-80 shrink-0 text-center space-y-3.5 shadow-xl">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#C5A880] font-medium block">
                Связь с флористом
              </span>

              <a
                href="tel:+79172563235"
                className="font-serif text-2xl text-white font-semibold block hover:text-[#C5A880] transition-colors"
              >
                +7 (917) 256-32-35
              </a>

              <p className="text-xs text-white/70 font-light">
                Индивидуальный букет или подбор сортов по фото
              </p>

              <a
                href="https://wa.me/79172563235"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Написать в WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter & Category Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#6C1E26] text-white shadow-sm'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск букета..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#6C1E26] transition-colors"
              />
            </div>

            <button
              onClick={onOpenFilter}
              className="px-4 py-2 rounded-xl bg-white border border-zinc-200 hover:border-[#6C1E26] text-zinc-800 text-xs sm:text-sm font-medium flex items-center gap-2 shadow-sm transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#6C1E26]" />
              <span className="hidden sm:inline">Фильтры</span>
            </button>
          </div>
        </div>

        {/* Category Header Label */}
        <div className="flex items-baseline justify-between mt-6 mb-4">
          <div className="flex items-baseline gap-3">
            <h3 className="font-serif text-2xl sm:text-3xl text-[#6C1E26] font-normal">
              {activeCategory === 'Все' ? 'Все букеты' : activeCategory}
            </h3>
            <span className="text-xs text-zinc-400 font-light">
              ({displayedBouquets.length} композиций)
            </span>
          </div>

          <span className="text-xs text-zinc-500 font-light hidden sm:inline">
            📍 Нижнекамск, пр. Шинников, 13В
          </span>
        </div>
      </div>

      {/* 4. Responsive Product Grid (4 columns desktop, 2 columns mobile) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {displayedBouquets.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-200 p-8 my-6">
            <p className="font-serif text-xl text-zinc-700 mb-2">Букеты не найдены</p>
            <p className="text-xs font-light">Попробуйте изменить поисковый запрос</p>
            <button
              onClick={() => {
                setSearchQuery('');
                onSelectCategory('Все');
              }}
              className="mt-4 px-5 py-2 rounded-xl bg-[#6C1E26] text-white text-xs font-medium"
            >
              Показать все букеты
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedBouquets.map((b) => {
              const finalPrice = userDiscount > 0
                ? Math.round(b.price * (1 - userDiscount / 100))
                : b.price;

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBouquet(b)}
                  className="group flex flex-col bg-[#6C1E26] text-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 border border-[#8C1B2F]/60 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer select-none"
                >
                  {/* Bouquet Image Frame */}
                  <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black/20 shadow-sm">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Circular Cart Action Button */}
                    <button
                      onClick={(e) => onAddToCart(b, e)}
                      className="absolute bottom-2.5 right-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-[#6C1E26] shadow-md flex items-center justify-center hover:scale-110 active:scale-95 transition-transform hover:bg-amber-300 hover:text-zinc-900"
                      aria-label={`Добавить ${b.title} в корзину`}
                      title="Добавить в корзину"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>

                    {/* Loyalty Discount Badge */}
                    {userDiscount > 0 && (
                      <div className="absolute top-2.5 left-2.5 bg-white text-[#6C1E26] text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        -{userDiscount}%
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="pt-3 px-1 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] tracking-wider uppercase text-white/70 font-medium block">
                        {b.category} • {b.characteristics.height}
                      </span>
                      <h4 className="text-sm sm:text-base font-semibold text-white line-clamp-2 leading-snug group-hover:text-amber-200 transition-colors mt-1">
                        {b.title}
                      </h4>
                    </div>

                    <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-white/15">
                      {userDiscount > 0 && (
                        <span className="text-xs text-white/50 line-through">
                          {b.price.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                      <span className="font-serif text-xl sm:text-2xl text-amber-300 font-bold tracking-tight">
                        {finalPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Customer Reviews Section */}
      <FigmaReviewsSection />

      {/* 6. Semantic Local SEO Section */}
      <FigmaSeoSection />
    </div>
  );
};
