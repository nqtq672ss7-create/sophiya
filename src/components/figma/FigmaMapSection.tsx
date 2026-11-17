import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Phone, Navigation } from 'lucide-react';
import { MaxIcon } from '../common/MaxIcon';
import { SALON_MAX_URL } from '../../config/contacts';

export const FigmaMapSection: React.FC = () => {
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldLoadMap) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadMap(true);
      return;
    }
    const el = mapContainerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoadMap]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-8 font-sans text-[#1C1215] select-none">
      <div className="bg-white rounded-xl border border-[#E5DDD9] p-6 sm:p-8 lg:p-10 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Salon Info & Route Actions */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#922E3D]/10 text-[#922E3D] text-xs font-semibold tracking-wide">
                <MapPin className="w-3.5 h-3.5" />
                <span>Салон в Нижнекамске</span>
              </div>

              <h2 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold leading-tight">
                Ждём вас на проспекте Шинников, 13В
              </h2>

              <p className="text-xs sm:text-sm text-[#5C454C] font-normal leading-relaxed">
                Приходите выбрать букет вживую или оформите заказ с доставкой по городу от 30 минут. 
                Перед выездом курьера отправляем контрольное фото собранной композиции в MAX.
              </p>

              <div className="space-y-3 pt-2 text-xs text-[#5C454C]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F5] flex items-center justify-center shrink-0 text-[#922E3D]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-[#1C1215] block">Адрес салона:</span>
                    <span className="text-[#5C454C] font-light">г. Нижнекамск, пр. Шинников, д. 13В</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F5] flex items-center justify-center shrink-0 text-[#922E3D]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-[#1C1215] block">Режим работы:</span>
                    <span className="text-[#5C454C] font-light">Ежедневно с 08:00 до 21:00 без выходных</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F5] flex items-center justify-center shrink-0 text-[#922E3D]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-medium text-[#1C1215] block">Телефон салона:</span>
                    <a
                      href="tel:+79172563235"
                      className="text-[#922E3D] font-medium hover:underline block"
                    >
                      +7 (917) 256-32-35
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E5DDD9]">
              <a
                href="https://yandex.ru/maps/org/sofiya/105599949171"
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white font-medium text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
                title="Открыть на Яндекс Картах и построить маршрут"
              >
                <Navigation className="w-4 h-4" />
                <span>Построить маршрут</span>
              </a>

              <a
                href={SALON_MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-[#922E3D]/10 hover:bg-[#922E3D]/20 text-[#922E3D] border border-[#922E3D]/20 font-medium text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
              >
                <MaxIcon className="w-4 h-4" />
                <span>Чат в MAX</span>
              </a>
            </div>
          </div>

          {/* Right Column: Embedded Official Yandex Map Widget (lazy-loaded on viewport/click) */}
          <div
            ref={mapContainerRef}
            className="lg:col-span-7 relative min-h-[360px] sm:min-h-[420px] rounded-xl overflow-hidden border border-[#E5DDD9] bg-[#FAF7F5] shadow-inner"
          >
            {shouldLoadMap ? (
              <iframe
                src="https://yandex.ru/map-widget/v1/org/sofiya/105599949171"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen={true}
                loading="lazy"
                title="Салон цветов «София» на Яндекс Картах"
                className="absolute inset-0 w-full h-full border-0 rounded-xl"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FAF7F5] space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#922E3D]/10 text-[#922E3D] flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <div className="text-sm sm:text-base font-semibold text-[#1C1215]">
                    Салон цветов «София» на Яндекс Картах
                  </div>
                  <p className="text-xs text-[#5C454C]">
                    г. Нижнекамск, пр. Шинников, д. 13В, ежедневно 08:00–21:00
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShouldLoadMap(true)}
                    className="py-2.5 px-4 rounded-xl bg-[#922E3D] hover:bg-[#611720] text-white font-medium text-xs transition-colors shadow-sm cursor-pointer active:scale-95"
                  >
                    Показать интерактивную карту
                  </button>
                  <a
                    href="https://yandex.ru/maps/org/sofiya/105599949171"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-xl bg-white hover:bg-[#EFE7E3] border border-[#E5DDD9] text-[#1C1215] font-medium text-xs transition-colors"
                  >
                    Открыть в Яндекс Картах
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
