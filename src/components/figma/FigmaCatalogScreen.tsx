import React from 'react';
import { Phone, SlidersHorizontal, ShoppingCart, ChevronRight } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';

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
  userDiscount = 0,
}) => {
  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-28 text-zinc-900 font-sans">
      {/* 1. Header with Gradient and Brand Wordmark */}
      <div className="relative bg-gradient-to-b from-[#8C1B2F] via-[#731525] to-[#5A121A] text-white pt-8 pb-12 px-6 shadow-md">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-wide">
              SweetSofi
            </h1>
            <span className="text-[11px] tracking-[0.2em] uppercase text-white/80 font-light block">
              студия цветов
            </span>
          </div>

          {/* Quick Call to Official Salon Number */}
          <a
            href="tel:+79172563235"
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#6C1E26] shadow-lg hover:scale-105 transition-transform"
            aria-label="Позвонить в салон"
          >
            <Phone className="w-4 h-4 fill-[#6C1E26]" />
          </a>
        </div>

        {/* Catalog Section Header */}
        <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-wider uppercase mb-5">
          КАТАЛОГ
        </h2>

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* Main Filter Trigger */}
          <button
            onClick={onOpenFilter}
            className="h-9 px-3.5 rounded-xl bg-white text-[#6C1E26] flex items-center justify-center shadow-sm shrink-0 hover:bg-white/95 transition-colors"
            title="Открыть все фильтры"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenFilter}
            className="h-9 px-4 rounded-xl bg-white text-zinc-800 text-xs font-medium flex items-center gap-1 shadow-sm shrink-0 hover:bg-white/95 transition-colors"
          >
            <span>Тип</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={onOpenFilter}
            className="h-9 px-4 rounded-xl bg-white text-zinc-800 text-xs font-medium flex items-center gap-1 shadow-sm shrink-0 hover:bg-white/95 transition-colors"
          >
            <span>Цвет</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            onClick={onOpenFilter}
            className="h-9 px-4 rounded-xl bg-white text-zinc-800 text-xs font-medium flex items-center gap-1 shadow-sm shrink-0 hover:bg-white/95 transition-colors"
          >
            <span>Цена</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* 2. Catalog Content & 2-Column Grid */}
      <div className="px-5 pt-6 max-w-lg mx-auto">
        {/* Category Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl text-[#6C1E26] font-normal">
            Монобукеты
          </h3>
          <span className="text-xs text-zinc-400 font-light">
            Нижнекамск, Шинников 13В
          </span>
        </div>

        {/* 2-Column Product Grid */}
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {bouquets.map((b) => {
            const finalPrice = userDiscount > 0
              ? Math.round(b.price * (1 - userDiscount / 100))
              : b.price;

            return (
              <div
                key={b.id}
                onClick={() => onSelectBouquet(b)}
                className="group flex flex-col bg-transparent cursor-pointer select-none"
              >
                {/* Bouquet Image Frame */}
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-200 shadow-sm">
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Circular Cart Action Button */}
                  <button
                    onClick={(e) => onAddToCart(b, e)}
                    className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-[#6C1E26] hover:scale-110 active:scale-95 transition-transform"
                    aria-label={`Добавить ${b.title} в корзину`}
                  >
                    <ShoppingCart className="w-4 h-4 fill-[#6C1E26]/20" />
                  </button>

                  {!b.inStock && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
                      <span className="text-[10px] text-white font-medium uppercase tracking-wider bg-black/60 px-2 py-1 rounded">
                        Под заказ
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="pt-2.5">
                  <h4 className="text-xs font-normal text-zinc-800 line-clamp-2 leading-snug group-hover:text-[#6C1E26] transition-colors">
                    {b.title}
                  </h4>

                  <div className="flex items-baseline gap-1.5 mt-1">
                    {userDiscount > 0 && (
                      <span className="text-[11px] text-zinc-400 line-through">
                        {b.price.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                    <span className="font-serif text-lg text-[#6C1E26] font-semibold tracking-tight">
                      {finalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
