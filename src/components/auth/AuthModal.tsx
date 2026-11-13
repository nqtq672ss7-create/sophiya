import React, { useState } from 'react';
import { X, ArrowRight, User, Phone, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRussianPhone, normalizePhone } from '../../services/customerDb';

interface AuthModalProps {
  onOpenLegal?: (tab: 'privacy'|'offer'|'refund'|'cookie') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onOpenLegal }) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    registerCustomer,
    loginWithPhone,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'register'|'login'>('register');

  // Form Fields
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isAuthModalOpen) return null;

  // Handle phone input with auto-formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatRussianPhone(raw);
    setPhone(formatted);
    if (error) setError('');
  };

  // Switch tabs
  const handleTabSwitch = (tab: 'register'|'login') => {
    setActiveTab(tab);
    setError('');
  };

  // Submit Handler: 1-Click Instant Registration or Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalized = normalizePhone(phone);
    if (normalized.length < 11) {
      setError('Пожалуйста, укажите полный 11-значный номер телефона');
      return;
    }

    setIsLoading(true);

    if (activeTab === 'register') {
      if (!firstName.trim()) {
        setIsLoading(false);
        setError('Пожалуйста, укажите ваше имя');
        return;
      }
      if (!lastName.trim()) {
        setIsLoading(false);
        setError('Пожалуйста, укажите вашу фамилию');
        return;
      }

      // Execute instant registration
      const result = await registerCustomer({
        phone,
        firstName,
        lastName,
        birthDate: birthDate || undefined,
      });

      setIsLoading(false);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPhone('');
          setFirstName('');
          setLastName('');
          setBirthDate('');
        }, 1200);
      } else {
        setError(result.error || 'Ошибка при сохранении профиля');
      }
    } else {
      // Execute instant login by phone
      const result = await loginWithPhone(phone);
      setIsLoading(false);

      if (result.success) {
        setPhone('');
      } else {
        // If not found, suggest registration and switch tab
        setError(result.error || 'Номер не найден в базе салона');
        setActiveTab('register');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1A0B10] border border-[#6C1E26]/40 rounded-xl p-7 sm:p-9 shadow-2xl text-[#FAF7F5] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-sans block mb-1.5 font-light">
            Салон цветов «София»
          </span>
          <h3 className="text-2xl sm:text-3xl text-white font-medium">
            {activeTab === 'register' ? 'Регистрация' : 'Вход в личный кабинет'}
          </h3>
          <p className="text-xs text-white/60 font-light mt-1.5 max-w-sm mx-auto">
            {activeTab === 'register'
              ? 'Укажите ваши контактные данные для связи и истории заказов'
              : 'Введите номер телефона для входа в ваш профиль'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-xl mb-6 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            className={`py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'register'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Регистрация
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Вход по номеру
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/40 text-xs text-red-200 rounded-xl text-center font-light leading-relaxed">
            {error}
          </div>
        )}

        {isSuccess && (
          <div className="mb-5 p-4 bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 rounded-xl text-center flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-white font-medium">Вы успешно зарегистрированы!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Input with Russian Mask */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-light">
              Номер телефона <span className="text-[#C5A880]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+7 (917) 000-00-00"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm tracking-wider focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Registration Fields */}
          {activeTab === 'register' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-light">
                    Имя <span className="text-[#C5A880]">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Анастасия"
                      className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-light">
                    Фамилия <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Васильева"
                    className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Birth Date Field */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-light flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Дата рождения</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm focus:outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-sans text-xs uppercase tracking-[0.2em] font-medium border border-[#C5A880]/30 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50"
            >
              <span>
                {isLoading
                  ? 'Сохранение...'
                  : activeTab === 'register'
                  ? 'Зарегистрироваться'
                  : 'Войти в кабинет'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Legal 152-FZ Consent Disclaimer */}
          <p className="text-[10px] text-center text-white/50 font-light mt-3 leading-relaxed">
            Нажимая кнопку, вы подтверждаете согласие с правилами клуба и обработкой персональных данных согласно{' '}
            <button
              type="button"
              onClick={() => onOpenLegal?.('privacy')}
              className="text-[#C5A880] hover:underline font-medium cursor-pointer"
            >
              152-ФЗ РФ
            </button>
            .
          </p>
        </form>
      </div>
    </div>
  );
};
