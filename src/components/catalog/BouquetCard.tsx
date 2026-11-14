import React, { useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { WhatsAppIcon } from '../common/WhatsAppIcon';

interface BouquetCardProps {
  bouquet: Bouquet;
  userDiscount?: number;
  onSelectBouquet: (bouquet: Bouquet) => void;
  onAddToCart: (bouquet: Bouquet, e: React.MouseEvent) => void;
}

export const BouquetCard: React.FC<BouquetCardProps> = ({
  bouquet,
  userDiscount = 0,
  onSelectBouquet,
  onAddToCart,
}) => {
  const photos = (bouquet.images && bouquet.images.length > 0 ? bouquet.images : [bouquet.image]).slice(0, 3);
  const [activePhoto, setActivePhoto] = useState(0);

  const discountedPrice = userDiscount > 0
    ? Math.round(bouquet.price * (1 - userDiscount / 100))
    : bouquet.price;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setActivePhoto(idx);
  };

  return (
    <article
      onClick={() => onSelectBouquet(bouquet)}
      className="bg-white rounded-xl border border-[#E5DDD9] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between group cursor-pointer"
      id={`product-${bouquet.id}`}
    >
      {/* Compact Image Area */}
      <div className="relative overflow-hidden aspect-square bg-[#FAF7F5] select-none">
        <img
          src={photos[activePhoto] || bouquet.image}
          alt={`${bouquet.title} в Нижнекамске — салон цветов София`}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Multi-photo Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md">
            {photos.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => handleDotClick(e, dotIdx)}
                className={`rounded-sm transition-colors cursor-pointer ${
                  dotIdx === activePhoto
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Фото ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-sans text-base text-[#1C1215] font-semibold leading-snug group-hover:text-[#8B1A2B] transition-colors mb-1.5 line-clamp-1">
            {bouquet.title}
          </h3>

          <p className="text-xs text-[#5C454C] font-light line-clamp-2 leading-relaxed mb-3">
            {bouquet.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div>
          <div className="flex items-baseline justify-between pt-2.5 border-t border-[#E5DDD9] mb-3">
            <div>
              {userDiscount > 0 ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-sans text-xl font-bold text-[#8B1A2B]">
                    {discountedPrice.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-xs text-[#7C636B] line-through">
                    {bouquet.price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ) : (
                <span className="font-sans text-xl font-bold text-[#8B1A2B]">
                  {bouquet.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          </div>

          {/* Action: Cart Button + WhatsApp Icon Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => onAddToCart(bouquet, e)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#8B1A2B] hover:bg-[#731221] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95 cursor-pointer"
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
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm active:scale-95 shrink-0"
              title="Заказать через WhatsApp"
              aria-label="Заказать через WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};
