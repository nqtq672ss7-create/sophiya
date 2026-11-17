import React, { useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { MaxIcon } from '../common/MaxIcon';
import { SALON_MAX_URL } from '../../config/contacts';
import { formatBouquetAlt } from '../../utils/routes';

interface BouquetCardProps {
  bouquet: Bouquet;
  userDiscount?: number;
  isLcpPriority?: boolean;
  eager?: boolean;
  onSelectBouquet: (bouquet: Bouquet) => void;
  onAddToCart: (bouquet: Bouquet, e: React.MouseEvent) => void;
}

export const BouquetCard: React.FC<BouquetCardProps> = ({
  bouquet,
  userDiscount = 0,
  isLcpPriority = false,
  eager = false,
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
          alt={formatBouquetAlt(bouquet.title)}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading={eager || isLcpPriority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={isLcpPriority ? 'high' : undefined}
        />

        {/* Category Badge */}
        {bouquet.category && bouquet.category !== 'Все' && (
          <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-2 py-0.5 rounded-md bg-[#1C1215]/85 text-[9px] sm:text-[10px] text-white/95 font-medium select-none">
            {bouquet.category}
          </span>
        )}

        {/* Multi-photo Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {photos.length > 1 && (
          <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 sm:gap-1.5 bg-black/60 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
            {photos.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => handleDotClick(e, dotIdx)}
                className={`rounded-sm transition-colors cursor-pointer ${
                  dotIdx === activePhoto
                    ? 'w-3 sm:w-4 h-1 sm:h-1.5 bg-white'
                    : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Фото ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-sans text-xs sm:text-sm text-[#1C1215] font-semibold leading-snug group-hover:text-[#922E3D] transition-colors mb-1 line-clamp-2">
            {bouquet.title}
          </h3>

          <div className="hidden sm:block mb-2.5">
            <p className="text-[11px] text-[#5C454C] font-light line-clamp-2 leading-relaxed">
              {bouquet.description}
            </p>
          </div>
        </div>

        {/* Price & Action Row */}
        <div>
          <div className="flex items-baseline justify-between pt-1.5 sm:pt-2 border-t border-[#E5DDD9] mb-2 sm:mb-2.5">
            <div>
              {userDiscount > 0 ? (
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="font-sans text-sm sm:text-base lg:text-lg font-bold text-[#922E3D]">
                    {discountedPrice.toLocaleString('ru-RU')} ₽
                  </span>
                  <span className="text-[10px] sm:text-xs text-[#7C636B] line-through">
                    {bouquet.price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ) : (
                <span className="font-sans text-sm sm:text-base lg:text-lg font-bold text-[#922E3D]">
                  {bouquet.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          </div>

          {/* Action: Cart Button + WhatsApp Icon Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => onAddToCart(bouquet, e)}
              className="flex-1 py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-lg sm:rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white font-medium text-[11px] sm:text-xs flex items-center justify-center gap-1 transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="truncate">В корзину</span>
            </button>

            <a
              href={SALON_MAX_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#1C1215] hover:bg-[#3A252C] text-white border border-[#1C1215] flex items-center justify-center transition-colors shadow-sm active:scale-95 shrink-0"
              title="Написать в MAX"
              aria-label="Написать в MAX"
            >
              <MaxIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};
