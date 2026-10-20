import React, { useState } from 'react';
import { X, Building2, Download, Printer, CheckCircle, FileText, ArrowRight } from 'lucide-react';

interface B2BInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount: number;
  items: Array<{ title: string; price: number; quantity: number }>;
  onInvoiceCreated: () => void;
}

export const B2BInvoiceModal: React.FC<B2BInvoiceModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
  items,
  onInvoiceCreated,
}) => {
  const [inn, setInn] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inn.trim() || !companyName.trim()) return;
    setIsGenerated(true);
    onInvoiceCreated();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 p-6 sm:p-8 max-h-[92vh] overflow-y-auto text-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {!isGenerated ? (
          <form onSubmit={handleGenerate} className="space-y-5">
            <div className="flex items-center gap-2 text-[#6C1E26] mb-1">
              <Building2 className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
                Безналичный расчёт для юрлиц
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal">
              Выставление счёта на оплату
            </h3>
            <p className="text-xs text-zinc-500 font-light leading-relaxed">
              Счёт формируется автоматически на официальный расчётный счёт ИП Обручников Д. В. в ПАО Сбербанк. Предоставляем закрывающие документы УПД / чек.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  ИНН организации или ИП <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={inn}
                  onChange={(e) => setInn(e.target.value)}
                  placeholder="Например: 1651000000"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#6C1E26]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Название компании (плательщика) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder='Например: ООО "Восток-Трейд" или ИП Иванов А.А.'
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#6C1E26]"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <span className="font-medium text-zinc-800 block">Поставщик:</span>
              <span className="text-zinc-600 block">ИП Обручников Дмитрий Владимирович (ИНН 165115143005)</span>
              <span className="text-zinc-500 font-mono block">р/с 40802810762000090051 в ПАО Сбербанк</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <span>Сформировать официальный счёт на {totalAmount.toLocaleString('ru-RU')} ₽</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-zinc-200 pb-4 flex items-center justify-between">
              <div>
                <h4 className="font-serif text-xl font-bold text-zinc-900">
                  Счёт на оплату № {orderNumber}
                </h4>
                <span className="text-xs text-zinc-500">
                  от {new Date().toLocaleDateString('ru-RU')} г.
                </span>
              </div>

              <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-3 py-1 rounded-full">
                Готов к оплате
              </span>
            </div>

            {/* Invoice Printable View */}
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-zinc-200 text-[11px]">
                <div>
                  <span className="text-zinc-400 block font-sans">Поставщик:</span>
                  <strong>ИП Обручников Дмитрий Владимирович</strong>
                  <span className="block text-zinc-600">ИНН: 165115143005</span>
                  <span className="block text-zinc-600">ОГРНИП: 324169000033624</span>
                  <span className="block text-zinc-600">р/с: 40802810762000090051</span>
                  <span className="block text-zinc-600">в: ПАО СБЕРБАНК</span>
                  <span className="block text-zinc-600">БИК: 049205603</span>
                </div>

                <div>
                  <span className="text-zinc-400 block font-sans">Покупатель:</span>
                  <strong>{companyName}</strong>
                  <span className="block text-zinc-600">ИНН: {inn}</span>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block mb-1 font-sans">Товары и услуги:</span>
                <ul className="space-y-1">
                  {items.map((i, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>{i.title} × {i.quantity} шт</span>
                      <strong>{(i.price * i.quantity).toLocaleString('ru-RU')} ₽</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-bold font-sans">
                <span>Итого к оплате:</span>
                <span className="text-[#6C1E26]">{totalAmount.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-3 rounded-2xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Распечатать / Сохранить PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs font-medium transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <span>Завершить заказ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
