import React, { useState } from 'react';
import { Minus, Plus, X, Smile, Phone, MapPin, CheckCircle, ArrowRight, ShoppingBag, Truck, Store, AlertCircle } from 'lucide-react';
import { CartItem } from '../../types/figma-app';
import { useAuth } from '../../context/AuthContext';

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

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [recipientName, setRecipientName] = useState(
    customer ? `${customer.firstName} ${customer.lastName}` : ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    customer ? customer.phone : '+7 (917) '
  );
  const [deliveryAddress, setDeliveryAddress] = useState('г. Нижнекамск, ');
  const [isSuccess, setIsSuccess] = useState(false);

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

    if (customer) {
      addOrderToCustomer({
        items: items.map((i) => `${i.bouquet.title} (${i.quantity} шт)`),
        totalAmount: rawSubtotal,
      });
    }

    setIsSuccess(true);
    onClearCart();
  };

  // 1. Success Screen (Exact Figma frame 11 adapted for desktop & mobile)
  if (isSuccess) {
    return (
      <div className="min-h-[70vh] bg-[#FAF7F5] flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn max-w-2xl mx-auto my-8">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-[#C5A880] flex items-center justify-center mb-6 shadow-xl relative bg-white">
          <div className="absolute inset-0 bg-[#C5A880]/15 rounded-full animate-pulse" />
          <CheckCircle className="w-12 h-12 text-[#6C1E26]" />
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl text-[#6C1E26] font-normal tracking-wide mb-3">
          Заказ успешно оформлен!
        </h2>

        <p className="text-xs sm:text-sm text-zinc-600 font-light max-w-md mb-8 leading-relaxed">
          Заказ передан шеф-флористу в салон на <strong>пр. Шинников, 13В</strong>. Мы свяжемся с вами по указанному номеру и пришлем фото готовой композиции в WhatsApp перед передачей курьеру.
        </p>

        <button
          onClick={() => {
            setIsSuccess(false);
            onExploreCatalog();
          }}
          className="px-8 py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs sm:text-sm font-medium uppercase tracking-[0.2em] transition-all shadow-md active:scale-95"
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  // 2. Empty Cart Screen (Exact Figma frame 12 adapted for desktop & mobile)
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none max-w-lg mx-auto my-8">
        <div className="w-20 h-20 rounded-full bg-zinc-200/60 flex items-center justify-center mb-6 text-zinc-400">
          <ShoppingBag className="w-10 h-10" />
        </div>

        <h2 className="font-serif text-3xl text-zinc-900 font-normal tracking-wide mb-2">
          Ваша корзина пуста
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 font-light max-w-xs mb-8 leading-relaxed">
          Поскорее заполните ее чудесными цветами из нашей свежей поставки
        </p>

        <button
          onClick={onExploreCatalog}
          className="px-8 py-3.5 rounded-2xl bg-[#6C1E26] text-white text-xs sm:text-sm font-medium uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          Перейти к букетам
        </button>
      </div>
    );
  }

  // 3. Cart with items (Responsive 2-column layout on Desktop, single-column on Mobile)
  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-32 text-zinc-900 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-baseline justify-between border-b border-zinc-200 pb-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#6C1E26] font-normal tracking-wider uppercase">
              ВАША КОРЗИНА
            </h1>
            <span className="text-xs text-zinc-500 font-light">
              Салон цветов «София» • г. Нижнекамск, пр. Шинников, 13В
            </span>
          </div>

          <button
            onClick={onClearCart}
            className="text-xs text-zinc-400 hover:text-[#6C1E26] transition-colors"
          >
            Очистить корзину
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List (7 cols on Desktop) */}
          <div className="lg:col-span-7 space-y-4">
            {items.map(({ bouquet, quantity }) => (
              <div
                key={bouquet.id}
                className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-sm flex items-center justify-between gap-4"
              >
                <img
                  src={bouquet.image}
                  alt={bouquet.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-light block">
                    {bouquet.category}
                  </span>
                  <h3 className="text-xs sm:text-sm font-medium text-zinc-900 truncate">
                    {bouquet.title}
                  </h3>
                  <span className="text-xs text-zinc-500 font-light block mt-0.5">
                    {bouquet.price.toLocaleString('ru-RU')} ₽ / шт
                  </span>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center rounded-xl bg-zinc-100 px-2.5 py-1 gap-3">
                      <button
                        onClick={() => onUpdateQuantity(bouquet.id, -1)}
                        className="text-zinc-500 hover:text-zinc-900 p-1"
                        aria-label="Уменьшить количество"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs sm:text-sm font-semibold">{quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(bouquet.id, 1)}
                        className="text-zinc-500 hover:text-zinc-900 p-1"
                        aria-label="Увеличить количество"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-serif text-lg sm:text-xl text-[#6C1E26] font-semibold">
                      {(bouquet.price * quantity).toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(bouquet.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                  aria-label="Удалить позицию"
                  title="Удалить"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}

            {/* Delivery Guarantee Card */}
            <div className="p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 text-xs sm:text-sm text-zinc-600 space-y-2">
              <div className="flex items-center gap-2 text-[#6C1E26] font-medium">
                <Store className="w-4 h-4 shrink-0" />
                <span>Бесплатный самовывоз из салона: пр. Шинников, 13В</span>
              </div>
              <p className="text-zinc-500 font-light pl-6">
                Соберем букет к назначенному времени. Флорист согласует фото в WhatsApp перед упаковкой.
              </p>
            </div>
          </div>

          {/* Right Column: Checkout & Summary Form (5 cols on Desktop, sticky) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-md space-y-6 sticky top-28">
              <h2 className="font-serif text-xl sm:text-2xl text-zinc-900 font-normal">
                Оформление заказа
              </h2>

              {/* Delivery Type Selector (Exact Figma frame 8 tabs) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'delivery'
                      ? 'bg-white border-2 border-[#6C1E26] text-[#6C1E26] shadow-sm'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Доставка</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 px-3 rounded-2xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    deliveryType === 'pickup'
                      ? 'bg-[#6C1E26] text-white shadow-sm'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200/80'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Самовывоз</span>
                </button>
              </div>

              {/* Recipient Form */}
              <form onSubmit={handleCheckout} className="space-y-4">
                {/* FIO */}
                <div className="bg-zinc-50 rounded-2xl p-3 sm:p-3.5 border border-zinc-200 focus-within:border-[#6C1E26] flex items-center gap-3 transition-colors">
                  <Smile className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ФИО получателя"
                    className="w-full text-xs sm:text-sm font-sans text-zinc-900 focus:outline-none bg-transparent"
                  />
                </div>

                {/* Phone */}
                <div className="bg-zinc-50 rounded-2xl p-3 sm:p-3.5 border border-zinc-200 focus-within:border-[#6C1E26] flex items-center gap-3 transition-colors">
                  <Phone className="w-4 h-4 text-[#6C1E26] shrink-0" />
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+7 (917) 000-00-00"
                    className="w-full text-xs sm:text-sm font-sans text-zinc-900 focus:outline-none bg-transparent"
                  />
                </div>

                {/* Address (only if delivery) */}
                {deliveryType === 'delivery' && (
                  <div className="bg-zinc-50 rounded-2xl p-3 sm:p-3.5 border border-zinc-200 focus-within:border-[#6C1E26] flex items-center gap-3 transition-colors">
                    <MapPin className="w-4 h-4 text-[#6C1E26] shrink-0" />
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Адрес доставки в Нижнекамске (улица, дом)"
                      className="w-full text-xs sm:text-sm font-sans text-zinc-900 focus:outline-none bg-transparent"
                    />
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-zinc-200 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-zinc-600">
                    <span>Стоимость букетов:</span>
                    <span>{rawSubtotal.toLocaleString('ru-RU')} ₽</span>
                  </div>

                  {userDiscount > 0 && (
                    <div className="flex justify-between text-[#6C1E26] font-medium">
                      <span>Скидка постоянного клиента ({userDiscount}%):</span>
                      <span>-{discountAmount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}

                  <div className="flex justify-between text-zinc-600">
                    <span>Доставка по Нижнекамску:</span>
                    <span className="font-medium text-[#6C1E26]">
                      {deliveryType === 'delivery' ? `${deliveryCost} ₽` : 'Бесплатно (самовывоз)'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 flex justify-between items-baseline font-medium">
                    <span className="text-sm sm:text-base text-zinc-900">Итого к оплате:</span>
                    <span className="font-serif text-2xl sm:text-3xl text-[#6C1E26] font-bold">
                      {totalToPay.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-sm sm:text-base transition-all shadow-lg active:scale-[0.99] mt-4"
                >
                  Оформить заказ ({totalToPay.toLocaleString('ru-RU')} ₽)
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
