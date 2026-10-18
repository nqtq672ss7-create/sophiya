import React, { useState } from 'react';
import { Minus, Plus, X, Smile, Phone, MapPin, CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';
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

  // 1. Success Screen (Exact Figma frame 11)
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#140506] text-white flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
        <div className="w-28 h-28 rounded-full border-2 border-[#C5A880] flex items-center justify-center mb-6 shadow-2xl relative">
          <div className="absolute inset-0 bg-[#C5A880]/10 rounded-full animate-pulse" />
          <CheckCircle className="w-12 h-12 text-[#C5A880]" />
        </div>

        <h2 className="font-serif text-3xl font-light tracking-wide mb-3">
          Оплата прошла успешно
        </h2>

        <p className="text-xs text-white/70 font-light max-w-xs mb-8 leading-relaxed">
          Заказ передан в салон на пр. Шинников, 13В. Флорист собирает букет, и мы пришлем детальное фото в WhatsApp перед выездом курьера.
        </p>

        <button
          onClick={() => {
            setIsSuccess(false);
            onExploreCatalog();
          }}
          className="px-8 py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white text-xs font-medium uppercase tracking-[0.2em] transition-all shadow-md"
        >
          Вернуться в каталог
        </button>
      </div>
    );
  }

  // 2. Empty Cart Screen (Exact Figma frame 12)
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#6C1E26] via-[#5A121A] to-[#140506] text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <h2 className="font-serif text-3xl font-normal tracking-wide mb-2">
          Ваша корзина пуста
        </h2>
        <p className="text-xs text-white/70 font-light max-w-xs mb-8 leading-relaxed">
          Поскорее заполните ее чудесными цветами из нашего каталога
        </p>

        <button
          onClick={onExploreCatalog}
          className="px-8 py-3.5 rounded-2xl bg-white text-[#6C1E26] text-xs font-medium uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95"
        >
          Перейти к букетам
        </button>
      </div>
    );
  }

  // 3. Cart with items (Exact Figma frame 8)
  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-32 text-zinc-900 font-sans">
      {/* Header */}
      <div className="bg-[#FAF7F5] px-6 pt-10 pb-4 border-b border-zinc-200">
        <h1 className="font-serif text-2xl sm:text-3xl text-[#6C1E26] font-normal tracking-wider uppercase text-center">
          ВАША КОРЗИНА
        </h1>
      </div>

      <div className="px-5 pt-6 max-w-lg mx-auto space-y-6">
        {/* Cart Items List */}
        <div className="space-y-4">
          {items.map(({ bouquet, quantity }) => (
            <div
              key={bouquet.id}
              className="p-3.5 bg-white rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between gap-3"
            >
              <img
                src={bouquet.image}
                alt={bouquet.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-zinc-900 truncate">
                  {bouquet.title}
                </h3>

                {/* Quantity Stepper & Price */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center rounded-lg bg-zinc-100 px-2 py-1 gap-3">
                    <button
                      onClick={() => onUpdateQuantity(bouquet.id, -1)}
                      className="text-zinc-500 hover:text-zinc-900"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium">{quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(bouquet.id, 1)}
                      className="text-zinc-500 hover:text-zinc-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-serif text-base text-[#6C1E26] font-semibold">
                    {(bouquet.price * quantity).toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemoveItem(bouquet.id)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
                aria-label="Удалить позицию"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Delivery / Subtotal Summary */}
        <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm space-y-2.5 text-xs">
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

          <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline font-medium">
            <span className="text-sm text-zinc-900">Итого к оплате:</span>
            <span className="font-serif text-2xl text-[#6C1E26] font-bold">
              {totalToPay.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        {/* Delivery Type Selector (Exact Figma frame 8 tabs) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryType('delivery')}
            className={`py-3 rounded-2xl text-xs font-medium transition-all ${
              deliveryType === 'delivery'
                ? 'bg-white border-2 border-[#6C1E26] text-[#6C1E26] shadow-sm'
                : 'bg-zinc-200/80 text-zinc-700'
            }`}
          >
            Доставка
          </button>

          <button
            type="button"
            onClick={() => setDeliveryType('pickup')}
            className={`py-3 rounded-2xl text-xs font-medium transition-all ${
              deliveryType === 'pickup'
                ? 'bg-[#6C1E26] text-white shadow-sm'
                : 'bg-zinc-200/80 text-zinc-700'
            }`}
          >
            Самовывоз (Шинников, 13В)
          </button>
        </div>

        {/* Recipient Form (Exact Figma frame 8 inputs) */}
        <form onSubmit={handleCheckout} className="space-y-4 pt-2">
          <div>
            <h2 className="font-serif text-xl text-zinc-900 font-normal">
              Оформление заказа
            </h2>
            <span className="text-xs text-zinc-500 font-light block mb-3">
              О получателе
            </span>
          </div>

          {/* FIO */}
          <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm flex items-center gap-3">
            <Smile className="w-4 h-4 text-[#6C1E26] shrink-0" />
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="ФИО получателя"
              className="w-full text-xs font-sans text-zinc-900 focus:outline-none bg-transparent"
            />
          </div>

          {/* Phone */}
          <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm flex items-center gap-3">
            <Phone className="w-4 h-4 text-[#6C1E26] shrink-0" />
            <input
              type="tel"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+7 (917) 000-00-00"
              className="w-full text-xs font-sans text-zinc-900 focus:outline-none bg-transparent"
            />
          </div>

          {/* Address (only if delivery) */}
          {deliveryType === 'delivery' && (
            <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#6C1E26] shrink-0" />
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Адрес доставки в Нижнекамске (улица, дом, квартира)"
                className="w-full text-xs font-sans text-zinc-900 focus:outline-none bg-transparent"
              />
            </div>
          )}

          {/* Checkout Submit */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-sm transition-all shadow-lg active:scale-[0.99] mt-4"
          >
            Оформить заказ ({totalToPay.toLocaleString('ru-RU')} ₽)
          </button>
        </form>
      </div>
    </div>
  );
};
