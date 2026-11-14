import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Check, X, Clock, MapPin } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface FigmaProductDetailModalProps {
  bouquet: Bouquet|null;
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
  const [activeTab, setActiveTab] = useState<'desc'|'specs'>('desc');
  const [isAdded, setIsAdded] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  if (!bouquet) return null;

  const photos = (bouquet.images && bouquet.images.length > 0 ? bouquet.images : [bouquet.image]).slice(0, 3);

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
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0 sm:p-4 md:p-6 select-none font-sans text-[#1C1215] overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal Dialog */}
      <div
        className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-[#FAF7F5] sm:rounded-xl shadow-2xl overflow-hidden border-0 sm:border border-[#E5DDD9] flex flex-col md:flex-row my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Column: Image Section */}
        <div
          className="relative w-full md:w-1/2 md:aspect-auto bg-[#1C1215] shrink-0 select-none"
          style={{ minHeight: '320px' }}
        >
          <img
            src={photos[activePhoto] || bouquet.image}
            alt={bouquet.title}
            className="w-full h-full object-cover transition-opacity duration-300"
          />

          {/* Close/Back Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-lg bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors shadow-lg cursor-pointer z-10"
            aria-label="Закрыть"
          >
            <ChevronLeft className="w-5 h-5 sm:hidden" />
            <X className="w-5 h-5 hidden sm:inline" />
          </button>

          {/* Prev / Next photo buttons */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActivePhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setActivePhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Stock Badge */}
          <div className="absolute top-4 right-4">
            {bouquet.inStock ? (
              <span className="bg-emerald-700 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-sm">
                В наличии в салоне
              </span>
            ) : (
              <span className="bg-[#1C1215]/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-md shadow-sm">
                Под заказ
              </span>
            )}
          </div>

          {/* Interactive Dots Indicator */}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhoto(idx)}
                  className={`rounded-sm transition-colors cursor-pointer ${
                    idx === activePhoto
                      ? 'w-5 h-2 bg-white'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Фото ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info & Action Section */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto">
          <div>
            {/* Header / Subtitle */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs uppercase tracking-[0.2em] text-[#8B1A2B] font-semibold">
                {bouquet.category}, салон «София»
              </span>

              {userDiscount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-md">
                  Ваша скидка {userDiscount}%
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight mb-3">
              {bouquet.title}
            </h2>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 mb-6">
              {userDiscount > 0 && (
                <span className="text-sm text-[#A08890] line-through">
                  {bouquet.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
              <span className="font-sans text-3xl text-[#8B1A2B] font-bold">
                {finalPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>

            {/* Tabs: Описание / Характеристики */}
            <div className="flex rounded-xl bg-[#E5DDD9]/60 p-1 mb-6">
              <button
                onClick={() => setActiveTab('desc')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'desc'
                    ? 'bg-white text-[#1C1215] shadow-sm font-semibold'
                    : 'text-[#5C454C] hover:text-[#1C1215]'
                }`}
              >
                Описание
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'specs'
                    ? 'bg-[#8B1A2B] text-white shadow-sm font-semibold'
                    : 'text-[#5C454C] hover:text-[#1C1215]'
                }`}
              >
                Характеристики
              </button>
            </div>

            {/* Tab 1: Description */}
            {activeTab === 'desc' && (
              <div className="text-xs sm:text-sm text-[#5C454C] font-light leading-relaxed space-y-4">
                <p>{bouquet.description}</p>

                <div className="p-4 rounded-xl bg-white border border-[#E5DDD9] shadow-sm space-y-2 text-xs text-[#1C1215]">
                  <div className="flex items-center gap-2 text-[#8B1A2B] font-medium">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Доставка по Нижнекамску от 30 минут</span>
                  </div>
                  <p className="text-[#7C636B] font-light pl-6">
                    Бережная транспортировка в специальном аквабоксе с водой. Обязательное фото готового букета в WhatsApp перед выездом курьера.
                  </p>

                  <div className="flex items-center gap-2 text-[#8B1A2B] font-medium pt-1">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Самовывоз: пр. Шинников, 13В</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Specs */}
            {activeTab === 'specs' && (
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="py-2.5 border-b border-[#E5DDD9] flex justify-between">
                  <span className="text-[#7C636B]">Высота композиции:</span>
                  <span className="font-medium text-[#1C1215]">{bouquet.characteristics.height}</span>
                </div>
                <div className="py-2.5 border-b border-[#E5DDD9] flex justify-between">
                  <span className="text-[#7C636B]">Состав:</span>
                  <span className="font-medium text-[#1C1215]">{bouquet.characteristics.flowersCount}</span>
                </div>
                <div className="py-2.5 border-b border-[#E5DDD9] flex justify-between">
                  <span className="text-[#7C636B]">Стойкость:</span>
                  <span className="font-medium text-[#1C1215]">{bouquet.characteristics.durability}</span>
                </div>
                <div className="py-2.5 border-b border-[#E5DDD9] flex justify-between">
                  <span className="text-[#7C636B]">Оформление:</span>
                  <span className="font-medium text-[#1C1215]">{bouquet.characteristics.packaging}</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-6 mt-6 border-t border-[#E5DDD9] flex items-center gap-3">
            <button
              onClick={handleAdd}
              className={`flex-1 py-3.5 px-4 rounded-xl font-medium text-xs sm:text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#8B1A2B] hover:bg-[#731221] text-white active:scale-95'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Добавлено в корзину!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>В корзину ({finalPrice.toLocaleString('ru-RU')} ₽)</span>
                </>
              )}
            </button>

            <a
              href={`https://wa.me/79172563235?text=${encodeURIComponent(
                `Здравствуйте! Хочу уточнить детали и заказать букет «${bouquet.title}» (${bouquet.price} ₽) в Нижнекамске.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95 shrink-0"
              title="Задать вопрос или заказать в WhatsApp"
              aria-label="Заказать в WhatsApp"
            >
              <WhatsAppIcon className="w-5 h-5 fill-current" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
