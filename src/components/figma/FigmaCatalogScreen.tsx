import React, { useState } from 'react';
import { Phone, SlidersHorizontal, ShoppingCart, Search, ChevronRight, MessageSquare, Clock, MapPin, Sparkles } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { FigmaReviewsSection } from './FigmaReviewsSection';

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
      <div className="md:hidden relative bg-gradient-to-b from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white pt-8 pb-10 px-6 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo-light.png"
              alt="Салон цветов София"
              className="h-10 w-auto object-contain"
            />
          </div>

          <a
            href="tel:+79172563235"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#6C1E26] shadow-md hover:scale-105 transition-transform"
            aria-label="Позвонить в салон"
          >
            <Phone className="w-4 h-4 fill-[#6C1E26]" />
          </a>
        </div>

        <h2 className="font-serif text-3xl font-normal tracking-wider uppercase mb-4">
          КАТАЛОГ
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

      {/* Mobile Active Category Subtitle (Exact Figma frame 5) */}
      <div className="md:hidden px-6 pt-5 pb-2 flex items-baseline justify-between">
        <h3 className="font-serif text-2xl text-[#6C1E26] font-normal">
          {activeCategory === 'Все' ? 'Монобукеты' : activeCategory}
        </h3>
        <span className="text-[11px] text-zinc-400 font-light">
          Нижнекамск, Шинников 13В
        </span>
      </div>

      {/* 2. Desktop Hero Banner (Returned with chic Quiet Luxury & Official Sofia Branding) */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white p-8 lg:p-12 shadow-xl border border-white/10">
          {/* Subtle floral watermark / ambient light */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-light tracking-wider text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Салон цветов «София» • Нижнекамск</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight tracking-tight">
                Авторские букеты и свежие поставки
              </h1>

              <p className="text-sm sm:text-base text-white/80 font-light leading-relaxed">
                Свежие поставки эквадорских роз, пионов и гортензий. Собираем букеты по стандартам высокой флористики с обязательным фотоотчетом в WhatsApp перед выездом курьера.
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
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                  className="group flex flex-col bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-3 border border-zinc-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer select-none"
                >
                  {/* Bouquet Image Frame */}
                  <div className="relative aspect-square w-full rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-100 shadow-sm">
                    <img
                      src={b.image}
                      alt={b.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Circular Cart Action Button */}
                    <button
                      onClick={(e) => onAddToCart(b, e)}
                      className="absolute bottom-2.5 right-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-[#6C1E26] hover:scale-110 active:scale-95 transition-transform hover:bg-[#6C1E26] hover:text-white"
                      aria-label={`Добавить ${b.title} в корзину`}
                      title="Добавить в корзину"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>

                    {/* Loyalty Discount Badge */}
                    {userDiscount > 0 && (
                      <div className="absolute top-2.5 left-2.5 bg-[#6C1E26] text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full shadow">
                        -{userDiscount}%
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="pt-3 px-1 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-light block">
                        {b.category} • {b.characteristics.height}
                      </span>
                      <h4 className="text-xs sm:text-sm font-medium text-zinc-900 line-clamp-2 leading-snug group-hover:text-[#6C1E26] transition-colors mt-0.5">
                        {b.title}
                      </h4>
                    </div>

                    <div className="flex items-baseline gap-2 mt-2 pt-2 border-t border-zinc-100">
                      {userDiscount > 0 && (
                        <span className="text-[11px] sm:text-xs text-zinc-400 line-through">
                          {b.price.toLocaleString('ru-RU')} ₽
                        </span>
                      )}
                      <span className="font-serif text-lg sm:text-xl text-[#6C1E26] font-semibold tracking-tight">
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
    </div>
  );
};
