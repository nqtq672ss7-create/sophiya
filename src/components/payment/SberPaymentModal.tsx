import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle, ShieldCheck, ExternalLink, Smartphone } from 'lucide-react';

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
  const [sberQrCodeUrl, setSberQrCodeUrl] = useState<string>('');

  // Sberbank standard QR data format for settlements (ГОСТ Р 56042-2014)
  // ST00012|Name=ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ|PersonalAcc=40802810762000090051|BankName=ПАО СБЕРБАНК|BIC=049205603|CorrespAcc=30101810600000000603|PayeeINN=165115143005|Sum=...|Purpose=Оплата заказа цветов №...
  const sberQrPayload = `ST00012|Name=ИП ОБРУЧНИКОВ ДМИТРИЙ ВЛАДИМИРОВИЧ|PersonalAcc=40802810762000090051|BankName=ОТДЕЛЕНИЕ "БАНК ТАТАРСТАН" N8610 ПАО СБЕРБАНК|BIC=049205603|CorrespAcc=30101810600000000603|PayeeINN=165115143005|Sum=${totalAmount * 100}|Purpose=Заказ цветов ${orderNumber} в салоне София`;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    QRCode.toDataURL(sberQrPayload, {
      width: 240,
      margin: 2,
      color: { dark: '#15803d', light: '#ffffff' },
    })
      .then((dataUrl) => {
        if (!cancelled) setSberQrCodeUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setSberQrCodeUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, sberQrPayload]);

  if (!isOpen) return null;

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
      className="fixed inset-0 z-50 bg-black/75  flex items-center justify-center p-3 sm:p-4 select-none font-sans animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#FAF7F5] rounded-xl shadow-2xl overflow-hidden border border-[#E5DDD9] p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#EFE7E3] hover:bg-[#E5DDD9] flex items-center justify-center text-[#5C454C] hover:text-[#1C1215] transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Bank & Trust Header */}
        <div className="flex items-center gap-2 text-emerald-700 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
            ПАО Сбербанк , Безопасный платёж
          </span>
        </div>

        <h3 className="font-sans text-2xl sm:text-3xl text-[#1C1215] font-normal">
          Оплата заказа {orderNumber}
        </h3>

        {/* Amount Card */}
        <div className="my-5 p-4 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#7C636B] font-light block">Сумма к списанию</span>
            <span className="font-sans text-3xl font-bold text-emerald-800">
              {totalAmount.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#7C636B] uppercase tracking-wider block">Получатель</span>
            <span className="text-xs font-semibold text-[#1C1215] block">
              ИП Обручников Д. В.
            </span>
            <span className="text-[11px] text-[#5C454C] font-mono">
              р/с ...90051
            </span>
          </div>
        </div>

        {/* SberPay / SBP QR Code */}
        <div className="bg-white rounded-xl p-5 border border-[#E5DDD9] shadow-sm text-center space-y-4">
          <div className="inline-block p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 shadow-inner">
            {sberQrCodeUrl ? (
              <img
                src={sberQrCodeUrl}
                alt="QR-код для оплаты через Сбербанк или СБП"
                className="w-48 h-48 mx-auto rounded-xl object-contain"
              />
            ) : (
              <div className="w-48 h-48 mx-auto rounded-xl bg-white flex items-center justify-center text-xs text-emerald-700">
                Генерация QR-кода...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-[#1C1215] flex items-center justify-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Наведите камеру смартфона для оплаты</span>
            </span>
            <p className="text-[11px] text-[#5C454C] font-light max-w-xs mx-auto leading-relaxed">
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
            className="w-full py-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium transition-colors shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

          <p className="text-[11px] text-center text-[#7C636B] font-light">
            После подтверждения флорист салона свяжется с вами и пришлет фото готового букета в MAX.
          </p>
        </div>
      </div>
    </div>
  );
};
