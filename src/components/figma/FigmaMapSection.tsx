import React from 'react';
import { MapPin, Clock, Phone, Navigation, MessageSquare } from 'lucide-react';

export const FigmaMapSection: React.FC = () => {
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
                Перед выездом курьера отправляем контрольное фото собранной композиции в WhatsApp.
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
                href="https://wa.me/79172563235?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%A5%D0%BE%D1%87%D1%83%20%D1%83%D1%82%D0%BE%D1%87%D0%BD%D0%B8%D1%82%D1%8C%20%D0%BD%D0%B0%D0%BB%D0%B8%D1%87%D0%B8%D0%B5%20%D1%86%D0%B2%D0%B5%D1%82%D0%BE%D0%B2%20%D0%B2%20%D1%81%D0%B0%D0%BB%D0%BE%D0%BD%D0%B5."
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm text-center flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Чат в WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Right Column: Embedded Official Yandex Map Widget */}
          <div className="lg:col-span-7 relative min-h-[360px] sm:min-h-[420px] rounded-xl overflow-hidden border border-[#E5DDD9] bg-[#FAF7F5] shadow-inner">
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
          </div>
        </div>
      </div>
    </section>
  );
};
