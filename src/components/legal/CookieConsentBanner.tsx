import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenCookiePolicy: () => void;
}

const CONSENT_STORE_ID = 'sophiya_cookie_consent_v1';

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenCookiePolicy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_STORE_ID);
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_STORE_ID, 'accepted');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      className="fixed bottom-24 md:bottom-5 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-md z-40 bg-[#180B0D] text-white/90 border border-white/15 rounded-xl p-3 sm:p-4 shadow-2xl font-sans text-xs"
      aria-label="Уведомление об использовании cookie"
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#6C1E26] flex items-center justify-center text-[#C5A880] shrink-0 mt-0.5">
          <Cookie className="w-4 h-4" />
        </div>

        <div className="flex-1 space-y-2">
          <p className="leading-snug text-white/80 font-light">
            Мы используем технические файлы cookie для работы корзины и оформления заказов в соответствии с 152-ФЗ РФ.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3.5 py-1.5 rounded-lg bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Понятно
            </button>

            <button
              type="button"
              onClick={onOpenCookiePolicy}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Подробнее
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          className="text-white/40 hover:text-white transition-colors p-1"
          aria-label="Закрыть уведомление"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
