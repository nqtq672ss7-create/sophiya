import React, { useState, useEffect, useCallback } from 'react';
import {
  Minus,
  Plus,
  X,
  Smile,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Banknote,
  Loader2,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { CartItem } from '../../types/figma-app';
import { getApiUrl } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { formatBouquetAlt } from '../../utils/routes';

interface FigmaCartScreenProps {
  items: CartItem[];
  onUpdateQuantity: (bouquetId: string, delta: number) => void;
  onRemoveItem: (bouquetId: string) => void;
  onExploreCatalog: () => void;
  onClearCart: () => void;
}

interface PlacedOrderDetails {
  orderId: string;
  orderNumber: string;
  deliveryType: 'delivery'|'pickup';
  address: string;
  deliveryDay: string;
  deliverySlot: string;
  recipientName: string;
  recipientPhone: string;
  customerName: string;
  customerPhone: string;
  postcardText: string;
  comment: string;
  paymentMethod: 'yookassa'|'cash';
  totalAmount: number;
}

const TIME_SLOTS = [
  'Ближайшее (~60 мин)',
  '10:00 – 12:00',
  '12:00 – 15:00',
  '15:00 – 18:00',
  '18:00 – 21:00',
  'К точному времени',
];

function getTodayIso(): string {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return '';
  }
}

export const FigmaCartScreen: React.FC<FigmaCartScreenProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onExploreCatalog,
  onClearCart,
}) => {
  const { customer, addOrderToCustomer } = useAuth();

  const defaultCustomerName = customer ? `${customer.firstName} ${customer.lastName}`.trim() : '';
  const defaultCustomerPhone = customer ? customer.phone : '+7 (917) ';

  const [deliveryType, setDeliveryType] = useState<'delivery'|'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'yookassa'|'cash'>('yookassa');

  // Recipient & Delivery
  const [recipientName, setRecipientName] = useState(defaultCustomerName);
  const [recipientPhone, setRecipientPhone] = useState(defaultCustomerPhone);
  const [deliveryAddress, setDeliveryAddress] = useState('г. Нижнекамск, ');
  const [deliveryDay, setDeliveryDay] = useState(getTodayIso);
  const [deliverySlot, setDeliverySlot] = useState(TIME_SLOTS[0]);

  // Postcard & Same-person toggle
  const [addPostcard, setAddPostcard] = useState(false);
  const [postcardText, setPostcardText] = useState('');
  const [samePerson, setSamePerson] = useState(true);

  // Customer (if different from recipient)
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [customerPhone, setCustomerPhone] = useState(defaultCustomerPhone);
  const [customerEmail, setCustomerEmail] = useState('');
  const [orderComment, setOrderComment] = useState('');

  // Checkout & Return status
  const [isSuccess, setIsSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderDetails|null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editNotice, setEditNotice] = useState('');

  const [isPdAgreed, setIsPdAgreed] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string|null>(null);
  const [paymentError, setPaymentError] = useState('');

  const deliveryCost = 0;
  const userDiscount = customer?.discountPercent || 0;

  const rawSubtotal = items.reduce((sum, item) => sum + item.bouquet.price * item.quantity, 0);
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
          setPendingOrderId(null);
          setIsCheckingPayment(false);

          let pendingMeta: any = null;
          try {
            const rawPending = sessionStorage.getItem('sophiya_yookassa_pending_cart');
            if (rawPending) {
              pendingMeta = JSON.parse(rawPending);
              if (customer && Array.isArray(pendingMeta.items)) {
                addOrderToCustomer({
                  items: pendingMeta.items,
                  totalAmount: Number(pendingMeta.totalAmount) || Number(data.totalAmount) || 0,
                });
              }
              sessionStorage.removeItem('sophiya_yookassa_pending_cart');
            }
          } catch {}

          const dateParts = String(data.deliveryDate || '').split(', ');
          setPlacedOrder({
            orderId: data.orderId || orderId,
            orderNumber: data.orderNumber || pendingMeta?.orderNumber || '',
            deliveryType: data.deliveryType === 'pickup' ? 'pickup' : 'delivery',
            address: data.address || pendingMeta?.address || '',
            deliveryDay: dateParts[0] || getTodayIso(),
            deliverySlot: dateParts[1] || TIME_SLOTS[0],
            recipientName: data.recipientName || pendingMeta?.recipientName || '',
            recipientPhone: data.recipientPhone || pendingMeta?.recipientPhone || '',
            customerName: data.customerName || pendingMeta?.customerName || '',
            customerPhone: data.phone || pendingMeta?.customerPhone || '',
            postcardText: data.postcardText || pendingMeta?.postcardText || '',
            comment: data.comment || pendingMeta?.comment || '',
            paymentMethod: 'yookassa',
            totalAmount: Number(data.totalAmount) || Number(pendingMeta?.totalAmount) || 0,
          });
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
          setPaymentError('Оплата была отменена. Корзина сохранена — вы можете попробовать снова.');
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
    if (items.length === 0 || isCreatingPayment) return;

    if (!isPdAgreed) {
      setConsentError('Подтвердите согласие на обработку персональных данных и принятие оферты');
      return;
    }
    setConsentError('');
    setPaymentError('');

    const effectiveCustomerName = (samePerson ? recipientName : customerName).trim() || recipientName.trim();
    const effectiveCustomerPhone = (samePerson ? recipientPhone : customerPhone).trim() || recipientPhone.trim();
    const formattedDeliveryDate = `${deliveryDay || getTodayIso()}, ${deliverySlot}`;

    setIsCreatingPayment(true);
    try {
      const res = await fetch(getApiUrl('/api/yookassa?action=create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          customerName: effectiveCustomerName,
          phone: effectiveCustomerPhone,
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          email: customerEmail.trim(),
          deliveryType,
          address: deliveryType === 'delivery' ? deliveryAddress.trim() : '',
          deliveryDate: formattedDeliveryDate,
          postcardText: addPostcard ? postcardText.trim() : '',
          comment: orderComment.trim(),
          items: items.map((i) => ({
            id: i.bouquet.id,
            title: i.bouquet.title,
            price: i.bouquet.price,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось оформить заказ. Попробуйте снова.');
      }

      if (paymentMethod === 'yookassa') {
        if (!data.confirmationUrl) {
          throw new Error('Платёжный шлюз не вернул ссылку на оплату.');
        }
        try {
          sessionStorage.setItem(
            'sophiya_yookassa_pending_cart',
            JSON.stringify({
              orderId: data.orderId,
              orderNumber: data.orderNumber,
              items: items.map((i) => `${i.bouquet.title} (${i.quantity} шт)`),
              totalAmount: data.totalAmount || totalToPay,
              recipientName: recipientName.trim(),
              recipientPhone: recipientPhone.trim(),
              customerName: effectiveCustomerName,
              customerPhone: effectiveCustomerPhone,
              address: deliveryType === 'delivery' ? deliveryAddress.trim() : '',
              postcardText: addPostcard ? postcardText.trim() : '',
              comment: orderComment.trim(),
            })
          );
        } catch {}

        window.location.href = data.confirmationUrl;
        return;
      }

      // Cash on delivery/pickup
      if (customer) {
        addOrderToCustomer({
          items: items.map((i) => `${i.bouquet.title} (${i.quantity} шт)`),
          totalAmount: data.totalAmount || totalToPay,
        });
      }
      setPlacedOrder({
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        deliveryType,
        address: deliveryType === 'delivery' ? deliveryAddress.trim() : '',
        deliveryDay: deliveryDay || getTodayIso(),
        deliverySlot,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        customerName: effectiveCustomerName,
        customerPhone: effectiveCustomerPhone,
        postcardText: addPostcard ? postcardText.trim() : '',
        comment: orderComment.trim(),
        paymentMethod: 'cash',
        totalAmount: data.totalAmount || totalToPay,
      });
      setIsCreatingPayment(false);
      setIsSuccess(true);
      onClearCart();
    } catch (err: any) {
      setPaymentError(err?.message || 'Ошибка оформления заказа');
      setIsCreatingPayment(false);
    }
  };

  const handleSaveOrderChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placedOrder || isSavingEdit) return;
    setIsSavingEdit(true);
    setEditNotice('');

    try {
      const res = await fetch(getApiUrl('/api/yookassa?action=updateOrderDetails'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: placedOrder.orderId,
          deliveryType: placedOrder.deliveryType,
          address: placedOrder.deliveryType === 'delivery' ? placedOrder.address : '',
          deliveryDate: `${placedOrder.deliveryDay}, ${placedOrder.deliverySlot}`,
          recipientName: placedOrder.recipientName,
          recipientPhone: placedOrder.recipientPhone,
          customerName: placedOrder.customerName,
          phone: placedOrder.customerPhone,
          postcardText: placedOrder.postcardText,
          comment: placedOrder.comment,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось сохранить изменения заказа');
      }
      setEditNotice('Изменения сохранены и переданы флористу!');
      setIsEditingOrder(false);
    } catch (err: any) {
      setEditNotice(err?.message || 'Ошибка сохранения');
    } finally {
      setIsSavingEdit(false);
    }
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

  // 1. Variant 5: Edit Order Screen
  if (isSuccess && placedOrder && isEditingOrder) {
    return (
      <div className="min-h-[75vh] bg-[#FAF7F5] py-8 px-4 select-none animate-fadeIn">
        <form
          onSubmit={handleSaveOrderChanges}
          className="max-w-md mx-auto bg-white rounded-xl border border-[#EAE2DF] p-5 sm:p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-3 pb-1">
            <button
              type="button"
              onClick={() => setIsEditingOrder(false)}
              className="w-8 h-8 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] flex items-center justify-center text-[#6C1E26]"
              aria-label="Назад"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-[#1C1215]">Изменить заказ</h2>
              <span className="text-[11px] text-[#7C636B]">{placedOrder.orderNumber}</span>
            </div>
          </div>

          <div className="p-1 rounded-xl bg-[#6C1E26] grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setPlacedOrder({ ...placedOrder, deliveryType: 'delivery' })}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                placedOrder.deliveryType === 'delivery' ? 'bg-white text-[#6C1E26]' : 'text-white/90'
              }`}
            >
              Доставка
            </button>
            <button
              type="button"
              onClick={() => setPlacedOrder({ ...placedOrder, deliveryType: 'pickup' })}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                placedOrder.deliveryType === 'pickup' ? 'bg-white text-[#6C1E26]' : 'text-white/90'
              }`}
            >
              Самовывоз
            </button>
          </div>

          {placedOrder.deliveryType === 'pickup' && (
            <div className="text-center text-xs text-[#6C1E26] font-medium">
              г. Нижнекамск, пр. Шинников, 13В
            </div>
          )}

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#3D1C22]">О получателе</div>
            <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] flex items-center gap-3">
              <Smile className="w-4 h-4 text-[#6C1E26] shrink-0" />
              <input
                type="text"
                required
                value={placedOrder.recipientName}
                onChange={(e) => setPlacedOrder({ ...placedOrder, recipientName: e.target.value })}
                placeholder="ФИО"
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
              />
            </div>
            <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#6C1E26] shrink-0" />
              <input
                type="tel"
                required
                value={placedOrder.recipientPhone}
                onChange={(e) => setPlacedOrder({ ...placedOrder, recipientPhone: e.target.value })}
                placeholder="+7 (___) ___-__-__"
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
              />
            </div>

            {placedOrder.deliveryType === 'delivery' && (
              <>
                <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="text"
                    required
                    value={placedOrder.address}
                    onChange={(e) => setPlacedOrder({ ...placedOrder, address: e.target.value })}
                    placeholder="Улица, дом, номер квартиры"
                    className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
                  />
                </div>
                <p className="text-[10px] leading-relaxed text-[#8C747B]">
                  Если курьер уже выехал с заказом, изменение адреса и времени уточняются через флориста.
                </p>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#3D1C22]">Время доставки</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={placedOrder.deliveryDay}
                onChange={(e) => setPlacedOrder({ ...placedOrder, deliveryDay: e.target.value })}
                className="h-11 px-3 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] text-xs text-[#1C1215] focus:outline-none"
              />
              <select
                value={placedOrder.deliverySlot}
                onChange={(e) => setPlacedOrder({ ...placedOrder, deliverySlot: e.target.value })}
                className="h-11 px-2.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] text-xs text-[#1C1215] focus:outline-none"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#3D1C22]">О заказчике</div>
            <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] flex items-center gap-3">
              <Smile className="w-4 h-4 text-[#6C1E26] shrink-0" />
              <input
                type="text"
                required
                value={placedOrder.customerName}
                onChange={(e) => setPlacedOrder({ ...placedOrder, customerName: e.target.value })}
                placeholder="ФИО заказчика"
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
              />
            </div>
            <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#6C1E26] shrink-0" />
              <input
                type="tel"
                required
                value={placedOrder.customerPhone}
                onChange={(e) => setPlacedOrder({ ...placedOrder, customerPhone: e.target.value })}
                placeholder="+7 (___) ___-__-__"
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
              />
            </div>
            <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-[#6C1E26] shrink-0" />
              <input
                type="text"
                value={placedOrder.comment}
                onChange={(e) => setPlacedOrder({ ...placedOrder, comment: e.target.value })}
                placeholder="Комментарии к заказу"
                className="w-full text-xs sm:text-sm bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {editNotice && (
            <p className="text-xs text-[#6C1E26] font-medium">{editNotice}</p>
          )}

          <button
            disabled={isSavingEdit}
            className="w-full py-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-sm font-semibold shadow-md disabled:opacity-60"
          >
            {isSavingEdit ? 'Сохранение...' : 'Изменить заказ'}
          </button>
        </form>
      </div>
    );
  }

  // 2. Success Screen (with "Изменить заказ" button)
  if (isSuccess) {
    return (
      <div className="min-h-[70vh] bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn max-w-2xl mx-auto my-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-[#C5A880] flex items-center justify-center mb-6 shadow-xl relative bg-white">
          <div className="absolute inset-0 bg-[#C5A880]/15 rounded-xl" />
          <CheckCircle className="w-12 h-12 text-[#6C1E26]" />
        </div>

        <span className="text-[11px] uppercase tracking-[0.25em] text-[#6C1E26] font-semibold block mb-2">
          Заказ {placedOrder?.orderNumber || 'принят'}
        </span>
        <h2 className="font-sans font-semibold text-3xl sm:text-4xl text-[#1C1215] mb-3">
          {placedOrder?.paymentMethod === 'cash' ? 'Заказ оформлен!' : 'Оплата прошла успешно!'}
        </h2>
        <p className="text-sm sm:text-base text-[#5C454C] font-light max-w-md leading-relaxed mb-6">
          Флорист уже получил ваш заказ и соберёт свежий букет к выбранному времени ({placedOrder?.deliveryDay}, {placedOrder?.deliverySlot}).
        </p>

        {editNotice && (
          <div className="mb-5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
            {editNotice}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {placedOrder && (
            <button
              type="button"
              onClick={() => {
                setEditNotice('');
                setIsEditingOrder(true);
              }}
              className="px-6 py-3.5 rounded-xl bg-white border border-[#6C1E26] text-[#6C1E26] hover:bg-[#FDF8F8] text-xs uppercase tracking-[0.12em] font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Изменить заказ</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExploreCatalog}
            className="px-7 py-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs uppercase tracking-[0.15em] font-medium transition-colors shadow-lg"
          >
            Вернуться в каталог
          </button>
        </div>
      </div>
    );
  }

  // 3. Empty Cart State
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center select-none my-8">
        <div className="w-20 h-20 rounded-xl bg-white border border-[#E5DDD9] flex items-center justify-center mb-5 shadow-xs">
          <ShoppingBag className="w-8 h-8 text-[#C5A880]" />
        </div>
        <h2 className="font-sans font-semibold text-2xl sm:text-3xl text-[#1C1215] mb-2">
          Ваша корзина пуста
        </h2>
        <p className="text-xs sm:text-sm text-[#5C454C] font-light max-w-sm mb-8 leading-relaxed">
          Выберите свежие авторские букеты из нашего каталога, и мы бережно доставим их по Нижнекамску.
        </p>
        <button
          onClick={onExploreCatalog}
          className="px-8 py-4 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs uppercase tracking-[0.15em] font-medium inline-flex items-center gap-2 shadow-md transition-colors"
        >
          <span>Перейти в каталог</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 4. Variant 2 Checkout: 2 Columns on Desktop + Sticky Summary
  return (
    <div className="min-h-screen bg-[#FAF7F5] py-8 sm:py-12 px-4 sm:px-6 select-none animate-fadeIn">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-sans font-semibold text-2xl sm:text-3xl text-[#1C1215] mb-6">
          Ваш заказ
        </h1>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Items + Delivery & Recipient Form */}
          <div className="lg:col-span-7 space-y-4">
            {/* Cart items list */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.bouquet.id}
                  className="bg-white rounded-xl p-3.5 sm:p-4 border border-[#EAE2DF] shadow-xs flex items-center gap-3.5 relative"
                >
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.bouquet.id)}
                    className="absolute top-3 right-3 p-1 text-[#A8969C] hover:text-[#6C1E26] transition-colors"
                    aria-label="Удалить товар"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <img
                    src={item.bouquet.image || '/bouquet-1.jpg'}
                    alt={formatBouquetAlt(item.bouquet.title)}
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 bg-[#FAF7F5] ${
                      !item.bouquet.inStock ? 'grayscale opacity-70' : ''
                    }`}
                  />

                  <div className="flex-1 min-w-0 pr-5">
                    <span className="text-[10px] uppercase tracking-widest text-[#922E3D] font-semibold">
                      {item.bouquet.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-medium text-[#1C1215] leading-snug line-clamp-2">
                      {item.bouquet.title}
                    </h3>

                    {!item.bouquet.inStock ? (
                      <div className="mt-1.5">
                        <span className="text-xs font-bold text-[#6C1E26] block">Нет в наличии</span>
                        <button
                          type="button"
                          onClick={onExploreCatalog}
                          className="text-[11px] italic underline text-[#6E565B] hover:text-[#6C1E26]"
                        >
                          Подобрать похожее
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="inline-flex items-center border border-[#EAE2DF] rounded-xl bg-[#FAF7F5] h-8">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.bouquet.id, -1)}
                            className="w-8 h-full flex items-center justify-center text-[#1C1215] hover:text-[#6C1E26]"
                            aria-label="Уменьшить"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-[#1C1215]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.bouquet.id, 1)}
                            className="w-8 h-full flex items-center justify-center text-[#1C1215] hover:text-[#6C1E26]"
                            aria-label="Увеличить"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <strong className="text-base sm:text-lg font-bold text-[#6C1E26]">
                          {(item.bouquet.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery & Form Card */}
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-[#EAE2DF] shadow-xs space-y-4">
              {/* Burgundy Toggle: Доставка / Самовывоз */}
              <div className="p-1 rounded-xl bg-[#6C1E26] grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    deliveryType === 'delivery' ? 'bg-white text-[#6C1E26] shadow-xs' : 'text-white/90'
                  }`}
                >
                  Доставка (0 ₽)
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    deliveryType === 'pickup' ? 'bg-white text-[#6C1E26] shadow-xs' : 'text-white/90'
                  }`}
                >
                  Самовывоз
                </button>
              </div>

              {deliveryType === 'pickup' && (
                <div className="text-center text-xs text-[#6C1E26] font-medium bg-[#FAF7F5] py-2 px-3 rounded-xl border border-[#EAE2DF]">
                  г. Нижнекамск, пр. Шинников, 13В, Ежедневно 08:00–21:00
                </div>
              )}

              {/* О получателе */}
              <div className="space-y-2.5">
                <div className="text-xs sm:text-sm font-semibold text-[#1C1215]">О получателе</div>
                <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] focus-within:border-[#6C1E26] flex items-center gap-3">
                  <Smile className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ФИО получателя"
                    className="w-full text-xs sm:text-sm text-[#1C1215] bg-transparent focus:outline-none"
                  />
                </div>

                <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] focus-within:border-[#6C1E26] flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+7 (917) 000-00-00"
                    className="w-full text-xs sm:text-sm text-[#1C1215] bg-transparent focus:outline-none"
                  />
                </div>

                {deliveryType === 'delivery' && (
                  <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] focus-within:border-[#6C1E26] flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[#6C1E26] shrink-0" />
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Улица, дом, номер квартиры, подъезд"
                      className="w-full text-xs sm:text-sm text-[#1C1215] bg-transparent focus:outline-none"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addPostcard}
                    onChange={(e) => setAddPostcard(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#6C1E26]"
                  />
                  <span className="text-xs text-[#5C454C]">Добавить открытку с текстом (бесплатно)</span>
                </label>

                {addPostcard && (
                  <textarea
                    rows={2}
                    value={postcardText}
                    onChange={(e) => setPostcardText(e.target.value)}
                    placeholder="Напишите текст для открытки..."
                    className="w-full p-3 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] text-xs sm:text-sm text-[#1C1215] focus:border-[#6C1E26] focus:outline-none resize-none"
                  />
                )}
              </div>

              {/* Время доставки */}
              <div className="space-y-1.5">
                <div className="text-xs sm:text-sm font-semibold text-[#1C1215]">Время доставки</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={deliveryDay}
                    onChange={(e) => setDeliveryDay(e.target.value)}
                    className="h-11 px-3 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] text-xs text-[#1C1215] focus:border-[#6C1E26] focus:outline-none"
                  />
                  <select
                    value={deliverySlot}
                    onChange={(e) => setDeliverySlot(e.target.value)}
                    className="h-11 px-2.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] text-xs text-[#1C1215] focus:border-[#6C1E26] focus:outline-none"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Заказчик и получатель одно лицо */}
              <div className="space-y-2.5 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={samePerson}
                    onChange={(e) => setSamePerson(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#6C1E26]"
                  />
                  <span className="text-xs text-[#5C454C]">Заказчик и получатель одно лицо</span>
                </label>

                {!samePerson && (
                  <div className="space-y-2.5 pt-1">
                    <div className="text-xs sm:text-sm font-semibold text-[#1C1215]">О заказчике</div>
                    <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] focus-within:border-[#6C1E26] flex items-center gap-3">
                      <Smile className="w-4 h-4 text-[#6C1E26] shrink-0" />
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ваше ФИО"
                        className="w-full text-xs sm:text-sm text-[#1C1215] bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] focus-within:border-[#6C1E26] flex items-center gap-3">
                      <Phone className="w-4 h-4 text-[#6C1E26] shrink-0" />
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ваш телефон +7 (917) 000-00-00"
                        className="w-full text-xs sm:text-sm text-[#1C1215] bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] focus-within:border-[#6C1E26] flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email для электронного чека (необязательно)"
                    className="w-full text-xs sm:text-sm text-[#1C1215] bg-transparent focus:outline-none"
                  />
                </div>

                <div className="h-11 px-3.5 rounded-xl bg-[#FAF7F5] border border-[#EAE2DF] focus-within:border-[#6C1E26] flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="text"
                    value={orderComment}
                    onChange={(e) => setOrderComment(e.target.value)}
                    placeholder="Комментарии к заказу"
                    className="w-full text-xs sm:text-sm text-[#1C1215] bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Payment & Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white rounded-xl p-5 sm:p-6 border border-[#EAE2DF] shadow-sm space-y-4">
            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-semibold text-[#1C1215]">Способ оплаты</div>

              <label
                onClick={() => setPaymentMethod('yookassa')}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  paymentMethod === 'yookassa'
                    ? 'border-[#6C1E26] bg-[#FDF8F8]'
                    : 'border-[#EAE2DF] bg-[#FAF7F5]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'yookassa'}
                  onChange={() => setPaymentMethod('yookassa')}
                  className="mt-1 accent-[#6C1E26]"
                />
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-[#1C1215]">
                    Оплатить через ЮKassa
                  </div>
                  <div className="text-[11px] text-[#6E5A60] mt-0.5">
                    Карта, СБП, SberPay, T-Pay, Чек по 54-ФЗ
                  </div>
                </div>
              </label>

              <label
                onClick={() => setPaymentMethod('cash')}
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-[#6C1E26] bg-[#FDF8F8]'
                    : 'border-[#EAE2DF] bg-[#FAF7F5]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="mt-1 accent-[#6C1E26]"
                />
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-semibold text-[#1C1215]">
                    Наличными при получении
                  </div>
                  <div className="text-[11px] text-[#6E5A60] mt-0.5">
                    Курьеру при доставке или на кассе в салоне
                  </div>
                </div>
              </label>
            </div>

            <div className="border-t border-[#EAE2DF] pt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-[#6E5A60]">
                <span>Товар</span>
                <span>{rawSubtotal.toLocaleString('ru-RU')} ₽</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700 font-medium">
                  <span>Скидка ({userDiscount}%)</span>
                  <span>-{discountAmount.toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-[#6E5A60]">
                <span>Доставка</span>
                <span className="text-[#6C1E26] font-medium">Бесплатно (0 ₽)</span>
              </div>
              <div className="flex justify-between items-baseline pt-2">
                <span className="text-base font-semibold text-[#1C1215]">Итого</span>
                <span className="text-2xl font-bold text-[#6C1E26]">
                  {totalToPay.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPdAgreed}
                  onChange={(e) => {
                    setIsPdAgreed(e.target.checked);
                    if (e.target.checked) setConsentError('');
                  }}
                  className="mt-0.5 w-4 h-4 rounded accent-[#6C1E26]"
                />
                <span className="text-[11px] text-[#5C454C] leading-snug">
                  Я согласен(на) на обработку персональных данных в соответствии с{' '}
                  <a href="/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#922E3D] underline">
                    Политикой конфиденциальности (152-ФЗ)
                  </a>{' '}
                  и принимаю условия{' '}
                  <a href="/offer/" target="_blank" rel="noopener noreferrer" className="text-[#922E3D] underline">
                    Публичной оферты
                  </a>
                  .
                </span>
              </label>
              {consentError && <p className="text-[11px] text-red-600 font-medium">{consentError}</p>}
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

            <button
              disabled={isCreatingPayment}
              className="w-full py-4 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-semibold text-sm shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isCreatingPayment ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : paymentMethod === 'yookassa' ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <Banknote className="w-4 h-4" />
              )}
              <span>
                {isCreatingPayment
                  ? 'Оформляем заказ...'
                  : paymentMethod === 'yookassa'
                  ? `Оплатить онлайн (${totalToPay.toLocaleString('ru-RU')} ₽)`
                  : `Заказать (${totalToPay.toLocaleString('ru-RU')} ₽)`}
              </span>
            </button>

            <p className="text-[10px] text-center text-[#7C636B] font-light leading-relaxed">
              ИП Обручников Д. В. (ИНН 165115143005). Официальная оплата и чеки 54-ФЗ.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
