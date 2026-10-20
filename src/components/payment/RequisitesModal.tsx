import React from 'react';
import { X, Building2, CheckCircle, Copy, FileText, ShieldCheck } from 'lucide-react';

interface RequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequisitesModal: React.FC<RequisitesModalProps> = ({ isOpen, onClose }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#FAF7F5] rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-200/80 hover:bg-zinc-300 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
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

        <h3 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal">
          Реквизиты и оплата
        </h3>
        <p className="text-xs text-zinc-500 font-light mt-1 mb-6 leading-relaxed">
          Салон цветов «София» работает официально. Все платежи принимаются на расчётный счёт в ПАО Сбербанк.
        </p>

        <div className="space-y-3">
          {requisites.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-zinc-400 font-light uppercase tracking-wider block">
                  {item.label}
                </span>
                <span className="text-zinc-900 font-medium block truncate mt-0.5">
                  {item.value}
                </span>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(item.copy, item.label)}
                className="p-2 rounded-xl bg-zinc-100 hover:bg-[#6C1E26] hover:text-white text-zinc-500 transition-colors shrink-0"
                title="Скопировать"
              >
                {copiedField === item.label ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-200 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-colors shadow-sm"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
