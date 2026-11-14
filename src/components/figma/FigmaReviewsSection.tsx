import React, { useState } from 'react';
import { Star, MessageSquare, ExternalLink, MapPin } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';
import { LeaveReviewModal } from '../reviews/LeaveReviewModal';

export const FigmaReviewsSection: React.FC = () => {
  const { publishedReviews } = useReviews();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 select-none font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5DDD9]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-md bg-[#FC3F1D] text-white text-xs font-bold flex items-center justify-center shrink-0">
              Я
            </span>
            <span className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#8B1A2B] font-semibold block">
              Яндекс Карты, официальный рейтинг 5.0
            </span>
          </div>
          <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold tracking-tight">
            Истории заботы и честные отзывы клиентов
          </h2>
          <p className="text-xs sm:text-sm text-[#5C454C] font-normal mt-1 max-w-xl">
            Все отзывы публикуются непосредственно на Яндекс Картах и верифицируются модерацией Яндекса.
          </p>
        </div>

        {/* Actions Row: Leave Review & Open Yandex Maps */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://yandex.ru/maps/org/sofiya/105599949171/reviews/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#E5DDD9] hover:border-[#8B1A2B] text-[#5C454C] hover:text-[#8B1A2B] text-xs font-medium transition-colors shadow-sm active:scale-95"
            title="Открыть отзывы на Яндекс Картах"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FC3F1D]" />
            <span>Все отзывы на Яндекс Картах</span>
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

      {/* Customer Reviews from CRM (if any real reviews were published) */}
      {publishedReviews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 mb-8">
          {publishedReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 sm:p-6 bg-white text-[#1C1215] rounded-xl border border-[#E5DDD9] shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {rev.bouquetTitle && (
                  <span className="text-xs text-[#8B1A2B] font-semibold block truncate">
                    {rev.bouquetTitle}
                  </span>
                )}

                <p className="text-xs sm:text-sm text-[#5C454C] font-normal leading-relaxed">
                  «{rev.comment}»
                </p>
              </div>

              <div className="pt-3 border-t border-[#E5DDD9] flex items-center justify-between text-xs">
                <span className="font-sans text-sm text-[#1C1215] font-semibold">
                  {rev.author}
                </span>
                <span className="text-[#7C636B] text-[11px] font-medium">
                  {rev.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Yandex Maps Reviews Live Embed Widget */}
      <div className="mt-8 bg-white rounded-xl border border-[#E5DDD9] overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 bg-[#FAF7F5] border-b border-[#E5DDD9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FC3F1D] text-white font-bold text-sm flex items-center justify-center shadow-sm">
              Я
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1C1215]">
                Салон цветов «София» на Яндекс Картах
              </div>
              <div className="text-[11px] text-[#7C636B] font-light">
                г. Нижнекамск, пр. Шинников, 13В, оценки реальных покупателей
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
            <span>5.0</span>
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full h-[620px] sm:h-[680px] bg-white relative">
          <iframe
            src="https://yandex.ru/maps-reviews-widget/105599949171?comments"
            title="Виджет отзывов Яндекс Карт салона цветов София"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </div>

      {/* Direct Review Modal */}
      <LeaveReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </section>
  );
};
