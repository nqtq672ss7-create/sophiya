import React, { useState } from 'react';
import {
  Minus,
  Plus,
  X,
  Smile,
  Phone,
  MapPin,
  CheckCircle,
  ArrowRight,
  ShoppingBag,
  Truck,
  Store,
  CreditCard,
  MessageSquare,
  Building2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { CartItem } from '../../types/figma-app';
import { SALON_MAX_URL } from '../../config/contacts';
import { useAuth } from '../../context/AuthContext';
import { SberPaymentModal } from '../payment/SberPaymentModal';
import { B2BInvoiceModal } from '../payment/B2BInvoiceModal';

interface FigmaCartScreenProps {
  items: CartItem[];
  onUpdateQuantity: (bouquetId: string, delta: number) => void;
  onRemoveItem: (bouquetId: string) => void;
  onExploreCatalog: () => void;
  onClearCart: () => void;
}

export const FigmaCartScreen: React.FC<FigmaCartScreenProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onExploreCatalog,
  onClearCart,
}) => {
  const { customer, addOrderToCustomer } = useAuth();

  const [deliveryType, setDeliveryType] = useState<'delivery'|'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'sberbank'|'max'|'invoice'>('sberbank');
  const [recipientName, setRecipientName] = useState(
    customer ? `${customer.firstName} ${customer.lastName}`.trim() : ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    customer ? customer.phone : '+7 (917) '
  );
  const [deliveryAddress, setDeliveryAddress] = useState('г. Нижнекамск, ');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Modals state
  const [isSberModalOpen, setIsSberModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const deliveryCost = deliveryType === 'delivery' ? 700 : 0;
  const userDiscount = customer?.discountPercent || 0;

  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.bouquet.price * item.quantity,
    0
  );
  const discountAmount = Math.round((rawSubtotal * userDiscount) / 100);
  const finalSubtotal = rawSubtotal - discountAmount;
  const totalToPay = finalSubtotal + (items.length > 0 ? deliveryCost : 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const generatedNum = 'SF-' + Math.floor(100000 + Math.random() * 900000);
    setOrderNumber(generatedNum);

    // 1. Sberbank / SBP acquiring mode
    if (paymentMethod === 'sberbank') {
      setIsSberModalOpen(true);
      return;
    }

    // 2. B2B Invoice mode
    if (paymentMethod === 'invoice') {
      setIsInvoiceModalOpen(true);
      return;
    }

    // 3. MAX Messenger checkout mode
    if (paymentMethod === 'max') {
      const itemsList = items
        .map((i) => `- ${i.bouquet.title} (${i.quantity} шт) — ${(i.bouquet.price * i.quantity).toLocaleString('ru-RU')} ₽`)
        .join('\n');

      const orderText =
        `ЗАКАЗ ЦВЕТОВ В САЛОНЕ «СОФИЯ» (Шинников, 13В)\n` +
        `№ заказа: ${generatedNum}\n\n` +
        `Букеты:\n${itemsList}\n\n` +
        `Способ получения: ${deliveryType === 'delivery' ? `Доставка курьером: ${deliveryAddress}` : 'Самовывоз из салона (Шинников, 13В)'}\n` +
        `Получатель: ${recipientName} (${recipientPhone})\n` +
        `Итого к оплате: ${totalToPay.toLocaleString('ru-RU')} ₽\n\n` +
        `Пожалуйста, пришлите фото готового букета в MAX перед отправкой!`;

      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(orderText).catch(() => {});
        }
      } catch {}

      window.open(SALON_MAX_URL, '_blank', 'noopener,noreferrer');

      if (customer) {
        addOrderToCustomer({
          items: items.map((i) => `${i.bouquet.title} (${i.quantity} шт)`),
          totalAmount: totalToPay,
        });
      }

      setIsSuccess(true);
      onClearCart();
    }
  };

  const handlePaymentSuccess = () => {
    if (customer) {
      addOrderToCustomer({
        items: items.map((i) => `${i.bouquet.title} (${i.quantity} шт)`),
        totalAmount: totalToPay,
      });
    }
    setIsSuccess(true);
    onClearCart();
  };

  // 1. Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-[70vh] bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn max-w-2xl mx-auto my-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-[#C5A880] flex items-center justify-center mb-6 shadow-xl relative bg-white">
          <div className="absolute inset-0 bg-[#C5A880]/15 rounded-xl " />
          <CheckCircle className="w-12 h-12 text-[#6C1E26]" />
        </div>

        <span className="text-[11px] uppercase tracking-[0.25em] text-[#6C1E26] font-semibold block mb-2">
          Заказ {orderNumber || 'принят'}
        </span>

        <h2 className="font-sans text-3xl sm:text-4xl text-[#1C1215] font-normal tracking-wide mb-3">
          Заказ успешно оформлен!
        </h2>

        <p className="text-xs sm:text-sm text-[#5C454C] font-light max-w-md mb-8 leading-relaxed">
          Оплата поступает на расчётный счёт салона <strong>ИП Обручников Д. В. в ПАО Сбербанк</strong>. Заказ передан шеф-флористу на <strong>пр. Шинников, 13В</strong>. Мы свяжемся с вами и пришлем фото готовой композиции в MAX перед передачей курьеру.
        </p>

        <button
          onClick={() => {
            setIsSuccess(false);
            onExploreCatalog();
          }}
          className="px-8 py-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium uppercase tracking-[0.2em] transition-colors shadow-md active:scale-95 cursor-pointer"
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  // 2. Empty Cart Screen
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none max-w-lg mx-auto my-8">
        <div className="w-20 h-20 rounded-xl bg-[#EFE7E3] flex items-center justify-center mb-6 text-[#7C636B]">
          <ShoppingBag className="w-10 h-10" />
        </div>

        <h2 className="font-sans text-3xl text-[#1C1215] font-normal tracking-wide mb-2">
          Ваша корзина пуста
        </h2>
        <p className="text-xs sm:text-sm text-[#5C454C] font-light max-w-xs mb-8 leading-relaxed">
          Поскорее заполните ее чудесными цветами из нашей свежей поставки
        </p>

        <button
          onClick={onExploreCatalog}
          className="px-8 py-3.5 rounded-xl bg-[#6C1E26] text-white text-xs sm:text-sm font-medium uppercase tracking-wider transition-colors shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
        >
          Перейти к букетам
        </button>
      </div>
    );
  }

  // 3. Cart with items
  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-32 text-[#1C1215] font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-baseline justify-between border-b border-[#E5DDD9] pb-4">
          <div>
            <h2 className="font-sans text-3xl sm:text-4xl text-[#6C1E26] font-normal tracking-wider uppercase">
              ВАША КОРЗИНА
            </h2>
            <span className="text-xs text-[#5C454C] font-light">
              Салон цветов «София» , г. Нижнекамск, пр. Шинников, 13В
            </span>
          </div>

          <button
            onClick={onClearCart}
            className="text-xs text-[#7C636B] hover:text-[#6C1E26] transition-colors cursor-pointer"
          >
            Очистить корзину
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-7 space-y-4">
            {items.map(({ bouquet, quantity }) => (
              <div
                key={bouquet.id}
                className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-xl border border-[#E5DDD9] shadow-sm flex items-center justify-between gap-4"
              >
                <img
                  src={bouquet.image}
                  alt={bouquet.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-[#7C636B] font-light block">
                    {bouquet.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-medium text-[#1C1215] truncate">
                    {bouquet.title}
                  </h3>
                  <span className="text-xs text-[#5C454C] font-light block mt-0.5">
                    {bouquet.price.toLocaleString('ru-RU')} ₽ / шт
                  </span>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center rounded-xl bg-[#FAF7F5] px-2.5 py-1 gap-3">
                      <button
                        onClick={() => onUpdateQuantity(bouquet.id, -1)}
                        className="text-[#5C454C] hover:text-[#1C1215] p-1"
                        aria-label="Уменьшить количество"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs sm:text-sm font-semibold">{quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(bouquet.id, 1)}
                        className="text-[#5C454C] hover:text-[#1C1215] p-1"
                        aria-label="Увеличить количество"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-sans text-lg sm:text-xl text-[#6C1E26] font-semibold">
                      {(bouquet.price * quantity).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(bouquet.id)}
                  className="p-2 text-[#7C636B] hover:text-red-600 transition-colors"
                  aria-label="Удалить позицию"
                  title="Удалить"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}

            {/* Delivery Guarantee Card */}
            <div className="p-4 sm:p-5 bg-white rounded-xl sm:rounded-xl border border-[#E5DDD9] text-xs sm:text-sm text-[#5C454C] space-y-2">
              <div className="flex items-center gap-2 text-[#6C1E26] font-medium">
                <Store className="w-4 h-4 shrink-0" />
                <a
                  href="https://yandex.ru/maps/org/sofiya/105599949171"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  title="Открыть салон на Яндекс Картах"
                >
                  Бесплатный самовывоз из салона: пр. Шинников, 13В
                </a>
              </div>
              <p className="text-[#5C454C] font-light pl-6">
                Соберем букет к назначенному времени. Флорист пришлет фото в MAX перед выездом курьера.
              </p>
            </div>
          </div>

          {/* Right Column: Checkout & Summary Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl sm:rounded-xl p-6 sm:p-8 border border-[#E5DDD9] shadow-md space-y-6 sticky top-28">
              <h2 className="font-sans text-xl sm:text-2xl text-[#1C1215] font-normal">
                Оформление заказа
              </h2>

              {/* Delivery Type Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    deliveryType === 'delivery'
                      ? 'bg-white border-2 border-[#6C1E26] text-[#6C1E26] shadow-sm'
                      : 'bg-[#FAF7F5] text-[#3D2E33] hover:bg-[#EFE7E3]'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Доставка (700 ₽)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    deliveryType === 'pickup'
                      ? 'bg-[#6C1E26] text-white shadow-sm'
                      : 'bg-[#FAF7F5] text-[#3D2E33] hover:bg-[#EFE7E3]'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Самовывоз</span>
                </button>
              </div>

              {/* Recipient Form */}
              <form onSubmit={handleCheckout} className="space-y-4">
                {/* FIO */}
                <div className="bg-[#FAF7F5] rounded-xl p-3 sm:p-3.5 border border-[#E5DDD9] focus-within:border-[#6C1E26] flex items-center gap-3 transition-colors">
                  <Smile className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ФИО получателя"
                    className="w-full text-xs sm:text-sm font-sans text-[#1C1215] focus:outline-none bg-transparent"
                  />
                </div>

                {/* Phone */}
                <div className="bg-[#FAF7F5] rounded-xl p-3 sm:p-3.5 border border-[#E5DDD9] focus-within:border-[#6C1E26] flex items-center gap-3 transition-colors">
                  <Phone className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+7 (917) 000-00-00"
                    className="w-full text-xs sm:text-sm font-sans text-[#1C1215] focus:outline-none bg-transparent"
                  />
                </div>

                {/* Address (only if delivery) */}
                {deliveryType === 'delivery' && (
                  <div className="bg-[#FAF7F5] rounded-xl p-3 sm:p-3.5 border border-[#E5DDD9] focus-within:border-[#6C1E26] flex items-center gap-3 transition-colors">
                    <MapPin className="w-4 h-4 text-[#6C1E26] shrink-0" />
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Адрес доставки в Нижнекамске (улица, дом)"
                      className="w-full text-xs sm:text-sm font-sans text-[#1C1215] focus:outline-none bg-transparent"
                    />
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="pt-2 space-y-2">
                  <label className="block text-xs font-medium text-[#3D2E33]">
                    Способ оплаты:
                  </label>

                  <div className="space-y-2">
                    {/* Option 1: Sberbank / SBP to Account */}
                    <label
                      onClick={() => setPaymentMethod('sberbank')}
                      className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        paymentMethod === 'sberbank'
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                          : 'border-[#E5DDD9] bg-[#FAF7F5] hover:bg-[#FAF7F5]/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'sberbank'}
                        onChange={() => setPaymentMethod('sberbank')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-[#1C1215]">
                            ПАО Сбербанк / СБП (на расчётный счёт)
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-xl">
                            Рекомендуем
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C454C] font-light mt-0.5 leading-relaxed">
                          Оплата через <strong>СберБанк Онлайн</strong>, СБП или банковскую карту на р/с ИП Обручников Д. В.
                        </p>
                      </div>
                    </label>

                    {/* Option 2: MAX Concierge */}
                    <label
                      onClick={() => setPaymentMethod('max')}
                      className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        paymentMethod === 'max'
                          ? 'border-[#6C1E26] bg-[#6C1E26]/5 shadow-xs'
                          : 'border-[#E5DDD9] bg-[#FAF7F5] hover:bg-[#FAF7F5]/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'max'}
                        onChange={() => setPaymentMethod('max')}
                        className="mt-1 text-[#6C1E26] focus:ring-[#6C1E26]"
                      />
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm font-medium text-[#1C1215] block">
                          Согласовать фото и оплатить в MAX
                        </span>
                        <p className="text-[11px] text-[#5C454C] font-light mt-0.5 leading-relaxed">
                          Флорист пришлёт фото готового букета в MAX перед оплатой (текст заказа скопируется автоматически).
                        </p>
                      </div>
                    </label>

                    {/* Option 3: B2B Invoice for Companies */}
                    <label
                      onClick={() => setPaymentMethod('invoice')}
                      className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        paymentMethod === 'invoice'
                          ? 'border-[#1C1215] bg-[#FAF7F5] shadow-xs'
                          : 'border-[#E5DDD9] bg-[#FAF7F5] hover:bg-[#FAF7F5]/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'invoice'}
                        onChange={() => setPaymentMethod('invoice')}
                        className="mt-1 text-[#1C1215] focus:ring-[#1C1215]"
                      />
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm font-medium text-[#1C1215] block">
                          Счёт для юрлиц (по ИНН)
                        </span>
                        <p className="text-[11px] text-[#5C454C] font-light mt-0.5 leading-relaxed">
                          Автоматическое формирование счёта на оплату с закрывающими документами.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-[#E5DDD9] space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#5C454C]">
                    <span>Стоимость букетов:</span>
                    <span>{rawSubtotal.toLocaleString('ru-RU')} ₽</span>
                  </div>

                  {userDiscount > 0 && (
                    <div className="flex justify-between text-[#6C1E26] font-medium">
                      <span>Скидка постоянного клиента ({userDiscount}%):</span>
                      <span>-{discountAmount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#5C454C]">
                    <span>Доставка по Нижнекамску:</span>
                    <span className="font-medium text-[#6C1E26]">
                      {deliveryType === 'delivery' ? `${deliveryCost} ₽` : 'Бесплатно (самовывоз)'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E5DDD9] flex justify-between items-baseline font-medium">
                    <span className="text-sm sm:text-base text-[#1C1215]">Итого к оплате:</span>
                    <span className="font-sans text-2xl sm:text-3xl text-[#6C1E26] font-bold">
                      {totalToPay.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  className="w-full py-4 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-sm sm:text-base transition-colors shadow-lg active:scale-[0.99] mt-4 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'sberbank'
                      ? `Оплатить через СберБанк (${totalToPay.toLocaleString('ru-RU')} ₽)`
                      : paymentMethod === 'invoice'
                      ? 'Выставить счёт на оплату'
                      : `Оформить заказ в MAX (${totalToPay.toLocaleString('ru-RU')} ₽)`}
                  </span>
                </button>

                {/* Legal compliance notice */}
                <p className="text-[10px] text-center text-[#7C636B] font-light leading-relaxed">
                  Получатель платежа: ИП Обручников Д. В. (ИНН 165115143005). Расчётный счёт: 40802810762000090051 в ПАО Сбербанк. Безопасность гарантирована.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Sberbank Payment Modal */}
      <SberPaymentModal
        isOpen={isSberModalOpen}
        onClose={() => setIsSberModalOpen(false)}
        orderNumber={orderNumber}
        totalAmount={totalToPay}
        itemsSummary={items.map((i) => `${i.bouquet.title} (${i.quantity} шт)`).join(', ')}
        recipientName={recipientName}
        recipientPhone={recipientPhone}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* B2B Invoice Modal */}
      <B2BInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        orderNumber={orderNumber}
        totalAmount={totalToPay}
        items={items.map((i) => ({
          title: i.bouquet.title,
          price: i.bouquet.price,
          quantity: i.quantity,
        }))}
        onInvoiceCreated={handlePaymentSuccess}
      />
    </div>
  );
};
