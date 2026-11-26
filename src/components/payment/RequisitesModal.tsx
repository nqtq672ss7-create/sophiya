import React from 'react';
import { X, CheckCircle, Copy, ShieldCheck } from 'lucide-react';

interface RequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequisitesModal: React.FC<RequisitesModalProps> = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = React.useState<string|null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const requisites = [
    { label: 'Наименование', value: 'Индивидуальный предприниматель Обручников Дмитрий Владимирович', copy: 'ИП Обручников Дмитрий Владимирович' },
    { label: 'ИНН', value: '165115143005', copy: '165115143005' },
    { label: 'ОГРНИП', value: '324169000033624', copy: '324169000033624' },
    { label: 'Расчётный счёт', value: '40802810762000090051', copy: '40802810762000090051' },
    { label: 'Банк получателя', value: 'Отделение "Банк Татарстан" №8610 ПАО Сбербанк', copy: 'Отделение "Банк Татарстан" №8610 ПАО Сбербанк' },
    { label: 'БИК', value: '049205603', copy: '049205603' },
    { label: 'Корреспондентский счёт', value: '30101810600000000603', copy: '30101810600000000603' },
    { label: 'Юридический адрес', value: 'г. Нижнекамск, ул. 50 лет Октября, д. 8А, кв. 69', copy: 'г. Нижнекамск, ул. 50 лет Октября, д. 8А, кв. 69' },
    { label: 'Фактический адрес салона', value: 'г. Нижнекамск, проспект Шинников, д. 13В', copy: 'г. Нижнекамск, пр. Шинников, 13В' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#FAF7F5] rounded-xl shadow-2xl overflow-hidden border border-[#E5DDD9] p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-[#EAE2DF] hover:bg-[#DDD2CE] flex items-center justify-center text-[#5C454C] hover:text-[#1C1215] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#6C1E26] mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
            Официальные реквизиты
          </span>
        </div>

        <h3 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-semibold">
          Реквизиты и оплата
        </h3>
        <p className="text-xs text-[#5C454C] font-light mt-1 mb-6 leading-relaxed">
          Онлайн-оплата карт и СБП проходит через ЮKassa с отправкой чека по 54-ФЗ. Безналичные платежи от юрлиц поступают на расчётный счёт в ПАО Сбербанк.
        </p>

        <div className="space-y-3">
          {requisites.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white border border-[#EAE2DF] shadow-xs flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-[#7C636B] font-light uppercase tracking-wider block">
                  {item.label}
                </span>
                <span className="text-[#1C1215] font-medium block truncate mt-0.5">
                  {item.value}
                </span>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(item.copy, item.label)}
                className="p-2 rounded-xl bg-[#FAF7F5] hover:bg-[#6C1E26] hover:text-white text-[#5C454C] transition-colors shrink-0"
                title="Скопировать"
              >
                {copiedField === item.label ? (
                  <CheckCircle className="w-4 h-4 text-[#1D6B43]" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-[#E5DDD9] text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-colors shadow-sm"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
