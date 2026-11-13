import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Heart, Sparkles, MapPin, Clock, Droplets, Calendar, Flower2 } from 'lucide-react';
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
      {/* 1. Feature Highlights (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        <div className="p-5 rounded-xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-white font-bold">
            Доставка от 30 минут
          </h3>
          <p className="text-xs text-white/85 font-normal leading-relaxed">
            Срочная доставка по районам Нижнекамска в аквабоксах с водой. Букет приезжает свежим в любую погоду.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-white font-bold">
            Фото в WhatsApp до выезда
          </h3>
          <p className="text-xs text-white/85 font-normal leading-relaxed">
            Флорист отправляет детальный снимок собранной композиции в WhatsApp заказчику перед передачей курьеру.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
            <Heart className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-white font-bold">
            Дизайнерская упаковка
          </h3>
          <p className="text-xs text-white/85 font-normal leading-relaxed">
            Лаконичные матовые материалы, фактурная корейская плёнка и плотные атласные ленты в цвет бутона.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-rose-texture-card text-white border border-[#8C1B2F]/70 shadow-md space-y-2">
          <div className="w-9 h-9 rounded-xl bg-white/10 text-amber-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-sans text-base text-white font-bold">
            Стойкость от 10 до 14 дней
          </h3>
          <p className="text-xs text-white/85 font-normal leading-relaxed">
            Прямые поставки отборной срезки каждые 2–3 дня. Пакетик подкормки Chrysal прилагается к каждому букету.
          </p>
        </div>
      </div>

      {/* 2. Main Narrative: Delivery Page Context */}
      {isDeliveryPage && (
        <div className="space-y-8 bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#6C1E26]/10 text-[#6C1E26] text-xs font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>Зоны и условия доставки в Нижнекамске</span>
            </div>
            <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
              Курьерская доставка цветов по районам Нижнекамска
            </h2>
            <p className="text-xs sm:text-sm text-[#5C454C] leading-relaxed max-w-3xl">
              Собственная служба доставки салона «София» привозит цветы с 08:00 до 21:00 без выходных. Все композиции транспортируются в вертикальном положении в аквабоксах с водой, сохраняя свежесть срезки. Зимой используется дополнительная термозащита.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] space-y-3">
              <div className="text-xs font-bold text-[#6C1E26] uppercase tracking-wider">Зона 1: Центр и микрорайоны</div>
              <h3 className="text-base font-semibold text-[#1C1215]">30–60 минут — 300 ₽</h3>
              <p className="text-xs text-[#5C454C] leading-relaxed">
                Пр. Шинников, пр. Мира, пр. Строителей, пр. Сююмбике, пр. Химиков, ул. Баки Урманче, ул. Чулман, ул. Табеева. При заказе от 4 500 ₽ доставка бесплатная.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] space-y-3">
              <div className="text-xs font-bold text-[#6C1E26] uppercase tracking-wider">Зона 2: Пригородные посёлки</div>
              <h3 className="text-base font-semibold text-[#1C1215]">45–75 минут — 450 ₽</h3>
              <p className="text-xs text-[#5C454C] leading-relaxed">
                Посёлок Красный Ключ, Большое Афанасово, Нижнее Афанасово, Дмитриевка, Ильинка. Курьер вручает букет лично в руки получателю.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[#FAF7F5] border border-[#E5DDD9] space-y-3">
              <div className="text-xs font-bold text-[#6C1E26] uppercase tracking-wider">Зона 3: Предприятия и БСИ</div>
              <h3 className="text-base font-semibold text-[#1C1215]">К точному часу — 500 ₽</h3>
              <p className="text-xs text-[#5C454C] leading-relaxed">
                Промзона, БСИ, проходные заводов ПАО «Нижнекамскнефтехим», ТАНЕКО, ТАИФ-НК. Пунктуальная подача к окончанию рабочей смены или корпоративу.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Narrative: Occasion Page Context */}
      {isOccasionPage && currentRoute && (
        <div className="space-y-6 bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#6C1E26]/10 text-[#6C1E26] text-xs font-semibold">
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

      {/* 4. Comprehensive 3-Part Homepage SEO Narrative (~400 words) */}
      {!isDeliveryPage && !isOccasionPage && (
        <div className="space-y-12 mb-12">
          {/* Header block with salon NAP */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#6C1E26]/10 text-[#6C1E26] text-xs font-semibold">
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

          {/* 3 Editorial Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Column 1: Delivery by Districts */}
            <div className="bg-white rounded-xl border border-[#E5DDD9] p-6 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#6C1E26]/10 text-[#6C1E26] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#1C1215] leading-snug">
                Доставка цветов по районам города
              </h3>
              <p className="text-xs sm:text-sm text-[#5C454C] leading-relaxed">
                Курьеры салона доставляют букеты ежедневно с 08:00 до 21:00. Средний интервал доставки составляет от 30 до 60 минут с момента сборки.
              </p>
              <ul className="space-y-2 text-xs text-[#5C454C] leading-relaxed list-none p-0">
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">Центр и жилые кварталы (300 ₽)</strong>
                  Пр. Шинников, Мира, Строителей, Сююмбике, Химиков, ул. Баки Урманче, Чулман, Табеева. При сумме заказа от 4 500 ₽ доставка бесплатна.
                </li>
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">Пригородные посёлки (450 ₽)</strong>
                  Красный Ключ, Большое Афанасово, Нижнее Афанасово, Дмитриевка, Ильинка (45–75 минут).
                </li>
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">Промзона и предприятия (500 ₽)</strong>
                  БСИ, проходные и корпуса ПАО «Нижнекамскнефтехим», ТАНЕКО, ТАИФ-НК точно к назначенному времени.
                </li>
              </ul>
              <p className="text-xs text-[#7C636B] leading-relaxed pt-1">
                Цветы перевозятся в вертикальных аквабоксах с водой. Перед отправкой флорист отправляет контрольное фото букета в WhatsApp.
              </p>
            </div>

            {/* Column 2: Occasions */}
            <div className="bg-white rounded-xl border border-[#E5DDD9] p-6 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#6C1E26]/10 text-[#6C1E26] flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#1C1215] leading-snug">
                Букеты под любые поводы и события
              </h3>
              <p className="text-xs sm:text-sm text-[#5C454C] leading-relaxed">
                Флористы салона «София» подбирают состав букета, цветовую палитру и упаковку под специфику вашего повода:
              </p>
              <ul className="space-y-2 text-xs text-[#5C454C] leading-relaxed list-none p-0">
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">День рождения и юбилей</strong>
                  Пышные сборные сеты с французскими розами, гортензиями, эустомой, а также монобукеты из 25, 51 или 101 розы.
                </li>
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">Свадьба и поздравление молодоженов</strong>
                  Букеты невесты, бутоньерки жениха и подарочные композиции в шляпных коробках в светлой пастельной гамме.
                </li>
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">8 Марта и 14 Февраля</strong>
                  Сортовые тюльпаны, весенняя мимоза, алые эквадорские розы сортов Explorer и Red Naomi с открыткой-признанием.
                </li>
              </ul>
              <p className="text-xs text-[#7C636B] leading-relaxed pt-1">
                Также собираем компактные букеты ко Дню знаний (1 Сентября), Дню матери, Дню учителя и лаконичные комплименты без повода.
              </p>
            </div>

            {/* Column 3: Flower Care Guide */}
            <div className="bg-white rounded-xl border border-[#E5DDD9] p-6 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#6C1E26]/10 text-[#6C1E26] flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#1C1215] leading-snug">
                Памятка по уходу за срезанными цветами
              </h3>
              <p className="text-xs sm:text-sm text-[#5C454C] leading-relaxed">
                Соблюдение пяти базовых правил позволяет продлить стойкость цветов в домашней вазе от 10 до 14 дней:
              </p>
              <ul className="space-y-2 text-xs text-[#5C454C] leading-relaxed list-none p-0">
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">1. Косой срез под 45°</strong>
                  Перед погружением в воду срежьте стебли на 1,5–2 см чистым острым ножом или секатором. Ножницы пережимают капилляры.
                </li>
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">2. Чистая вода и Chrysal</strong>
                  Используйте прохладную воду. Растворите пакетик подкормки Chrysal, который прилагается в подарок к заказу.
                </li>
                <li className="p-2.5 rounded-lg bg-[#FAF7F5] border border-[#E5DDD9]">
                  <strong className="text-[#1C1215] block mb-0.5">3. Удаление нижних листьев</strong>
                  Снимите со стебля все листья, соприкасающиеся с водой, чтобы предотвратить гниение и размножение бактерий.
                </li>
              </ul>
              <p className="text-xs text-[#7C636B] leading-relaxed pt-1">
                Не ставьте вазу рядом с батареями отопления, на сквозняках и около спелых фруктов. Меняйте воду каждые 24–48 часов.
              </p>
            </div>
          </div>

          {/* Quick NAP Footer with Map Link */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E5DDD9] text-xs text-[#7C636B]">
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="https://yandex.ru/maps/org/sofiya/105599949171"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[#5C454C] hover:text-[#6C1E26] transition-colors"
                title="Салон «София» на Яндекс Картах"
              >
                <MapPin className="w-4 h-4 text-[#6C1E26]" />
                <span className="underline decoration-[#E5DDD9]">г. Нижнекамск, пр. Шинников, 13В на Яндекс Картах</span>
              </a>
              <div className="flex items-center gap-1.5 text-[#5C454C]">
                <Clock className="w-4 h-4 text-[#6C1E26]" />
                <span>08:00 – 21:00 ежедневно</span>
              </div>
            </div>
            <a
              href="tel:+79172563235"
              className="font-semibold text-[#6C1E26] hover:underline"
            >
              +7 (917) 256-32-35
            </a>
          </div>
        </div>
      )}
    </section>
  );
};
