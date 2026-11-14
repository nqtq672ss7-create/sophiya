import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Heart, Sparkles, MapPin, Clock, Droplets, Calendar, Flower2, Check, ArrowRight } from 'lucide-react';
import { SeoRoute, getRouteByPath } from '../../utils/routes';

interface FigmaSeoSectionProps {
  currentRoute?: SeoRoute;
}

export const FigmaSeoSection: React.FC<FigmaSeoSectionProps> = ({ currentRoute: propRoute }) => {
  const [pathname, setPathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));

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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-[#E5DDD9] font-sans text-[#1C1215]">
      {/* 1. Feature Highlights (4 Clean Luxury Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        <div className="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm hover:shadow-md transition-shadow space-y-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#922E3D]/10 text-[#922E3D] group-hover:bg-[#922E3D] group-hover:text-white transition-colors flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-[#1C1215] font-semibold">
            Доставка от 30 минут
          </h3>
          <p className="text-xs text-[#5C454C] font-normal leading-relaxed">
            Срочная доставка по районам Нижнекамска в аквабоксах с водой. Букет приезжает свежим в любую погоду.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm hover:shadow-md transition-shadow space-y-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#922E3D]/10 text-[#922E3D] group-hover:bg-[#922E3D] group-hover:text-white transition-colors flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-[#1C1215] font-semibold">
            Фото в WhatsApp до выезда
          </h3>
          <p className="text-xs text-[#5C454C] font-normal leading-relaxed">
            Флорист отправляет детальный снимок собранной композиции в WhatsApp заказчику перед передачей курьеру.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm hover:shadow-md transition-shadow space-y-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#922E3D]/10 text-[#922E3D] group-hover:bg-[#922E3D] group-hover:text-white transition-colors flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-[#1C1215] font-semibold">
            Дизайнерская упаковка
          </h3>
          <p className="text-xs text-[#5C454C] font-normal leading-relaxed">
            Лаконичные матовые материалы, фактурная корейская плёнка и плотные атласные ленты в цвет бутона.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white text-[#1C1215] border border-[#E5DDD9] shadow-sm hover:shadow-md transition-shadow space-y-2 group">
          <div className="w-10 h-10 rounded-xl bg-[#922E3D]/10 text-[#922E3D] group-hover:bg-[#922E3D] group-hover:text-white transition-colors flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-[#1C1215] font-semibold">
            Стойкость от 10 до 14 дней
          </h3>
          <p className="text-xs text-[#5C454C] font-normal leading-relaxed">
            Прямые поставки отборной срезки каждые 2–3 дня. Пакетик подкормки Chrysal прилагается к каждому букету.
          </p>
        </div>
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

      {/* 3. Main Narrative: Occasion Page Context */}
      {isOccasionPage && currentRoute && (
        <div className="space-y-6 bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#922E3D]/10 text-[#922E3D] text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>Повод: {currentRoute.breadcrumbLabel}</span>
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
      {!isDeliveryPage && !isOccasionPage && (
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

          {/* 3 Refined Editorial Cards (Zero Slop / Luxury Editorial Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* Card 1: Delivery by Districts */}
            <div className="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#922E3D]/10 text-[#922E3D] flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#922E3D] bg-[#922E3D]/10 px-3 py-1 rounded-md">
                    08:00 – 21:00
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#1C1215] leading-snug">
                    Доставка цветов по районам города
                  </h3>
                  <p className="text-xs text-[#5C454C] leading-relaxed mt-1">
                    Курьеры салона доставляют букеты ежедневно с интервалом от 30 до 60 минут с момента сборки.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1215]">Центр и жилые микрорайоны</div>
                      <div className="text-[11px] text-[#7C636B] leading-tight">Шинников, Мира, Строителей, Сююмбике, Химиков</div>
                    </div>
                    <span className="text-xs font-bold text-[#922E3D] shrink-0">300 ₽</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1215]">Пригородные посёлки</div>
                      <div className="text-[11px] text-[#7C636B] leading-tight">Красный Ключ, Большое и Нижнее Афанасово</div>
                    </div>
                    <span className="text-xs font-bold text-[#922E3D] shrink-0">450 ₽</span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1215]">Промзона и предприятия</div>
                      <div className="text-[11px] text-[#7C636B] leading-tight">БСИ, ТАНЕКО, НКНХ, ТАИФ-НК к точному часу</div>
                    </div>
                    <span className="text-xs font-bold text-[#922E3D] shrink-0">500 ₽</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DDD9] text-[11px] text-[#7C636B] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Бесплатная доставка при заказе от 4 500 ₽</span>
              </div>
            </div>

            {/* Card 2: Occasions */}
            <div className="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#922E3D]/10 text-[#922E3D] flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#922E3D] bg-[#922E3D]/10 px-3 py-1 rounded-md">
                    Под любой повод
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#1C1215] leading-snug">
                    Букеты под любые поводы и события
                  </h3>
                  <p className="text-xs text-[#5C454C] leading-relaxed mt-1">
                    Шеф-флористы «Софии» подбирают сортовой состав, гамму и упаковку под атмосферу события:
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-[#1C1215]">
                      <span>День рождения, юбилей</span>
                      <span className="text-[10px] text-amber-700 font-medium px-2 py-0.5 rounded-md bg-amber-50">Выбор гостей</span>
                    </div>
                    <p className="text-[11px] text-[#7C636B] leading-tight">
                      Пышные сеты с французскими розами, гортензиями, а также монобукеты из 25, 51 или 101 розы.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] space-y-1">
                    <div className="text-xs font-bold text-[#1C1215]">Свадьба, поздравление</div>
                    <p className="text-[11px] text-[#7C636B] leading-tight">
                      Букеты невесты, бутоньерки жениха и подарочные шляпные коробки в светлой пастельной гамме.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] space-y-1">
                    <div className="text-xs font-bold text-[#1C1215]">8 Марта, 14 Февраля</div>
                    <p className="text-[11px] text-[#7C636B] leading-tight">
                      Сортовые тюльпаны, мимоза, алые эквадорские розы Explorer и Red Naomi с фирменной открыткой.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DDD9] text-[11px] text-[#7C636B] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Фото собранной композиции в WhatsApp до выезда</span>
              </div>
            </div>

            {/* Card 3: Flower Care Guide */}
            <div className="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#922E3D]/10 text-[#922E3D] flex items-center justify-center">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-md">
                    10–14 дней стойкости
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#1C1215] leading-snug">
                    Памятка по уходу за срезанными цветами
                  </h3>
                  <p className="text-xs text-[#5C454C] leading-relaxed mt-1">
                    Соблюдение четырёх простых правил продлит радость от цветов в вазе до двух недель:
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#922E3D] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1215]">Косой срез под 45°</div>
                      <p className="text-[11px] text-[#7C636B] leading-tight">
                        Срежьте стебли на 1,5–2 см острым ножом перед постановкой в воду.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#922E3D] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1215]">Чистая вода и Chrysal</div>
                      <p className="text-[11px] text-[#7C636B] leading-tight">
                        Используйте прохладную воду и пакетик Chrysal, прилагаемый в подарок.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#922E3D] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#1C1215]">Снятие нижних листьев</div>
                      <p className="text-[11px] text-[#7C636B] leading-tight">
                        Удалите листву в воде, чтобы вода не зацветала и оставалась прозрачной.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E5DDD9] text-[11px] text-[#7C636B] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Подкормка Chrysal бесплатно к каждому букету</span>
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
    </section>
  );
};
