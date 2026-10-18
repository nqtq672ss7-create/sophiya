import React, { useState } from 'react';
import { ChevronLeft, ShoppingCart, Check } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';

interface FigmaProductDetailModalProps {
  bouquet: Bouquet | null;
  onClose: () => void;
  onAddToCart: (bouquet: Bouquet) => void;
  userDiscount?: number;
}

export const FigmaProductDetailModal: React.FC<FigmaProductDetailModalProps> = ({
  bouquet,
  onClose,
  onAddToCart,
  userDiscount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'desc' | 'specs'>('desc');
  const [isAdded, setIsAdded] = useState(false);

  if (!bouquet) return null;

  const finalPrice = userDiscount > 0
    ? Math.round(bouquet.price * (1 - userDiscount / 100))
    : bouquet.price;

  const handleAdd = () => {
    onAddToCart(bouquet);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#FAF7F5] flex flex-col font-sans text-zinc-900 animate-slideUp overflow-hidden">
      {/* Scrollable View */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Top Image Hero */}
        <div className="relative w-full aspect-[4/3] bg-zinc-900">
          <img
            src={bouquet.image}
            alt={bouquet.title}
            className="w-full h-full object-cover"
          />

          {/* Back Button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-5 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            aria-label="Назад к каталогу"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Content Container */}
        <div className="px-6 pt-6 max-w-lg mx-auto">
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal leading-tight">
              {bouquet.title}
            </h1>
            <div className="text-right shrink-0">
              {userDiscount > 0 && (
                <span className="text-xs text-zinc-400 line-through block">
                  {bouquet.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
              <span className="font-serif text-2xl text-[#6C1E26] font-semibold">
                {finalPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          {/* Tabs: Описание / Характеристики */}
          <div className="flex rounded-xl bg-zinc-200/70 p-1 mb-6">
            <button
              onClick={() => setActiveTab('desc')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'desc'
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Описание
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'specs'
                  ? 'bg-[#6C1E26] text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Характеристики
            </button>
          </div>

          {/* Tab 1: Description */}
          {activeTab === 'desc' && (
            <div className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed space-y-3">
              <p>{bouquet.description}</p>
              <div className="p-3.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-700 space-y-1">
                <span className="font-medium text-[#6C1E26] block">Доставка по Нижнекамску:</span>
                <span>Бережная доставка курьером от 30 минут. Фото готового букета в WhatsApp перед выездом.</span>
              </div>
            </div>
          )}

          {/* Tab 2: Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="py-2.5 border-b border-zinc-200 flex justify-between">
                <span className="text-zinc-500">Высота композиции:</span>
                <span className="font-medium text-zinc-800">{bouquet.characteristics.height}</span>
              </div>
              <div className="py-2.5 border-b border-zinc-200 flex justify-between">
                <span className="text-zinc-500">Состав:</span>
                <span className="font-medium text-zinc-800">{bouquet.characteristics.flowersCount}</span>
              </div>
              <div className="py-2.5 border-b border-zinc-200 flex justify-between">
                <span className="text-zinc-500">Стойкость:</span>
                <span className="font-medium text-zinc-800">{bouquet.characteristics.durability}</span>
              </div>
              <div className="py-2.5 border-b border-zinc-200 flex justify-between">
                <span className="text-zinc-500">Оформление:</span>
                <span className="font-medium text-zinc-800">{bouquet.characteristics.packaging}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#FAF7F5] border-t border-zinc-200">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleAdd}
            className={`w-full py-4 rounded-2xl font-medium text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : 'bg-[#6C1E26] hover:bg-[#5A121A] text-white active:scale-[0.99]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-5 h-5" />
                <span>Добавлено в корзину!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Добавить в корзину</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
