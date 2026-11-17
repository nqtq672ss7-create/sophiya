import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Heart, Sparkles, MapPin, Clock, Droplets, Calendar, Flower2, Check, Plus, Minus, Phone, CheckCircle2 } from 'lucide-react';
import { SeoRoute, getRouteByPath } from '../../utils/routes';
import { SALON_MAX_URL } from '../../config/contacts';

interface FigmaSeoSectionProps {
  currentRoute?: SeoRoute;
}

export const FigmaSeoSection: React.FC<FigmaSeoSectionProps> = ({ currentRoute: propRoute }) => {
  const [pathname, setPathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const [openAccordion, setOpenAccordion] = useState<number>(0);
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbComment, setCbComment] = useState('');
  const [cbAgreed, setCbAgreed] = useState(true);
  const [cbStatus, setCbStatus] = useState<'idle'|'sent'|'error'>('idle');
  const [cbError, setCbError] = useState('');

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.location.pathname !== pathname) {
        setPathname(window.location.pathname);
      }
    }, 400);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [pathname]);

  const currentRoute = propRoute || getRouteByPath(pathname);
  const isDeliveryPage = currentRoute?.slug === 'dostavka';
  const isOccasionPage = currentRoute?.pageType === 'occasion';
  const isCategorySubpage = currentRoute?.pageType === 'category' && currentRoute.path !== '/';
  const isInfoPage = currentRoute?.pageType === 'info' && !isDeliveryPage;

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cbPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setCbStatus('error');
      setCbError('Укажите корректный номер телефона для обратного звонка.');
      return;
    }
    if (!cbAgreed) {
      setCbStatus('error');
      setCbError('Подтвердите согласие на обработку персональных данных.');
      return;
    }
    setCbError('');
    setCbStatus('sent');
    try {
      const summary = `Заявка на обратный звонок: ${cbName.trim() || 'Клиент'}, тел: ${cbPhone.trim()}${cbComment.trim() ? `, комментарий: ${cbComment.trim()}` : ''}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(summary).catch(() => {});
      }
    } catch {}
  };

  const featureHighlights = [
    {
      metric: '30',
      unit: 'мин',
      badge: 'Аквабокс с водой',
      title: 'Доставка от 30 минут',
      description:
        'Срочная доставка по районам Нижнекамска в аквабоксах с водой. Букет приезжает свежим в любую погоду.',
      Icon: Truck,
    },
    {
      metric: '100%',
      unit: 'фото',
      badge: 'Контроль качества',
      title: 'Фото в MAX до выезда',
      description:
        'Флорист отправляет детальный снимок собранной композиции в MAX заказчику перед передачей курьеру.',
      Icon: ShieldCheck,
    },
    {
      metric: 'Премиум',
      unit: 'декор',
      badge: 'Корейская плёнка',
      title: 'Дизайнерская упаковка',
      description:
        'Лаконичные матовые материалы, фактурная корейская плёнка и плотные атласные ленты в цвет бутона.',
      Icon: Heart,
    },
    {
      metric: '10–14',
      unit: 'дней',
      badge: 'Chrysal в подарок',
      title: 'Стойкость букетов',
      description:
        'Прямые поставки отборной срезки каждые 2–3 дня. Пакетик подкормки Chrysal прилагается к каждому букету.',
      Icon: Sparkles,
    },
  ];

  return (
    <section className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 mt-14 pt-10 border-t border-[#E5DDD9] font-sans text-[#1C1215]">
      {/* 1. Feature Highlights (Hybrid: Swiss Typographic Panel + Split Badges) */}
      <div className="bg-white rounded-xl border border-[#E5DDD9] shadow-sm overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-[#EFE7E3] mb-14">
        {featureHighlights.map(({ metric, unit, badge, title, description, Icon }) => (
          <div
            key={title}
            className="p-5 sm:p-6 flex flex-col justify-between gap-4 hover:bg-[#FAF7F5]/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#922E3D] bg-[#FDF2F4] px-2 py-0.5 rounded-md mb-2">
                  {badge}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#922E3D] leading-none">
                    {metric}
                  </span>
                  <span className="text-xs font-semibold text-[#C5A880]">{unit}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FDF2F4] text-[#922E3D] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="font-sans text-sm sm:text-base text-[#1C1215] font-semibold mb-1">
                {title}
              </h3>
              <p className="text-xs text-[#5C454C] font-normal leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Main Narrative: Delivery Page Context */}
      {isDeliveryPage && (
        <div className="space-y-8 bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#922E3D]/10 text-[#922E3D] text-xs font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>Зоны и тарифы доставки в Нижнекамске</span>
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
              Курьерская доставка цветов по районам Нижнекамска
            </h2>
            <p className="text-xs sm:text-sm text-[#5C454C] leading-relaxed max-w-3xl">
              Собственная служба доставки салона «София» привозит цветы с 08:00 до 21:00 без выходных. Все композиции транспортируются в вертикальном положении в аквабоксах с водой, сохраняя свежесть срезки. Зимой используется дополнительная термозащита.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-6 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9]/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#922E3D] uppercase tracking-wider">Зона 1: Центр</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">30–60 мин</span>
              </div>
              <h3 className="text-lg font-bold text-[#1C1215]">300 ₽ <span className="text-xs font-normal text-[#7C636B]">(бесплатно от 4 500 ₽)</span></h3>
              <p className="text-xs text-[#5C454C] leading-relaxed">
                Пр. Шинников, пр. Мира, пр. Строителей, пр. Сююмбике, пр. Химиков, ул. Баки Урманче, ул. Чулман, ул. Табеева.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9]/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#922E3D] uppercase tracking-wider">Зона 2: Пригород</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">45–75 мин</span>
              </div>
              <h3 className="text-lg font-bold text-[#1C1215]">450 ₽</h3>
              <p className="text-xs text-[#5C454C] leading-relaxed">
                Посёлок Красный Ключ, Большое Афанасово, Нижнее Афанасово, Дмитриевка, Ильинка. Вручение букета лично в руки.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9]/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#922E3D] uppercase tracking-wider">Зона 3: Промзона</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">К точному часу</span>
              </div>
              <h3 className="text-lg font-bold text-[#1C1215]">500 ₽</h3>
              <p className="text-xs text-[#5C454C] leading-relaxed">
                БСИ, проходные заводов ПАО «Нижнекамскнефтехим», ТАНЕКО, ТАИФ-НК точно к окончанию смены или мероприятию.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Narrative: Category Subpage or Occasion Page Context */}
      {(isOccasionPage || isCategorySubpage) && currentRoute && (
        <div className="space-y-6 bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#922E3D]/10 text-[#922E3D] text-xs font-semibold">
              {isOccasionPage ? <Calendar className="w-3.5 h-3.5" /> : <Flower2 className="w-3.5 h-3.5" />}
              <span>{isOccasionPage ? `Повод: ${currentRoute.breadcrumbLabel}` : currentRoute.breadcrumbLabel}</span>
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
              {currentRoute.introHeading}
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-[#5C454C] leading-relaxed max-w-4xl">
            {currentRoute.introText.map((p: string, idx: number) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>
      )}

      {/* 4. Comprehensive 3-Part Homepage SEO Narrative (~400 words) — Redesigned Luxury Editorial Grid */}
      {!isDeliveryPage && !isOccasionPage && !isCategorySubpage && !isInfoPage && (
        <div className="space-y-10 mb-12">
          {/* Header block with salon NAP */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#922E3D]/10 text-[#922E3D] text-xs font-semibold">
              <Flower2 className="w-3.5 h-3.5" />
              <span>Салон цветов «София» в Нижнекамске</span>
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
              Купить свежие цветы в Нижнекамске с быстрой доставкой
            </h2>
            <p className="text-xs sm:text-sm text-[#5C454C] leading-relaxed">
              Салон цветов «София» на проспекте Шинников, дом 13В предлагает сортовые розы, авторские флористические композиции и сезонные цветы с курьерской доставкой по Нижнекамску от 30 минут. Каждая композиция собирается непосредственно под ваш заказ из свежей поставки.
            </p>
          </div>

          {/* Variant 5: Burgundy Logistics Card Left + Interactive Accordion Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
            {/* Left: Burgundy Logistics Card */}
            <div className="lg:col-span-5 bg-[#781F2A] text-white rounded-xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#E8D5B7]">
                    Доставка по Нижнекамску
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-black/25 text-[#E8D5B7]">
                    08:00 – 21:00
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug mb-2">
                  Привезём за 30–60 минут
                </h3>
                <p className="text-xs sm:text-[13px] text-white/85 leading-relaxed">
                  Бесплатная доставка при заказе от 4 500 ₽. Перед выездом курьера отправим фото готового букета в MAX.
                </p>
              </div>

              <div className="bg-black/25 rounded-xl p-4 space-y-3 border border-white/10">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">Центр и жилые микрорайоны</div>
                    <div className="text-[11px] text-white/70 mt-0.5">Шинников, Мира, Строителей, Сююмбике, Химиков</div>
                  </div>
                  <span className="font-bold text-[#E8D5B7] shrink-0">300 ₽</span>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">Пригородные посёлки</div>
                    <div className="text-[11px] text-white/70 mt-0.5">Красный Ключ, Большое и Нижнее Афанасово</div>
                  </div>
                  <span className="font-bold text-[#E8D5B7] shrink-0">450 ₽</span>
                </div>

                <div className="h-px bg-white/10" />

                <div className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">Промзона и предприятия</div>
                    <div className="text-[11px] text-white/70 mt-0.5">БСИ, ТАНЕКО, НКНХ, ТАИФ-НК к точному часу</div>
                  </div>
                  <span className="font-bold text-[#E8D5B7] shrink-0">500 ₽</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#E8D5B7] font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>Бережная доставка в аквабоксе с водой</span>
              </div>
            </div>

            {/* Right: Interactive Accordion */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* Accordion Item 1: Occasions */}
              <div
                className={`bg-white rounded-xl border transition-colors ${
                  openAccordion === 0 ? 'border-[#922E3D] shadow-sm' : 'border-[#E5DDD9]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 0 ? -1 : 0)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FDF2F4] text-[#922E3D] flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-sans text-sm sm:text-base font-semibold text-[#1C1215]">
                      Букеты под любые поводы и события
                    </span>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-[#FAF7F5] text-[#922E3D] flex items-center justify-center shrink-0">
                    {openAccordion === 0 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {openAccordion === 0 && (
                  <div className="px-5 pb-5 pt-1 space-y-2.5 text-xs text-[#5C454C] leading-relaxed border-t border-[#F1EAE6]">
                    <p>
                      <strong className="text-[#1C1215]">День рождения и юбилей:</strong> пышные сеты с французскими розами, гортензиями, а также монобукеты из 25, 51 или 101 розы.
                    </p>
                    <p>
                      <strong className="text-[#1C1215]">Свадьба и поздравление:</strong> букеты невесты, бутоньерки жениха и подарочные шляпные коробки в светлой пастельной гамме.
                    </p>
                    <p>
                      <strong className="text-[#1C1215]">8 Марта и 14 Февраля:</strong> сортовые тюльпаны, мимоза, алые эквадорские розы Explorer и Red Naomi с фирменной открыткой.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion Item 2: Care Guide */}
              <div
                className={`bg-white rounded-xl border transition-colors ${
                  openAccordion === 1 ? 'border-[#922E3D] shadow-sm' : 'border-[#E5DDD9]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 1 ? -1 : 1)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FDF2F4] text-[#922E3D] flex items-center justify-center shrink-0">
                      <Droplets className="w-4 h-4" />
                    </div>
                    <span className="font-sans text-sm sm:text-base font-semibold text-[#1C1215]">
                      Памятка по уходу за срезанными цветами (10–14 дней стойкости)
                    </span>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-[#FAF7F5] text-[#922E3D] flex items-center justify-center shrink-0">
                    {openAccordion === 1 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {openAccordion === 1 && (
                  <div className="px-5 pb-5 pt-2 space-y-2.5 text-xs text-[#5C454C] leading-relaxed border-t border-[#F1EAE6]">
                    <p>
                      <strong className="text-[#922E3D]">1. Косой срез под 45°:</strong> срежьте стебли на 1,5–2 см острым ножом перед постановкой в воду.
                    </p>
                    <p>
                      <strong className="text-[#922E3D]">2. Чистая вода и Chrysal:</strong> используйте прохладную воду и пакетик подкормки Chrysal, прилагаемый в подарок.
                    </p>
                    <p>
                      <strong className="text-[#922E3D]">3. Снятие нижних листьев:</strong> удалите листву, попадающую в воду, чтобы вода оставалась прозрачной.
                    </p>
                  </div>
                )}
              </div>

              {/* Accordion Item 3: Custom Photo Order */}
              <div
                className={`bg-white rounded-xl border transition-colors ${
                  openAccordion === 2 ? 'border-[#922E3D] shadow-sm' : 'border-[#E5DDD9]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenAccordion(openAccordion === 2 ? -1 : 2)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#FDF2F4] text-[#922E3D] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-sans text-sm sm:text-base font-semibold text-[#1C1215]">
                      Как заказать индивидуальную сборку по фото?
                    </span>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-[#FAF7F5] text-[#922E3D] flex items-center justify-center shrink-0">
                    {openAccordion === 2 ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                {openAccordion === 2 && (
                  <div className="px-5 pb-5 pt-2 space-y-2.5 text-xs text-[#5C454C] leading-relaxed border-t border-[#F1EAE6]">
                    <p>
                      Пришлите понравившийся пример букета или назовите бюджет в{' '}
                      <a href={SALON_MAX_URL} target="_blank" rel="noopener noreferrer" className="text-[#922E3D] font-semibold underline">
                        чат MAX
                      </a>{' '}
                      или по телефону{' '}
                      <a href="tel:+79172563235" className="text-[#922E3D] font-semibold underline">
                        +7 (917) 256-32-35
                      </a>
                      .
                    </p>
                    <p>
                      Шеф-флорист подберёт свежие цветы из сегодняшней поставки, соберёт композицию и пришлёт фото для согласования до выезда курьера.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick NAP Footer with Map Link */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E5DDD9] text-xs text-[#7C636B]">
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="https://yandex.ru/maps/org/sofiya/105599949171"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#5C454C] hover:text-[#922E3D] transition-colors"
                title="Салон «София» на Яндекс Картах"
              >
                <MapPin className="w-4 h-4 text-[#922E3D]" />
                <span className="underline decoration-[#E5DDD9]">г. Нижнекамск, пр. Шинников, 13В на Яндекс Картах</span>
              </a>
              <div className="flex items-center gap-1.5 text-[#5C454C]">
                <Clock className="w-4 h-4 text-[#922E3D]" />
                <span>08:00 – 21:00 ежедневно</span>
              </div>
            </div>
            <a
              href="tel:+79172563235"
              className="font-semibold text-[#922E3D] hover:underline"
            >
              +7 (917) 256-32-35
            </a>
          </div>
        </div>
      )}

      {/* 5. Quick Callback / Bouquet Request Form */}
      <div
        id="quick-request"
        className="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 shadow-sm mt-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#922E3D]/10 text-[#922E3D] text-xs font-semibold">
              <Phone className="w-3.5 h-3.5" />
              <span>Быстрая заявка флористу</span>
            </div>
            <h2 className="font-sans text-xl sm:text-2xl text-[#1C1215] font-semibold leading-snug">
              Подобрать букет или заказать обратный звонок
            </h2>
            <p className="text-xs sm:text-sm text-[#5C454C] leading-relaxed">
              Оставьте номер телефона и пожелания по поводу или бюджету — флорист салона «София» перезвонит за 5–10 минут и предложит свежие цветы из наличия.
            </p>
          </div>

          <div className="lg:col-span-7">
            {cbStatus === 'sent' ? (
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Заявка сформирована!</span>
                </div>
                <p className="text-xs text-emerald-900/85 leading-relaxed">
                  Для моментального ответа флориста нажмите «Написать в MAX» (текст заявки скопирован в буфер обмена) или позвоните по номеру{' '}
                  <a href="tel:+79172563235" className="font-semibold underline">
                    +7 (917) 256-32-35
                  </a>.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={SALON_MAX_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#5B4BFF] hover:bg-[#4636E3] text-white text-xs font-semibold transition-colors"
                  >
                    Написать в MAX
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setCbStatus('idle');
                      setCbComment('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-medium cursor-pointer"
                  >
                    Отправить ещё одну заявку
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cb-name" className="block text-[11px] font-medium text-[#5C454C] mb-1">
                      Ваше имя
                    </label>
                    <input
                      id="cb-name"
                      type="text"
                      value={cbName}
                      onChange={(e) => setCbName(e.target.value)}
                      placeholder="Например, Анна"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] text-xs sm:text-sm text-[#1C1215] focus:outline-none focus:border-[#922E3D]"
                    />
                  </div>
                  <div>
                    <label htmlFor="cb-phone" className="block text-[11px] font-medium text-[#5C454C] mb-1">
                      Телефон <span className="text-[#922E3D]">*</span>
                    </label>
                    <input
                      id="cb-phone"
                      type="tel"
                      required
                      value={cbPhone}
                      onChange={(e) => setCbPhone(e.target.value)}
                      placeholder="+7 (917) ___-__-__"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] text-xs sm:text-sm text-[#1C1215] focus:outline-none focus:border-[#922E3D]"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cb-comment" className="block text-[11px] font-medium text-[#5C454C] mb-1">
                    Повод, бюджет или пожелания по цветам
                  </label>
                  <input
                    id="cb-comment"
                    type="text"
                    value={cbComment}
                    onChange={(e) => setCbComment(e.target.value)}
                    placeholder="Например: розы до 4 000 ₽ на день рождения к 18:00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] text-xs sm:text-sm text-[#1C1215] focus:outline-none focus:border-[#922E3D]"
                  />
                </div>
                {cbError && (
                  <p className="text-xs text-[#922E3D] font-medium">{cbError}</p>
                )}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-start gap-2 text-[11px] text-[#5C454C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cbAgreed}
                      onChange={(e) => setCbAgreed(e.target.checked)}
                      className="mt-0.5 accent-[#922E3D]"
                    />
                    <span>
                      Согласен с{' '}
                      <a href="/privacy/" className="text-[#922E3D] underline">
                        политикой 152-ФЗ
                      </a>
                    </span>
                  </label>
                  <button
                    className="px-6 py-2.5 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white text-xs sm:text-sm font-semibold transition-colors shadow-sm cursor-pointer active:scale-95 shrink-0"
                  >
                    Заказать звонок флориста
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
