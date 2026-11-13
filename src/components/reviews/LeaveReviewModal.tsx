import React, { useState, useEffect } from 'react';
import { X, Star, Send } from 'lucide-react';
import { useReviews } from '../../context/ReviewsContext';
import { useCatalog } from '../../context/CatalogContext';
import { useAuth } from '../../context/AuthContext';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBouquetTitle?: string;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: 'Превосходно, цветы свежие',
  4: 'Очень хорошо',
  3: 'Хорошо, в целом понравилось',
  2: 'Есть замечания к букету или доставке',
  1: 'Не понравилось качество',
};

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

const FIELD_BASE =
  'w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[var(--surface)] border text-sm text-[var(--text)] placeholder:text-[var(--muted)] transition-colors ' +
  FOCUS_RING;

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  defaultBouquetTitle,
}) => {
  const { submitReview } = useReviews();
  const { bouquets } = useCatalog();
  const { customer } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [author, setAuthor] = useState('');
  const [bouquetTitle, setBouquetTitle] = useState(defaultBouquetTitle || '');
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Name of the field with the error, empty string when there is none.
  const [errorField, setErrorField] = useState('');

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

  const handleClose = () => {
    setIsSubmitted(false);
    setComment('');
    setError('');
    setErrorField('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const fail = (message: string, field = '') => {
    setError(message);
    setErrorField(field);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setErrorField('');

    const cleanAuthor = author.trim();
    const cleanComment = comment.trim();

    if (!cleanAuthor) {
      fail('Укажите имя, как подписать отзыв.', 'author');
      return;
    }

    if (cleanComment.length < 5) {
      fail('Напишите хотя бы пару слов об отзыве, от 5 символов.', 'comment');
      return;
    }

    setIsSubmitting(true);
    const result = await submitReview({
      author: cleanAuthor,
      rating,
      bouquetTitle: bouquetTitle.trim() || undefined,
      comment: cleanComment,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      fail(result.error || 'Не удалось отправить отзыв. Попробуйте ещё раз.');
      return;
    }
    setIsSubmitted(true);
  };

  const borderFor = (field: string) =>
    errorField === field ? 'border-[var(--error)]' : 'border-[var(--line)]';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 font-sans"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="review-modal relative w-full max-w-lg max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-[var(--bg)] text-[var(--text)] rounded-xl border border-[var(--line)] p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className={`absolute top-3 right-3 w-11 h-11 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--line)] transition-colors ${FOCUS_RING}`}
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {isSubmitted ? (
          <div className="py-6 space-y-5" role="status">
            <h2 id="review-modal-title" className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-balance pr-10">
              Отзыв принят
            </h2>
            <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed max-w-md">
              Мы проверим его и опубликуем в ленте, обычно в течение дня. Пока он виден только нам.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className={`w-full min-h-[48px] rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-sm font-medium transition-colors ${FOCUS_RING}`}
            >
              Вернуться в каталог
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="pr-10">
              <h2 id="review-modal-title" className="text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-balance">
                Отзыв о букете
              </h2>
              <p className="text-sm text-[var(--muted)] mt-1.5">
                После проверки салоном отзыв появится в ленте на сайте.
              </p>
            </div>

            {error && (
              <div role="alert" className="p-3 rounded-lg border border-[var(--error)] text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Оценка</legend>
              <div className="flex flex-wrap items-center gap-x-3">
                <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = (hoverRating || rating) >= starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        aria-pressed={rating === starVal}
                        className={`w-11 h-11 flex items-center justify-center rounded-lg ${FOCUS_RING}`}
                        aria-label={`Оценка ${starVal} из 5`}
                      >
                        <Star
                          aria-hidden="true"
                          className={`w-7 h-7 transition-colors ${
                            isFilled ? 'text-[var(--accent)] fill-[var(--accent)]' : 'text-[var(--line)]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-sm text-[var(--muted)]" aria-live="polite">
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </span>
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="review-author" className="block text-sm font-medium">
                Ваше имя
              </label>
              <input
                id="review-author"
                type="text"
                autoComplete="name"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                aria-invalid={errorField === 'author'}
                placeholder="Екатерина М."
                className={`${FIELD_BASE} ${borderFor('author')}`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-bouquet" className="block text-sm font-medium">
                Букет или повод, если хотите указать
              </label>
              <select
                id="review-bouquet"
                value={bouquetTitle}
                onChange={(e) => setBouquetTitle(e.target.value)}
                className={`${FIELD_BASE} border-[var(--line)] cursor-pointer`}
              >
                <option value="">Не указывать</option>
                {bouquets.map((b) => (
                  <option key={b.id} value={b.title}>
                    {b.title}, {b.price.toLocaleString('ru-RU')}&nbsp;₽
                  </option>
                ))}
                <option value="Индивидуальный заказ">Индивидуальный заказ флористу</option>
                <option value="Срочная доставка цветов">Срочная доставка цветов</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="block text-sm font-medium">
                Что понравилось или не понравилось
              </label>
              <textarea
                id="review-comment"
                rows={4}
                maxLength={2000}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                aria-invalid={errorField === 'comment'}
                placeholder="Свежесть цветов, сборка, доставка, реакция получателя"
                className={`${FIELD_BASE} ${borderFor('comment')} resize-y leading-relaxed`}
              />
            </div>

            {/* A button inside a form submits it by default. */}
            <button
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={`w-full min-h-[48px] rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-strong)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 ${FOCUS_RING}`}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Передаём салону…' : 'Передать отзыв салону'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
