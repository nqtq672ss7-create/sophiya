import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Send, Calendar, Clock, MapPin, Phone, User, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audioEngine } from '../../utils/audio';
import { CustomBouquetConfig } from '../../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  price: number;
  stemCount: number;
  customConfig?: CustomBouquetConfig;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  title,
  price,
  stemCount,
  customConfig,
}) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('2026-10-19');
  const [deliveryTime, setDeliveryTime] = useState('14:00 - 17:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [cardMessage, setCardMessage] = useState(
    'Пусть эти цветы наполнят ваш день ароматом дамасской розы и утренней свежести...'
  );
  const [waxSealColor, setWaxSealColor] = useState<'gold' | 'bordeaux' | 'emerald'>('gold');
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'pickup'>('courier');

  if (!isOpen) return null;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    audioEngine.playChime(659.25, 0.2); // E5 celebration chime

    // Trigger luxury golden confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d4af37', '#f4e5ba', '#aa8222', '#f6d5da', '#ffffff'],
    });

    setStep('success');
  };

  const waxSealStyles = {
    gold: { bg: 'bg-[#d4af37]', border: 'border-[#b8952b]', text: 'text-atelier-950', ring: 'ring-gold/50' },
    bordeaux: { bg: 'bg-[#6b1426]', border: 'border-[#4a0a18]', text: 'text-rose-100', ring: 'ring-rose-800/50' },
    emerald: { bg: 'bg-[#1b4332]', border: 'border-[#0f281e]', text: 'text-emerald-100', ring: 'ring-emerald-800/50' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-atelier-950/85 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-atelier-900 border border-gold/30 rounded-3xl p-6 md:p-10 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full glass-panel hover:bg-gold/20 text-zinc-400 hover:text-gold transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <div>
            {/* Header */}
            <div className="text-center max-w-lg mx-auto mb-8">
              <span className="text-[10px] tracking-[0.25em] uppercase text-gold font-sans block mb-1">
                Оформление индивидуального заказа
              </span>
              <h3 className="font-display text-3xl md:text-4xl text-white font-normal">
                {title}
              </h3>
              <p className="text-zinc-400 text-xs mt-2">
                {stemCount} отборных стеблей • Итого к оплате:{' '}
                <span className="text-gold font-serif font-semibold text-sm">
                  {price.toLocaleString('ru-RU')} ₽
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Interactive Calligraphy Card Preview (5 cols) */}
              <div className="lg:col-span-5 flex flex-col">
                <label className="text-[11px] tracking-[0.2em] uppercase text-zinc-300 font-medium block mb-3">
                  Авторская каллиграфическая открытка
                </label>

                {/* Card Canvas */}
                <div className="relative p-6 rounded-2xl bg-[#fcf9f2] text-zinc-900 shadow-xl border border-stone-300 flex-1 flex flex-col justify-between min-h-[260px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
                      <span className="font-display tracking-[0.2em] text-[11px] text-stone-600">
                        SOPHIYA ATELIER
                      </span>
                      <span className="text-xs text-stone-400 font-serif italic">
                        Amalfi Cotton Paper
                      </span>
                    </div>

                    <p className="font-serif italic text-base leading-relaxed text-stone-800 break-words whitespace-pre-line">
                      "{cardMessage || 'Ваше тайное послание...'}"
                    </p>
                  </div>

                  {/* Wax Seal Representation */}
                  <div className="flex items-center justify-between pt-4 border-t border-stone-200 mt-4">
                    <span className="font-serif text-xs text-stone-500 italic">
                      {recipientName ? `Для ${recipientName}` : 'С искренним почтением'}
                    </span>
                    <div
                      className={`w-9 h-9 rounded-full ${waxSealStyles[waxSealColor].bg} border-2 ${waxSealStyles[waxSealColor].border} shadow-md flex items-center justify-center font-serif text-xs font-bold ${waxSealStyles[waxSealColor].text}`}
                    >
                      ⚜
                    </div>
                  </div>
                </div>

                {/* Card Message Input */}
                <div className="mt-3">
                  <textarea
                    rows={3}
                    value={cardMessage}
                    onChange={(e) => setCardMessage(e.target.value)}
                    placeholder="Введите текст послания для получателя..."
                    className="w-full text-xs p-3 rounded-xl bg-atelier-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60"
                  />
                </div>

                {/* Wax Seal Color Selector */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-zinc-400">Цвет сургучной печати:</span>
                  <div className="flex items-center gap-2">
                    {(['gold', 'bordeaux', 'emerald'] as const).map((wColor) => (
                      <button
                        key={wColor}
                        type="button"
                        onClick={() => {
                          setWaxSealColor(wColor);
                          audioEngine.playTap();
                        }}
                        className={`w-6 h-6 rounded-full border transition-all ${waxSealStyles[wColor].bg} ${
                          waxSealColor === wColor ? 'scale-110 ring-2 ring-gold' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Delivery Details (7 cols) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Delivery Method Tabs */}
                <div className="flex rounded-xl bg-atelier-950 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('courier')}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium tracking-wider uppercase transition-all ${
                      deliveryMethod === 'courier'
                        ? 'bg-gold text-atelier-950 font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Белый курьер с климат-контролем
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium tracking-wider uppercase transition-all ${
                      deliveryMethod === 'pickup'
                        ? 'bg-gold text-atelier-950 font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Самовывоз из ателье
                  </button>
                </div>

                {/* Recipient Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] tracking-wider uppercase text-zinc-400 block mb-1">
                      Имя получателя
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="София"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-atelier-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] tracking-wider uppercase text-zinc-400 block mb-1">
                      Телефон для связи
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-atelier-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] tracking-wider uppercase text-zinc-400 block mb-1">
                      Дата вручения
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        required
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-atelier-950 border border-white/10 text-white focus:outline-none focus:border-gold/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] tracking-wider uppercase text-zinc-400 block mb-1">
                      Временной интервал
                    </label>
                    <div className="relative">
                      <Clock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <select
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-atelier-950 border border-white/10 text-white focus:outline-none focus:border-gold/60"
                      >
                        <option>10:00 - 13:00</option>
                        <option>14:00 - 17:00</option>
                        <option>18:00 - 21:00</option>
                        <option>Точное время к полуночи (VIP)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {deliveryMethod === 'courier' && (
                  <div>
                    <label className="text-[11px] tracking-wider uppercase text-zinc-400 block mb-1">
                      Адрес доставки (Город, Улица, Апартаменты)
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Москва, Пресненская наб. 12, апарт. 45"
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-atelier-950 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-gold/60"
                      />
                    </div>
                  </div>
                )}

                {/* Guarantees */}
                <div className="p-3.5 rounded-xl bg-atelier-950/60 border border-white/5 flex items-center gap-3 text-xs text-zinc-400">
                  <Shield className="w-4 h-4 text-gold shrink-0" />
                  <span>Фотоконтроль букета перед выездом курьера отправляется вам в Telegram / WhatsApp.</span>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="mt-4 w-full py-4 rounded-2xl bg-gradient-to-r from-gold via-gold-metallic to-gold-dim text-atelier-950 font-bold text-sm tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Подтвердить заказ • {price.toLocaleString('ru-RU')} ₽
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="py-12 text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-gold shadow-[0_0_35px_rgba(212,175,55,0.4)] mb-6">
              <Check className="w-10 h-10" />
            </div>

            <span className="text-[10px] tracking-[0.3em] uppercase text-gold font-sans block mb-2">
              Заказ принят в работу
            </span>
            <h3 className="font-display text-3xl text-white font-normal">
              Благодарим вас за выбор SOPHIYA
            </h3>

            <p className="text-zinc-300 text-xs md:text-sm mt-3 leading-relaxed">
              Флористический архитектор уже приступил к бережной калибровке цветов. Персональный консьерж свяжется с вами по номеру{' '}
              <span className="text-gold font-mono">{recipientPhone}</span> в течение 7 минут для подтверждения деталей вручения.
            </p>

            <div className="mt-8 p-4 rounded-xl glass-panel border border-gold/20 text-xs text-zinc-400 font-mono">
              Номер бронирования: #SPH-2026-{Math.floor(1000 + Math.random() * 9000)}
            </div>

            <button
              onClick={() => {
                setStep('form');
                onClose();
              }}
              className="mt-8 px-8 py-3 rounded-full bg-gold text-atelier-950 font-semibold text-xs tracking-wider uppercase hover:bg-gold-light transition-all shadow-md"
            >
              Вернуться в ателье
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
