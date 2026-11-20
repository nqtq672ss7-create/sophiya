import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Minus,
  Plus,
  X,
  Smile,
  Phone,
  Mail,
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CartItem } from '../../types/figma-app';
import { SALON_MAX_URL } from '../../config/contacts';
import { getApiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { formatBouquetAlt } from '../../utils/routes';

const B2BInvoiceModal = lazy(() =>
  import('../payment/B2BInvoiceModal').then((m) => ({ default: m.B2BInvoiceModal }))
);

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
  const [paymentMethod, setPaymentMethod] = useState<'yookassa'|'max'|'invoice'>('yookassa');
  const [recipientName, setRecipientName] = useState(
    customer ? `${customer.firstName} ${customer.lastName}`.trim() : ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    customer ? customer.phone : '+7 (917) '
  );
  const [recipientEmail, setRecipientEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('г. Нижнекамск, ');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [isPdAgreed, setIsPdAgreed] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string|null>(null);
  const [paymentError, setPaymentError] = useState('');

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const deliveryCost = 0;
  const userDiscount = customer?.discountPercent || 0;

  const rawSubtotal = items.reduce(
    (sum, item) => sum + item.bouquet.price * item.quantity,
    0
  );
  const discountAmount = Math.round((rawSubtotal * userDiscount) / 100);
  const finalSubtotal = rawSubtotal - discountAmount;
  const totalToPay = finalSubtotal + (items.length > 0 ? deliveryCost : 0);

  const checkYookassaOrderStatus = useCallback(
    async (orderId: string, attempt = 0) => {
      setIsCheckingPayment(true);
      setPaymentError('');
      try {
        const res = await fetch(getApiUrl(`/api/yookassa?orderId=${encodeURIComponent(orderId)}`), {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Не удалось проверить статус оплаты');
        }

        if (data.paymentStatus === 'paid') {
          setOrderNumber(data.orderNumber || '');
          setPendingOrderId(null);
          setIsCheckingPayment(false);

          try {
            const rawPending = sessionStorage.getItem('sophiya_yookassa_pending_cart');
            if (rawPending) {
              const parsed = JSON.parse(rawPending);
              if (customer && Array.isArray(parsed.items)) {
                addOrderToCustomer({
                  items: parsed.items,
                  totalAmount: Number(parsed.totalAmount) || Number(data.totalAmount) || 0,
                });
              }
              sessionStorage.removeItem('sophiya_yookassa_pending_cart');
            }
          } catch {}

          setIsSuccess(true);
          onClearCart();
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
          }
          return;
        }

        if (data.paymentStatus === 'canceled') {
          setIsCheckingPayment(false);
          setPendingOrderId(null);
          setPaymentError('Оплата была отменена. Корзина сохранена — вы можете попробовать снова или выбрать другой способ.');
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
          }
          return;
        }

        if (attempt < 3) {
          setTimeout(() => {
            checkYookassaOrderStatus(orderId, attempt + 1);
          }, 2000);
          return;
        }

        setIsCheckingPayment(false);
        setPendingOrderId(orderId);
        setPaymentError('Платёж ещё обрабатывается банком. Нажмите «Проверить статус» через пару секунд.');
      } catch (err: any) {
        setIsCheckingPayment(false);
        setPendingOrderId(orderId);
        setPaymentError(err?.message || 'Не удалось проверить статус оплаты');
      }
    },
    [customer, addOrderToCustomer, onClearCart]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const isReturn = params.get('yookassa_return') === '1';
    const returnedOrderId = params.get('orderId');
    if (isReturn && returnedOrderId) {
      setPendingOrderId(returnedOrderId);
      checkYookassaOrderStatus(returnedOrderId, 0);
    }
  }, [checkYookassaOrderStatus]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!isPdAgreed) {
      setConsentError('Подтвердите согласие на обработку персональных данных и принятие оферты');
      return;
    }
    setConsentError('');
    setPaymentError('');

    const generatedNum = 'SF-' + Math.floor(100000 + Math.random() * 900000);
    setOrderNumber(generatedNum);

    // 1. YooKassa online acquiring mode (Card / SBP / SberPay / T-Pay)
    if (paymentMethod === 'yookassa') {
      if (isCreatingPayment) return;
      setIsCreatingPayment(true);
      try {
        const res = await fetch(getApiUrl('/api/yookassa?action=create'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: recipientName.trim(),
            phone: recipientPhone.trim(),
            email: recipientEmail.trim(),
            deliveryType,
            address: deliveryType === 'delivery' ? deliveryAddress.trim() : '',
            deliveryDate: 'Ближайшее время (от 30 мин)',
            items: items.map((i) => ({
              id: i.bouquet.id,
              title: i.bouquet.title,
              price: i.bouquet.price,
              quantity: i.quantity,
            })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.confirmationUrl) {
          throw new Error(data.error || 'Не удалось перейти к оплате. Попробуйте снова или выберите MAX.');
        }

        try {
          sessionStorage.setItem(
            'sophiya_yookassa_pending_cart',
            JSON.stringify({
              orderId: data.orderId,
              orderNumber: data.orderNumber,
              items: items.map((i) => `${i.bouquet.title} (${i.quantity} шт)`),
              totalAmount: data.totalAmount || totalToPay,
            })
          );
        } catch {}

        window.location.href = data.confirmationUrl;
      } catch (err: any) {
        setPaymentError(err?.message || 'Ошибка создания платежа ЮKassa');
        setIsCreatingPayment(false);
      }
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

  // 0. Checking YooKassa return status
  if (isCheckingPayment) {
    return (
      <div className="min-h-[65vh] bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center select-none max-w-md mx-auto">
        <Loader2 className="w-10 h-10 text-[#6C1E26] animate-spin mb-4" />
        <h2 className="font-sans font-semibold text-2xl text-[#1C1215] mb-2">Проверяем оплату</h2>
        <p className="text-xs sm:text-sm text-[#5C454C] font-light">
          Уточняем статус платежа в ЮKassa, это займёт пару секунд...
        </p>
      </div>
    );
  }

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
                  alt={formatBouquetAlt(bouquet.title)}
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
                  <span>Доставка (0 ₽)</span>
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

                {/* Email for 54-FZ receipt (optional) */}
                <div className="bg-[#FAF7F5] rounded-xl p-3 sm:p-3.5 border border-[#E5DDD9] focus-within:border-[#6C1E26] flex items-center gap-3 transition-colors">
                  <Mail className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Email для электронного чека (необязательно)"
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
                    {/* Option 1: YooKassa Online Acquiring */}
                    <label
                      onClick={() => setPaymentMethod('yookassa')}
                      className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 cursor-pointer ${
                        paymentMethod === 'yookassa'
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                          : 'border-[#E5DDD9] bg-[#FAF7F5] hover:bg-[#FAF7F5]/70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'yookassa'}
                        onChange={() => setPaymentMethod('yookassa')}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-[#1C1215]">
                            Онлайн-оплата (Карта, СБП, SberPay, T-Pay)
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-xl">
                            Рекомендуем
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5C454C] font-light mt-0.5 leading-relaxed">
                          Быстрая оплата через <strong>ЮKassa</strong> без комиссии с официальным чеком по 54-ФЗ.
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
                    <span className="font-medium text-emerald-700">
                      {deliveryType === 'delivery' ? 'Бесплатно (0 ₽)' : 'Бесплатно (самовывоз)'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E5DDD9] flex justify-between items-baseline font-medium">
                    <span className="text-sm sm:text-base text-[#1C1215]">Итого к оплате:</span>
                    <span className="font-sans text-2xl sm:text-3xl text-[#6C1E26] font-bold">
                      {totalToPay.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                {/* Explicit 152-FZ Consent Checkbox */}
                <div className="pt-1 space-y-1.5">
                  <label className="flex items-start gap-2.5 text-[11px] text-[#5C454C] font-light leading-relaxed cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPdAgreed}
                      onChange={(e) => {
                        setIsPdAgreed(e.target.checked);
                        if (consentError) setConsentError('');
                      }}
                      required
                      className="mt-0.5 w-4 h-4 rounded border-[#E5DDD9] text-[#6C1E26] focus:ring-[#6C1E26] shrink-0 cursor-pointer"
                    />
                    <span>
                      Я согласен(на) на обработку персональных данных в соответствии с{' '}
                      <a
                        href="/privacy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#922E3D] hover:underline font-medium"
                      >
                        Политикой конфиденциальности (152-ФЗ)
                      </a>{' '}
                      и принимаю условия{' '}
                      <a
                        href="/offer/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#922E3D] hover:underline font-medium"
                      >
                        Публичной оферты
                      </a>
                      .
                    </span>
                  </label>
                  {consentError && (
                    <p className="text-[11px] text-red-600 font-medium">{consentError}</p>
                  )}
                </div>

                {paymentError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <p>{paymentError}</p>
                      {pendingOrderId && (
                        <button
                          type="button"
                          onClick={() => checkYookassaOrderStatus(pendingOrderId, 0)}
                          className="underline font-semibold text-red-800"
                        >
                          Проверить статус оплаты снова
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <button
                  disabled={isCreatingPayment}
                  className="w-full py-4 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-sm sm:text-base transition-colors shadow-lg active:scale-[0.99] mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isCreatingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>
                    {isCreatingPayment
                      ? 'Переход на страницу оплаты...'
                      : paymentMethod === 'yookassa'
                      ? `Оплатить онлайн (${totalToPay.toLocaleString('ru-RU')} ₽)`
                      : paymentMethod === 'invoice'
                      ? 'Выставить счёт на оплату'
                      : `Оформить заказ в MAX (${totalToPay.toLocaleString('ru-RU')} ₽)`}
                  </span>
                </button>

                {/* Legal compliance notice */}
                <p className="text-[10px] text-center text-[#7C636B] font-light leading-relaxed">
                  Получатель платежа: ИП Обручников Д. В. (ИНН 165115143005). Защищённая оплата через ЮKassa с отправкой чека по 54-ФЗ.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* B2B Invoice Modal */}
      {isInvoiceModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}
    </div>
  );
};
