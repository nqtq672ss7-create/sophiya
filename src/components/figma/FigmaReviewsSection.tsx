import React, { useState } from 'react';
import { Star, MessageSquare, ExternalLink } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';
import { LeaveReviewModal } from '../reviews/LeaveReviewModal';
import { YandexIcon } from '../common/YandexIcon';

export const FigmaReviewsSection: React.FC = () => {
  const { publishedReviews } = useReviews();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 select-none font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5DDD9]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <YandexIcon className="w-5 h-5 shrink-0" />
            <span className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#8B1A2B] font-semibold block">
              Рейтинг 5.0 на Яндекс Картах (101 оценка)
            </span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold tracking-tight">
            Отзывы наших покупателей
          </h2>
          <p className="text-xs sm:text-sm text-[#5C454C] font-normal mt-1 max-w-xl">
            Реальные впечатления покупателей салона цветов «София» на проспекте Шинников, 13В из сервиса Яндекс Карты.
          </p>
        </div>

        {/* Actions Row: Leave Review & Open Yandex Maps */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://yandex.ru/maps/org/sofiya/105599949171/reviews/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5DDD9] hover:border-[#8B1A2B] text-[#5C454C] hover:text-[#8B1A2B] text-xs font-medium transition-colors shadow-sm active:scale-95"
            title="Открыть все отзывы на Яндекс Картах"
          >
            <YandexIcon className="w-4 h-4 shrink-0" />
            <span>Все 80 отзывов на Яндекс Картах</span>
            <ExternalLink className="w-3 h-3 text-[#7C636B]" />
          </a>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1A2B] hover:bg-[#731221] text-white text-xs font-medium transition-colors shadow-sm shrink-0 active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Оставить отзыв</span>
          </button>
        </div>
      </div>

      {/* Customer Reviews Grid */}
      {publishedReviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {publishedReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 sm:p-6 bg-white text-[#1C1215] rounded-xl border border-[#E5DDD9] shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#7C636B]">
                    <YandexIcon className="w-3 h-3" />
                    <span>Яндекс</span>
                  </div>
                </div>

                {rev.bouquetTitle && (
                  <span className="text-xs text-[#8B1A2B] font-semibold block truncate">
                    {rev.bouquetTitle}
                  </span>
                )}

                <p className="text-xs text-[#5C454C] font-normal leading-relaxed line-clamp-4">
                  «{rev.comment}»
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5DDD9] flex items-center justify-between text-xs">
                <span className="font-sans text-xs text-[#1C1215] font-semibold truncate">
                  {rev.author}
                </span>
                <span className="text-[#7C636B] text-[10px] font-medium shrink-0">
                  {rev.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Review Modal */}
      <LeaveReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </section>
  );
};
