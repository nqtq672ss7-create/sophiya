import React, { useEffect, useRef } from 'react';
import { Check, ArrowRight, X } from 'lucide-react';
import { Bouquet } from '../../types/figma-app';
import { formatBouquetAlt } from '../../utils/routes';

interface CartToastProps {
  bouquet: Bouquet|null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCart: () => void;
  autoDismissMs?: number;
}

export const CartToast: React.FC<CartToastProps> = ({
  bouquet,
  isOpen,
  onClose,
  onNavigateToCart,
  autoDismissMs = 4500,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoDismissMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, autoDismissMs, onClose]);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    if (isOpen) {
      timerRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  if (!bouquet) return null;

  return (
    <aside
      aria-live="polite"
      role="status"
      aria-atomic="true"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md bg-white border border-[#922E3D]/25 rounded-xl shadow-xl p-3 sm:p-3.5 transition-opacity duration-200 select-none ${
        isOpen
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Bouquet Thumbnail */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border border-[#E5DDD9] bg-[#FAF7F5] shrink-0">
          <img
            src={bouquet.image}
            alt={formatBouquetAlt(bouquet.title)}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 leading-none mb-1">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>В корзине</span>
          </div>

          <h4 className="font-sans text-xs sm:text-sm font-semibold text-[#1C1215] truncate">
            {bouquet.title}
          </h4>

          <span className="font-sans text-xs font-bold text-[#922E3D] block mt-0.5">
            {bouquet.price.toLocaleString('ru-RU')} ₽
          </span>
        </div>

        {/* Action Button & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToCart();
            }}
            className="px-3.5 py-2 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-sm active:scale-95 cursor-pointer"
            title="Перейти в корзину"
          >
            <span>Перейти</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#A08890] hover:text-[#1C1215] rounded-lg transition-colors cursor-pointer"
            aria-label="Закрыть уведомление"
            title="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
