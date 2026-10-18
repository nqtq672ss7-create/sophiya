import React, { useState } from 'react';
import { ChevronLeft, ShoppingCart, Check, X, Clock, MapPin, Sparkles } from 'lucide-react';
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
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 md:p-6 select-none font-sans text-zinc-900 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Dialog (FullScreen on Mobile, Responsive Centered Dialog on Desktop) */}
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-[#FAF7F5] sm:rounded-3xl shadow-2xl overflow-hidden border-0 sm:border border-zinc-200 flex flex-col md:flex-row my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column: Image Section (Full width on mobile, 50% on desktop) */}
        <div className="relative w-full md:w-1/2 aspect-[4/3] md:aspect-auto bg-zinc-900 shrink-0">
          <img
            src={bouquet.image}
            alt={bouquet.title}
            className="w-full h-full object-cover"
          />

          {/* Close/Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg"
            aria-label="Закрыть"
          >
            <ChevronLeft className="w-5 h-5 sm:hidden" />
            <X className="w-5 h-5 hidden sm:inline" />
          </button>

          {/* Stock Badge */}
          <div className="absolute top-4 right-4">
            {bouquet.inStock ? (
              <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow">
                В наличии в салоне
              </span>
            ) : (
              <span className="bg-black/70 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-1 rounded-full shadow">
                Под заказ
              </span>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Right Column: Info & Action Section */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto">
          <div>
            {/* Header / Subtitle */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#6C1E26] font-medium">
                {bouquet.category} • Салон «София»
              </span>

              {userDiscount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                  Ваша скидка {userDiscount}%
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal leading-tight mb-3">
              {bouquet.title}
            </h1>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 mb-6">
              {userDiscount > 0 && (
                <span className="text-sm text-zinc-400 line-through">
                  {bouquet.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
              <span className="font-serif text-3xl text-[#6C1E26] font-bold">
                {finalPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>

            {/* Tabs: Описание / Характеристики */}
            <div className="flex rounded-xl bg-zinc-200/80 p-1 mb-6">
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
              <div className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed space-y-4">
                <p>{bouquet.description}</p>

                <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm space-y-2 text-xs text-zinc-700">
                  <div className="flex items-center gap-2 text-[#6C1E26] font-medium">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Доставка по Нижнекамску от 30 минут</span>
                  </div>
                  <p className="text-zinc-500 font-light pl-6">
                    Бережная транспортировка в специальном аквабоксе с водой. Обязательное фото готового букета в WhatsApp перед выездом курьера.
                  </p>

                  <div className="flex items-center gap-2 text-[#6C1E26] font-medium pt-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Самовывоз: пр. Шинников, 13В</span>
                  </div>
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

          {/* Action Row */}
          <div className="pt-6 mt-6 border-t border-zinc-200">
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
                  <span>Добавить в корзину ({finalPrice.toLocaleString('ru-RU')} ₽)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
