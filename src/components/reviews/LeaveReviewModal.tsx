import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, Sparkles, Send, Heart } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';
import { useCatalog } from '../../context/CatalogContext';
import { useAuth } from '../../context/AuthContext';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBouquetTitle?: string;
}

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  defaultBouquetTitle,
}) => {
  const { addReview } = useReviews();
  const { bouquets } = useCatalog();
  const { customer } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [author, setAuthor] = useState('');
  const [bouquetTitle, setBouquetTitle] = useState(defaultBouquetTitle || '');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Prefill author from logged-in customer if available
  useEffect(() => {
    if (customer) {
      const fullName = `${customer.firstName} ${customer.lastName || ''}`.trim();
      if (fullName && !author) {
        setAuthor(fullName);
      }
    }
    if (defaultBouquetTitle) {
      setBouquetTitle(defaultBouquetTitle);
    }
  }, [customer, defaultBouquetTitle]);

  if (!isOpen) return null;

  const ratingDescriptions: Record<number, string> = {
    5: 'Превосходно — восторг и свежесть цветов',
    4: 'Очень хорошо — красивый букет и приятный сервис',
    3: 'Хорошо — в целом понравилось',
    2: 'Есть замечания по букету или доставке',
    1: 'Разочарован(а) качеством',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanAuthor = author.trim();
    const cleanComment = comment.trim();

    if (!cleanAuthor) {
      setError('Пожалуйста, укажите ваше имя');
      return;
    }

    if (cleanComment.length < 5) {
      setError('Пожалуйста, напишите пару слов о вашем впечатлении (минимум 5 символов)');
      return;
    }

    // Save review to cloud DB via context
    addReview({
      author: cleanAuthor,
      rating,
      date: 'Сегодня',
      bouquetTitle: bouquetTitle.trim() || undefined,
      comment: cleanComment,
      isVerified: Boolean(customer), // Verified badge if user has registered
      isPublished: true, // Visible immediately on site
    });

    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setComment('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none font-sans animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF7F5] rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-200/80 hover:bg-zinc-300 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          /* SUCCESS SCREEN */
          <div className="py-8 text-center space-y-5 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#6C1E26] font-semibold block">
                Салон цветов «София»
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal">
                Спасибо за ваш отзыв!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed max-w-sm mx-auto">
                Ваше мнение уже опубликовано в ленте отзывов салона и вдохновляет нашу команду флористов радовать вас каждый день.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-all shadow-md active:scale-98"
              >
                Вернуться к букетам
              </button>
            </div>
          </div>
        ) : (
          /* REVIEW FORM */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-[#6C1E26] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">
                  Прямой отзыв на сайте
                </span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal">
                Поделитесь впечатлением
              </h3>
              <p className="text-xs text-zinc-500 font-light mt-1">
                Без перехода в сторонние мессенджеры — ваш отзыв сразу появится на витрине салона.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            {/* Interactive Star Rating */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Ваша оценка <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = (hoverRating || rating) >= starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 -m-1 focus:outline-none transition-transform hover:scale-125 active:scale-95 cursor-pointer"
                        aria-label={`Оценка ${starVal} из 5`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                              : 'text-zinc-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <span className="text-xs text-zinc-500 font-light ml-2">
                  {ratingDescriptions[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Author Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Ваше имя <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Как вас зовут (например: Екатерина М.)"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#6C1E26] focus:ring-1 focus:ring-[#6C1E26] shadow-sm transition-all"
              />
            </div>

            {/* Bouquet Reference (Dropdown or custom) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Букет или повод <span className="text-zinc-400 font-normal">(необязательно)</span>
              </label>
              <div className="relative">
                <select
                  value={bouquetTitle}
                  onChange={(e) => setBouquetTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#6C1E26] focus:ring-1 focus:ring-[#6C1E26] shadow-sm transition-all appearance-none cursor-pointer"
                >
                  <option value="">Выберите букет из каталога или напишите свой</option>
                  {bouquets.map((b) => (
                    <option key={b.id} value={b.title}>
                      {b.title} ({b.price.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                  <option value="Индивидуальный заказ">Индивидуальный заказ флористу</option>
                  <option value="Срочная доставка цветов">Срочная доставка цветов</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Review Comment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-700">
                Ваш отзыв <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Расскажите о свежести цветов, сборке композиции и впечатлениях получателя..."
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#6C1E26] focus:ring-1 focus:ring-[#6C1E26] shadow-sm transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Опубликовать отзыв на сайте</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-zinc-400 font-light flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-[#6C1E26] fill-[#6C1E26]" />
              <span>Спасибо, что помогаете салону «София» становиться лучше</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
