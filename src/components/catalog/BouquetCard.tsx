import React, { useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { MaxIcon } from '../common/MaxIcon';
import { SALON_MAX_URL } from '../../config/contacts';
import { formatBouquetAlt } from '../../utils/routes';

interface BouquetCardProps {
  bouquet: Bouquet;
  userDiscount?: number;
  isLcpPriority?: boolean;
  eager?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (bouquetId: string, e: React.MouseEvent) => void;
  onSelectBouquet: (bouquet: Bouquet) => void;
  onAddToCart: (bouquet: Bouquet, e: React.MouseEvent) => void;
}

export const BouquetCard: React.FC<BouquetCardProps> = ({
  bouquet,
  userDiscount = 0,
  isLcpPriority = false,
  eager = false,
  isFavorite = false,
  onToggleFavorite,
  onSelectBouquet,
  onAddToCart,
}) => {
  const photos = (
    bouquet.images && bouquet.images.length > 0 ? bouquet.images : [bouquet.image]
  ).slice(0, 3);
  const [activePhoto, setActivePhoto] = useState(0);
  const [localFavorite, setLocalFavorite] = useState(false);

  const liked = onToggleFavorite ? isFavorite : localFavorite;

  const finalPrice =
    userDiscount > 0
      ? Math.round(bouquet.price * (1 - userDiscount / 100))
      : bouquet.price;

  const comparePrice =
    bouquet.oldPrice && bouquet.oldPrice > finalPrice
      ? bouquet.oldPrice
      : userDiscount > 0 && bouquet.price > finalPrice
        ? bouquet.price
        : undefined;

  const discountPct =
    comparePrice && comparePrice > finalPrice
      ? Math.round(((comparePrice - finalPrice) / comparePrice) * 100)
      : 0;

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

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(bouquet.id, e);
    } else {
      setLocalFavorite((prev) => !prev);
    }
  };

  return (
    <article
      onClick={() => onSelectBouquet(bouquet)}
      className="bg-white rounded-xl p-2 sm:p-2.5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between group cursor-pointer border border-[#E5DDD9]/60"
      id={`product-${bouquet.id}`}
    >
      {/* Clean Photo Area */}
      <div className="relative overflow-hidden aspect-square rounded-xl bg-[#FAF7F5] select-none">
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

        {/* Discount Badge (only when oldPrice > price or userDiscount > 0) */}
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[#922E3D] text-white text-[11px] font-bold shadow-sm select-none">
            -{discountPct}%
          </span>
        )}

        {/* Favorite / Like Button */}
        <button
          type="button"
          onClick={handleLikeClick}
          className={`absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-colors cursor-pointer ${
            liked
              ? 'bg-[#922E3D] text-white'
              : 'bg-white/90 hover:bg-white text-[#5C454C] hover:text-[#922E3D]'
          }`}
          title={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
          aria-label={liked ? 'Убрать из избранного' : 'Добавить в избранное'}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} />
        </button>

        {/* Multi-photo Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/55 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-black/55 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Следующее фото"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/55 px-2 py-0.5 rounded-md">
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

      {/* Info & Action Container */}
      <div className="px-1 pt-2.5 pb-1 flex-1 flex flex-col justify-between gap-2.5">
        <h3 className="font-sans text-xs sm:text-sm text-[#1C1215] font-medium leading-snug group-hover:text-[#922E3D] transition-colors line-clamp-2 min-h-[2.4em]">
          {bouquet.title}
        </h3>

        <div className="space-y-2">
          {/* Price Row (New Price + Crossed-out Old Price) */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-sans text-sm sm:text-base lg:text-lg font-bold text-[#1C1215]">
              {finalPrice.toLocaleString('ru-RU')} ₽
            </span>
            {comparePrice && (
              <span className="text-xs text-[#7C636B] line-through">
                {comparePrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>

          {/* Action: Cart Button + MAX Icon */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => onAddToCart(bouquet, e)}
              className="flex-1 py-2 px-2.5 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white font-medium text-[11px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">В корзину</span>
            </button>

            <a
              href={SALON_MAX_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#922E3D]/10 hover:bg-[#922E3D]/20 text-[#922E3D] border border-[#922E3D]/20 flex items-center justify-center transition-colors shadow-sm active:scale-95 shrink-0"
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
