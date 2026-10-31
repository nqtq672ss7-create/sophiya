import React, { useState } from 'react';
import { Phone, MapPin, Clock, MessageSquare, ShieldCheck, FileText } from 'lucide-react';
import { FigmaTab } from './FigmaBottomNav';
import { RequisitesModal } from '../payment/RequisitesModal';

interface FigmaFooterProps {
  onTabChange: (tab: FigmaTab) => void;
  onOpenCrm: () => void;
  onNavigate?: (path: string, options?: { tab?: FigmaTab }) => void;
}

export const FigmaFooter: React.FC<FigmaFooterProps> = ({
  onTabChange,
  onOpenCrm,
  onNavigate,
}) => {
  const [isRequisitesOpen, setIsRequisitesOpen] = useState(false);

  const handleLink = (e: React.MouseEvent, path: string, tab?: FigmaTab) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path, tab ? { tab } : undefined);
    } else if (tab) {
      onTabChange(tab);
    }
  };

  return (
    <footer className="w-full bg-[#180B0D] text-white/80 font-sans border-t border-white/10 mt-20 pb-24 md:pb-12 pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          {/* Brand Info with Official Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo-light.png"
                alt="Салон цветов София"
                className="h-14 w-auto object-contain"
              />
              <div className="flex flex-col justify-center">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-white/95 leading-tight">
                  Салон цветов
                </span>
                <span className="text-[11px] text-white/60 font-medium">
                  Нижнекамск
                </span>
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed font-light">
              Авторская флористика и свежие букеты в Нижнекамске. Сборка композиций с вниманием к деталям.
            </p>
          </div>

          {/* Location & Schedule */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg text-white font-normal">Салон</h4>
            <ul className="space-y-2 text-xs font-light text-white/70 list-none p-0">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <a
                  href="https://yandex.ru/maps/org/sofiya/105599949171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  title="Салон «София» на Яндекс Картах"
                >
                  г. Нижнекамск, пр. Шинников, 13В
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <span>Ежедневно: 08:00 – 21:00</span>
              </li>
              <li className="pt-1.5">
                <a
                  href="https://yandex.ru/maps/org/sofiya/105599949171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 hover:text-white text-xs transition-colors border border-white/10"
                  title="Открыть карточку салона на Яндекс Картах"
                >
                  <span className="w-4 h-4 rounded-full bg-[#FC3F1D] text-white text-[10px] font-bold flex items-center justify-center shrink-0">Я</span>
                  <span>Мы на Яндекс Картах</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg text-white font-normal">Связь & Заказы</h4>
            <div className="space-y-2 text-xs font-light">
              <a
                href="tel:+79172563235"
                className="flex items-center gap-2 text-white hover:text-[#C5A880] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#C5A880]" />
                <span className="font-medium">+7 (917) 256-32-35</span>
              </a>

              <a
                href="https://wa.me/79172563235"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp: +7 (917) 256-32-35</span>
              </a>
            </div>
          </div>

          {/* Navigation & Categories with Real URLs */}
          <div className="space-y-3">
            <h4 className="font-serif text-lg text-white font-normal">Клиентам</h4>
            <ul className="space-y-2 text-xs font-light text-white/70 list-none p-0">
              <li>
                <a
                  href="/"
                  onClick={(e) => handleLink(e, '/', 'catalog')}
                  className="hover:text-white transition-colors"
                >
                  Каталог букетов
                </a>
              </li>
              <li>
                <a
                  href="/rozy/"
                  onClick={(e) => handleLink(e, '/rozy/')}
                  className="hover:text-white transition-colors"
                >
                  Розы в Нижнекамске
                </a>
              </li>
              <li>
                <a
                  href="/monobukety/"
                  onClick={(e) => handleLink(e, '/monobukety/')}
                  className="hover:text-white transition-colors"
                >
                  Монобукеты
                </a>
              </li>
              <li>
                <a
                  href="/dostavka/"
                  onClick={(e) => handleLink(e, '/dostavka/')}
                  className="hover:text-white transition-colors"
                >
                  Условия доставки
                </a>
              </li>
              <li>
                <a
                  href="/cart/"
                  onClick={(e) => handleLink(e, '/cart/', 'cart')}
                  className="hover:text-white transition-colors"
                >
                  Корзина
                </a>
              </li>
              <li>
                <a
                  href="/profile/"
                  onClick={(e) => handleLink(e, '/profile/', 'profile')}
                  className="hover:text-white transition-colors"
                >
                  Личный кабинет & Скидки
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsRequisitesOpen(true)}
                  className="hover:text-[#C5A880] text-white/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Реквизиты и оплата</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenCrm}
                  className="hover:text-[#C5A880] text-[#C5A880]/90 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Панель управления (CRM)</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Compliance Banner for Sberbank Acquiring */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-white/50 font-light text-center md:text-left">
          <div>
            <span>ИП Обручников Дмитрий Владимирович • ИНН 165115143005 • ОГРНИП 324169000033624</span>
            <span className="block text-white/40 mt-0.5">
              Расчётный счёт в ПАО Сбербанк • Оплата онлайн картами МИР, Visa, Mastercard и через СБП
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsRequisitesOpen(true)}
            className="text-[#C5A880] hover:underline cursor-pointer shrink-0"
          >
            Все реквизиты салона →
          </button>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-light">
          <button
            type="button"
            onClick={onOpenCrm}
            className="hover:text-white/60 transition-colors text-left cursor-pointer"
            title="Салон цветов «София»"
          >
            © 2026 Салон цветов «София». Все права защищены.
          </button>
          <a
            href="https://yandex.ru/maps/org/sofiya/105599949171"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/70 transition-colors"
            title="Салон на Яндекс Картах"
          >
            г. Нижнекамск, пр. Шинников, 13В
          </a>
        </div>
      </div>

      {/* Official Sberbank & Tax Requisites Modal */}
      <RequisitesModal
        isOpen={isRequisitesOpen}
        onClose={() => setIsRequisitesOpen(false)}
      />
    </footer>
  );
};
