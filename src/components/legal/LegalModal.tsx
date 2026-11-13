import React, { useEffect } from 'react';
import { X, ShieldCheck, FileText, RotateCcw, Cookie } from 'lucide-react';

export type LegalDocTab = 'privacy'|'offer'|'refund'|'cookie';

interface LegalModalProps {
  isOpen: boolean;
  activeTab: LegalDocTab;
  onClose: () => void;
  onTabChange: (tab: LegalDocTab) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-5 select-none font-sans"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div
        className="relative w-full max-w-3xl bg-[#180B0D] text-white/90 border border-white/15 rounded-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#6C1E26] flex items-center justify-center text-[#C5A880]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#C5A880] font-semibold block">
                Правовая информация
              </span>
              <h2 id="legal-modal-title" className="text-base sm:text-lg font-medium text-white">
                Документы и соглашения салона «София»
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Закрыть модальное окно"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2 sm:px-6 bg-black/30 border-b border-white/10 flex flex-wrap gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('privacy')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#6C1E26] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Конфиденциальность 152-ФЗ</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('offer')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'offer'
                ? 'bg-[#6C1E26] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Публичная оферта</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('refund')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-[#6C1E26] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Возврат и гарантия</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('cookie')}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cookie'
                ? 'bg-[#6C1E26] text-white'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Файлы cookie</span>
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-white/80 font-light leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">
                  Политика в отношении обработки персональных данных
                </h3>
                <span className="text-xs text-white/50 block mt-1">
                  В соответствии с Федеральным законом № 152-ФЗ «О персональных данных» РФ
                </span>
              </div>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  1. Общие положения и оператор данных
                </h4>
                <p>
                  1.1. Настоящая Политика определяет порядок обработки и меры по обеспечению безопасности персональных данных, предпринимаемые Индивидуальным предпринимателем Обручниковым Дмитрием Владимировичем (ОГРНИП: 324169000033624, ИНН: 165115143005, адрес: Республика Татарстан, г. Нижнекамск, пр. Шинников, д. 13В, далее — «Оператор»).
                </p>
                <p>
                  1.2. Оператор обеспечивает соблюдение прав и свобод субъектов персональных данных при обработке их данных, включая защиту прав на неприкосновенность частной жизни, личную и семейную тайну.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  2. Категории обрабатываемых данных и цели
                </h4>
                <p>
                  2.1. Оператор собирает исключительно минимально необходимый объём данных для выполнения обязательств перед покупателем:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-white/70">
                  <li>Фамилия, имя, отчество покупателя и (при необходимости) получателя букета;</li>
                  <li>Номер контактного телефона (для согласования состава, отправки фотоконтроля и координации курьера);</li>
                  <li>Адрес доставки (улица, дом, подъезд, квартира/офис);</li>
                  <li>Дата рождения (по желанию клиента — исключительно для начисления праздничных бонусов клуба привилегий);</li>
                  <li>Текст поздравительной открытки (при заказе дополнительной услуги оформления).</li>
                </ul>
                <p>
                  2.2. Оператор не обрабатывает специальные категории персональных данных (сведения о расовой, национальной принадлежности, политических взглядах, состоянии здоровья) и биометрические персональные данные.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  3. Принципы обработки и безопасность
                </h4>
                <p>
                  3.1. Обработка персональных данных осуществляется на законной и справедливой основе. Базы данных с персональными данными граждан РФ размещены исключительно на серверах на территории Российской Федерации.
                </p>
                <p>
                  3.2. Оператор использует современные криптографические протоколы передачи данных (HTTPS, TLS 1.3), хеширование паролей и ограничение доступа сотрудников салона по ролевой модели.
                </p>
                <p>
                  3.3. Данные покупателей ни при каких условиях не передаются третьим лицам для маркетинговых или рекламных целей. Передача данных осуществляется исключительно курьерской службе в объёме адреса и телефона для вручения заказа.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  4. Срок хранения и право на забвение (отзыв согласия)
                </h4>
                <p>
                  4.1. Персональные данные обрабатываются до достижения целей их обработки либо до момента отзыва согласия субъектом данных.
                </p>
                <p>
                  4.2. Субъект данных вправе отозвать согласие в любой момент через личный кабинет (кнопка «Удалить профиль») либо направив письменное заявление по телефону +7 (917) 256-32-35 или по адресу: г. Нижнекамск, пр. Шинников, д. 13В.
                </p>
                <p>
                  4.3. При получении заявления данные уничтожаются из всех операционных систем в срок, не превышающий 30 календарных дней.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'offer' && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">
                  Публичная оферта интернет-магазина цветов «София»
                </h3>
                <span className="text-xs text-white/50 block mt-1">
                  Договор купли-продажи и доставки товаров дистанционным способом (ст. 435, 437 ГК РФ)
                </span>
              </div>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  1. Предмет оферты и стороны договора
                </h4>
                <p>
                  1.1. Продавец (Индивидуальный предприниматель Обручников Дмитрий Владимирович, ИНН 165115143005, ОГРНИП 324169000033624) публикует настоящее предложение о продаже флористической продукции и сопутствующих товаров, представленных на сайте цветы-софия.рф.
                </p>
                <p>
                  1.2. Покупателем признается дееспособное физическое лицо либо уполномоченный представитель юридического лица, оформивший и оплативший заказ.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  2. Момент заключения договора (акцепт оферты)
                </h4>
                <p>
                  2.1. Акцептом настоящей оферты является факт оформления заказа покупателем на сайте, подтверждение состава через мессенджер WhatsApp/телефон и внесение 100% либо согласованной предоплаты заказа.
                </p>
                <p>
                  2.2. Совершая акцепт, покупатель подтверждает, что полностью ознакомлен и согласен со всеми положениями настоящей оферты и правилами возврата.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  3. Особенности флористической продукции и фотоконтроль
                </h4>
                <p>
                  3.1. Каждый авторский букет создается флористом индивидуально из живых цветов. В силу природного происхождения оттенки лепестков, форма бутонов и степень раскрытия могут незначительно отличаться от каталожного образца.
                </p>
                <p>
                  3.2. Салон «София» гарантирует сохранение общей цветовой гаммы, стиля и заявленной стоимости букета. Перед отправкой курьером покупателю направляется фотография готовой композиции в мессенджер для согласования.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  4. Доставка и порядок расчетов
                </h4>
                <p>
                  4.1. Доставка осуществляется по городу Нижнекамск и прилегающим районам в согласованный с клиентом временной интервал с 08:00 до 21:00 ежедневно.
                </p>
                <p>
                  4.2. Оплата производится банковскими картами (МИР, Visa, Mastercard) через интернет-эквайринг ПАО Сбербанк, по Системе быстрых платежей (СБП), либо по безналичному расчету для юридических лиц на основании выставленного счета.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">
                  Правила возврата и гарантия свежести цветов
                </h3>
                <span className="text-xs text-white/50 block mt-1">
                  Закон РФ «О защите прав потребителей» и Постановление Правительства РФ № 2463
                </span>
              </div>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  1. Нормативно-правовая база
                </h4>
                <p>
                  1.1. В соответствии со ст. 25 Закона РФ «О защите прав потребителей» и пунктом 13 «Перечня непродовольственных товаров надлежащего качества, не подлежащих обмену и возврату» (утвержден Постановлением Правительства РФ от 31 декабря 2020 г. № 2463), живые срезанные цветы, комнатные растения и растительная продукция надлежащего качества обмену и возврату не подлежат.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  2. Гарантия свежести салона «София»
                </h4>
                <p>
                  2.1. Мы бережно относимся к своей репутации и получаем поставки свежих цветов каждые 2–3 дня напрямую с проверенных плантаций.
                </p>
                <p>
                  2.2. При обнаружении скрытых недостатков или механических повреждений букета при получении покупатель имеет право обратиться в салон в течение 2 часов с момента передачи букета курьером.
                </p>
                <p>
                  2.3. Для рассмотрения обращения достаточно отправить 2–3 четкие фотографии букета и места повреждения в наш WhatsApp: +7 (917) 256-32-35.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  3. Варианты урегулирования при подтверждении дефекта
                </h4>
                <p>
                  3.1. При подтверждении ненадлежащего качества цветов салон предлагает на выбор покупателя:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-white/70">
                  <li>Бесплатную оперативную замену цветов или сборку нового аналогичного букета с доставкой за счет салона;</li>
                  <li>Соразмерное уменьшение покупной цены (компенсация части стоимости);</li>
                  <li>Полный возврат денежных средств на ту же карту, с которой производилась оплата (срок зачисления от 1 до 5 рабочих дней в зависимости от банка покупателя).</li>
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'cookie' && (
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-base font-semibold text-white">
                  Политика использования файлов cookie
                </h3>
                <span className="text-xs text-white/50 block mt-1">
                  Информация о типах файлов cookie и их назначении на сайте
                </span>
              </div>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  1. Что такое файлы cookie
                </h4>
                <p>
                  1.1. Файлы cookie — это небольшие текстовые фрагменты данных, сохраняемые вашим браузером при посещении интернет-страниц. Они обеспечивают стабильную работу интерактивных функций интернет-магазина.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  2. Какие файлы cookie мы используем
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-white/70">
                  <li>
                    <strong className="text-white">Технические (сессионные) cookie:</strong> необходимы для сохранения выбранных букетов в корзине, фиксации статуса оформления заказа и безопасной работы личного кабинета.
                  </li>
                  <li>
                    <strong className="text-white">Функциональные cookie:</strong> запоминают ваш выбор в баннере согласия и сохраняют фильтры по категориям цветов.
                  </li>
                  <li>
                    <strong className="text-white">Аналитические сервисы (Яндекс.Метрика):</strong> собирают обезличенную статистику посещаемости страниц без привязки к конкретной личности для улучшения удобства навигации по сайту.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-medium text-white text-xs uppercase tracking-wider text-[#C5A880]">
                  3. Управление файлами cookie
                </h4>
                <p>
                  3.1. Вы можете в любой момент изменить настройки вашего браузера, заблокировав сохранение файлов cookie или настроив уведомления об их отправке. Обратите внимание, что при полном отключении cookies оформление онлайн-заказа через корзину может работать некорректно.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer with Requisites info */}
        <div className="p-3 sm:px-6 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 shrink-0">
          <span>ИП Обручников Д. В., ИНН 165115143005, г. Нижнекамск, пр. Шинников, 13В</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs font-medium transition-colors cursor-pointer w-full sm:w-auto text-center"
          >
            Закрыть документ
          </button>
        </div>
      </div>
    </div>
  );
};
