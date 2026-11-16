import React, { useState } from 'react';
import { Phone, MapPin, Clock, MessageSquare, Lock, ExternalLink } from 'lucide-react';
import { FigmaTab } from './FigmaBottomNav';
import { RequisitesModal } from '../payment/RequisitesModal';
import { YandexIcon } from '../common/YandexIcon';
import { MaxIcon } from '../common/MaxIcon';
import { SALON_MAX_URL } from '../../config/contacts';

interface FigmaFooterProps {
  onTabChange: (tab: FigmaTab) => void;
  onOpenCrm?: () => void;
  onNavigate?: (path: string, options?: { tab?: FigmaTab }) => void;
  onOpenLegal?: (tab: 'privacy'|'offer'|'refund'|'cookie') => void;
}

export const FigmaFooter: React.FC<FigmaFooterProps> = ({
  onTabChange,
  onNavigate,
  onOpenLegal,
}) => {
  const [isRequisitesOpen, setIsRequisitesOpen] = useState(false);

  const handleLink = (e: React.MouseEvent, path: string, tab?: FigmaTab) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path, tab ? { tab } : undefined);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab) {
      onTabChange(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const usefulLinks = [
    { label: 'О салоне «София»', path: '/o-salone/' },
    { label: 'Условия доставки', path: '/dostavka/' },
    { label: 'Отзывы покупателей', path: '/otzyvy/' },
    { label: 'Блог о цветах', path: '/blog/' },
    { label: 'Частые вопросы (FAQ)', path: '/faq/' },
    { label: 'Контакты и схема проезда', path: '/kontakty/' },
    { label: 'Корзина заказов', path: '/cart/', tab: 'cart' as FigmaTab },
    { label: 'Личный кабинет и бонусы', path: '/profile/', tab: 'profile' as FigmaTab },
  ];

  const deliveryDistricts = [
    'Пр. Шинников',
    'Пр. Мира',
    'Пр. Строителей',
    'Ул. Сююмбике',
    'Пр. Химиков',
    'Красный Ключ',
    'Б. Афанасово',
    'Н. Афанасово',
    'ТАНЕКО / БСИ',
    'НКНХ / ТАИФ-НК',
  ];

  const popularCategories = [
    { label: 'Розы в Нижнекамске', path: '/rozy/' },
    { label: 'Свадебные букеты', path: '/svadebnye-bukety/' },
    { label: 'Монобукеты', path: '/monobukety/' },
    { label: 'Пионы', path: '/piony/' },
    { label: 'Авторские букеты', path: '/avtorskie-bukety/' },
    { label: 'Хризантемы', path: '/hrizantemy/' },
    { label: 'Цветы в коробке', path: '/cvety-v-korobke/' },
    { label: 'Корзины цветов', path: '/korziny-cvetov/' },
    { label: 'Комнатные растения', path: '/gorshechnye-rasteniya/' },
    { label: 'На день рождения', path: '/na-den-rozhdeniya/' },
  ];

  const qrUrl =
    'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fxn----ctbjn3arftl7c8b.xn--p1ai&color=1C1215&bgcolor=FFFFFF&margin=6';

  return (
    <footer className="relative w-full overflow-hidden bg-[#121C19] text-white/85 font-sans border-t border-white/10 mt-20 pb-24 md:pb-10 pt-14">
      {/* Atmospheric Botanical Floral Backdrop (Flowwow-inspired) */}
      <img
        src="/rose-petals-dark.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none select-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#101C18]/80 pointer-events-none"
      />

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-Zone Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/15">
          {/* Column 1: Brand + Quick Florist CTA + Salon Office */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo-light.png"
                alt="Салон цветов София"
                className="h-12 w-auto object-contain"
              />
              <div>
                <span className="text-xs uppercase tracking-[0.22em] font-bold text-white block leading-tight">
                  София
                </span>
                <span className="text-[11px] text-[#C5A880] font-medium">
                  Салон цветов, Нижнекамск
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-white">Индивидуальный подбор</div>
              <p className="text-xs text-white/70 leading-relaxed font-light max-w-xs">
                Подберём свежие цветы под ваш бюджет и пришлём фото букета перед отправкой.
              </p>
              <a
                href={SALON_MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6C1E26] hover:bg-[#8E2433] text-white text-xs font-semibold transition-colors shadow-lg active:scale-95"
              >
                <MaxIcon className="w-4 h-4" />
                <span>Написать в MAX</span>
              </a>
            </div>

            <div className="space-y-1.5 text-xs text-white/75 pt-2">
              <div className="font-semibold text-white mb-1">Салон в Нижнекамске</div>
              <a
                href="https://yandex.ru/maps/org/sofiya/105599949171"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 hover:text-white transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C5A880] shrink-0 mt-0.5" />
                <span>г. Нижнекамск, пр. Шинников, 13В</span>
              </a>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <span>Ежедневно: 08:00 – 21:00</span>
              </div>
              <a
                href="tel:+79172563235"
                className="flex items-center gap-2 text-white hover:text-[#C5A880] transition-colors pt-1 font-medium"
              >
                <Phone className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <span>+7 (917) 256-32-35</span>
              </a>
            </div>
          </div>

          {/* Column 2 & 3 Center Area: Useful Links + Delivery Districts + Popular Categories */}
          <div className="lg:col-span-6 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Useful Links */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3.5">Полезные ссылки</h4>
                <ul className="space-y-2 text-xs text-white/75 list-none p-0 m-0">
                  {usefulLinks.map((item) => (
                    <li key={item.path}>
                      <a
                        href={item.path}
                        onClick={(e) => handleLink(e, item.path, item.tab)}
                        className="hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        <span>{item.label}</span>
                      </a>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => setIsRequisitesOpen(true)}
                      className="text-[#C5A880] hover:text-white transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <span>Реквизиты и оплата</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </li>
                </ul>
              </div>

              {/* Delivery Districts (2 columns like Flowwow Cities) */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3.5">Районы доставки</h4>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-white/75 list-none p-0 m-0">
                  {deliveryDistricts.map((district) => (
                    <li key={district}>
                      <a
                        href="/dostavka/"
                        onClick={(e) => handleLink(e, '/dostavka/')}
                        className="hover:text-white transition-colors"
                      >
                        {district}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Popular Categories (2 columns below, matching Flowwow layout) */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3.5">Популярные категории</h4>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-white/75 list-none p-0 m-0">
                {popularCategories.map((cat) => (
                  <li key={cat.path}>
                    <a
                      href={cat.path}
                      onClick={(e) => handleLink(e, cat.path)}
                      className="hover:text-white transition-colors"
                    >
                      {cat.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Right QR Code Card (Flowwow Signature Block) */}
          <div className="lg:col-span-3 flex flex-col lg:items-end">
            <div className="w-full max-w-[260px] space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-white leading-snug">
                  Ещё удобнее заказывать с телефона!
                </h4>
                <p className="text-xs text-white/70 font-light mt-1 leading-relaxed">
                  Наведите камеру, чтобы открыть витрину салона и сохранить в закладки
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 text-center shadow-xl">
                <div className="relative w-36 h-36 mx-auto bg-white flex items-center justify-center">
                  <img
                    src={qrUrl}
                    alt="QR-код сайта цветы-софия.рф"
                    width={144}
                    height={144}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  <div className="absolute w-7 h-7 rounded-lg bg-white p-1 shadow-sm flex items-center justify-center border border-[#E5DDD9]">
                    <img src="/logo.png" alt="" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="text-[11px] text-[#1C1215] font-medium mt-2">
                  Наведите камеру на QR-код
                </div>

                {/* Quick Channels Row */}
                <div className="flex items-center justify-center gap-2 mt-3 pt-2.5 border-t border-[#EFE7E3]">
                  <a
                    href={SALON_MAX_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-[#5B4BFF] hover:bg-[#4636E3] text-white flex items-center justify-center transition-colors"
                    title="Написать в MAX"
                    aria-label="MAX"
                  >
                    <MaxIcon className="w-4 h-4" />
                  </a>
                  <a
                    href="tel:+79172563235"
                    className="w-8 h-8 rounded-lg bg-[#922E3D] hover:bg-[#6C1E26] text-white flex items-center justify-center transition-colors"
                    title="Позвонить в салон"
                    aria-label="Позвонить"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://yandex.ru/maps/org/sofiya/105599949171"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-[#FAF7F5] hover:bg-[#EFE7E3] border border-[#E5DDD9] flex items-center justify-center transition-colors"
                    title="Мы на Яндекс Картах"
                    aria-label="Яндекс Карты"
                  >
                    <YandexIcon className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleLink({ preventDefault: () => {} } as any, '/cart/', 'cart')}
                    className="w-8 h-8 rounded-lg bg-[#1C1215] hover:bg-[#3A252C] text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Написать менеджеру"
                    aria-label="Обратная связь"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal, Requisites & Payment Badges Row */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs text-white/70">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="font-medium text-white">© 2026 Салон цветов «София»</span>
              <button
                type="button"
                onClick={() => onOpenLegal?.('privacy')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Политика 152-ФЗ
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal?.('offer')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Публичная оферта
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal?.('refund')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Правила возврата
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal?.('cookie')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Cookie
              </button>
              <button
                type="button"
                onClick={() => setIsRequisitesOpen(true)}
                className="text-[#C5A880] hover:underline cursor-pointer"
              >
                Реквизиты ИП
              </button>
              <a
                href="/admin/"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = '#admin';
                }}
                className="hover:text-[#C5A880] text-white/60 transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Вход в панель управления для владелицы салона"
              >
                <Lock className="w-3 h-3 text-[#C5A880]" />
                <span>CRM</span>
              </a>
            </div>

            {/* Payment Method Badges (Matching Flowwow Bottom-Right) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[10px] font-bold tracking-wider text-white">
                VISA
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[10px] font-bold tracking-wider text-white">
                Mastercard
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[10px] font-bold tracking-wider text-emerald-400">
                МИР
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[10px] font-bold tracking-wider text-[#C5A880]">
                СБП
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-700/80 border border-emerald-500/40 text-[10px] font-bold tracking-wider text-white">
                SberPay
              </span>
            </div>
          </div>

          <div className="text-[11px] text-white/45 font-light leading-relaxed">
            ИП Обручников Дмитрий Владимирович, ИНН 165115143005, ОГРНИП 324169000033624. Расчётный счёт в ПАО Сбербанк.
          </div>
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
