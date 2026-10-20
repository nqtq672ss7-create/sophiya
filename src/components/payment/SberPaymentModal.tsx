import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, QrCode, ExternalLink, ArrowRight, Smartphone, Building2 } from 'lucide-react';

interface SberPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  totalAmount: number;
  itemsSummary: string;
  recipientName: string;
  recipientPhone: string;
  onPaymentSuccess: () => void;
}

export const SberPaymentModal: React.FC<SberPaymentModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  totalAmount,
  itemsSummary,
  recipientName,
  recipientPhone,
  onPaymentSuccess,
}) => {
  const [isPaid, setIsPaid] = useState(false);

  if (!isOpen) return null;

  // Sberbank standard QR data format for settlements (ГОСТ Р 56042-2014)
  // ST00012|Name=ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ|PersonalAcc=40802810762000090051|BankName=ПАО СБЕРБАНК|BIC=049205603|CorrespAcc=30101810600000000603|PayeeINN=165115143005|Sum=...|Purpose=Оплата заказа цветов №...
  const sberQrPayload = `ST00012|Name=ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ|PersonalAcc=40802810762000090051|BankName=ОТДЕЛЕНИЕ "БАНК ТАТАРСТАН" N8610 ПАО СБЕРБАНК|BIC=049205603|CorrespAcc=30101810600000000603|PayeeINN=165115143005|Sum=${totalAmount * 100}|Purpose=Заказ цветов ${orderNumber} в салоне София`;

  const sberQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(sberQrPayload)}&color=21-128-61`;

  const handleConfirmPayment = () => {
    setIsPaid(true);
    setTimeout(() => {
      onPaymentSuccess();
      setIsPaid(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF7F5] rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-zinc-200/80 hover:bg-zinc-300 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bank & Trust Header */}
        <div className="flex items-center gap-2 text-emerald-700 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
            ПАО Сбербанк • Безопасный платёж
          </span>
        </div>

        <h3 className="font-serif text-2xl sm:text-3xl text-zinc-900 font-normal">
          Оплата заказа {orderNumber}
        </h3>

        {/* Amount Card */}
        <div className="my-5 p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-light block">Сумма к списанию</span>
            <span className="font-serif text-3xl font-bold text-emerald-800">
              {totalAmount.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Получатель</span>
            <span className="text-xs font-semibold text-zinc-800 block">
              ИП Обручников Д. В.
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              р/с ...90051
            </span>
          </div>
        </div>

        {/* SberPay / SBP QR Code */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm text-center space-y-4">
          <div className="inline-block p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/60 shadow-inner">
            <img
              src={sberQrCodeUrl}
              alt="QR-код для оплаты через Сбербанк или СБП"
              className="w-48 h-48 mx-auto rounded-xl object-contain"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-800 flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Наведите камеру смартфона для оплаты</span>
            </span>
            <p className="text-[11px] text-zinc-500 font-light max-w-xs mx-auto leading-relaxed">
              Откроется приложение <strong>СберБанк Онлайн</strong> или любого вашего банка через СБП с готовой суммой и получателем.
            </p>
          </div>

          {/* Quick Direct Link Button for mobile users */}
          <div className="pt-2">
            <a
              href={`https://qr.nspk.ru/`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-medium transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <span>Оплатить в СберБанк Онлайн / СБП</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Confirm Action Button */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            disabled={isPaid}
            onClick={handleConfirmPayment}
            className="w-full py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isPaid ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Платеж подтверждается...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Я оплатил(а) заказ</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-zinc-400 font-light">
            После подтверждения флорист салона свяжется с вами и пришлет фото готового букета в WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};
