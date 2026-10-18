import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, Sparkles, User, Phone, Calendar, HeartHandshake, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { formatRussianPhone, normalizePhone } from '../../services/customerDb';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    requestOtp,
    verifyOtp,
    registerCustomer,
    loginWithPhone,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [otp, setOtp] = useState('');

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
  const handleTabSwitch = (tab: 'register' | 'login') => {
    setActiveTab(tab);
    setStep('form');
    setError('');
    setOtp('');
  };

  // Submit Register or Login Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalized = normalizePhone(phone);
    if (normalized.length < 11) {
      setError('Пожалуйста, укажите полный 11-значный номер телефона');
      return;
    }

    if (activeTab === 'register') {
      if (!firstName.trim()) {
        setError('Пожалуйста, укажите ваше имя');
        return;
      }
      if (!lastName.trim()) {
        setError('Пожалуйста, укажите вашу фамилию');
        return;
      }
    }

    setIsLoading(true);
    await requestOtp(phone);
    setIsLoading(false);
    setStep('otp');
  };

  // Verify OTP and complete action
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 4) {
      setError('Введите 4 цифры проверочного кода');
      return;
    }

    setIsLoading(true);

    if (activeTab === 'register') {
      // Execute registration
      const result = await registerCustomer({
        phone,
        firstName,
        lastName,
        birthDate: birthDate || undefined,
      });

      setIsLoading(false);

      if (result.success) {
        setIsSuccess(true);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#6C1E26', '#C5A880', '#FFFFFF', '#9E2A2B'],
          });
        } catch {}

        setTimeout(() => {
          setIsSuccess(false);
          setStep('form');
          setOtp('');
          setFirstName('');
          setLastName('');
          setBirthDate('');
        }, 1800);
      } else {
        setError(result.error || 'Ошибка при регистрации');
      }
    } else {
      // Execute login
      const result = await loginWithPhone(phone);
      setIsLoading(false);

      if (result.success) {
        setStep('form');
        setOtp('');
      } else {
        setError(result.error || 'Неверный номер или код');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1A0B10] border border-[#6C1E26]/40 rounded-3xl p-7 sm:p-9 shadow-2xl text-[#FAF7F5] overflow-hidden">
        {/* Subtle Luxury Gradient Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#6C1E26]/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-sans block mb-1.5 font-light">
            Клуб привилегий салона «София»
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal">
            {step === 'otp'
              ? 'Код подтверждения'
              : activeTab === 'register'
              ? 'Оформление клубной карты'
              : 'Вход в личный кабинет'}
          </h3>
          <p className="text-xs text-white/60 font-light mt-1.5 max-w-sm mx-auto">
            {step === 'otp'
              ? `Отправили проверочный СМС-код на ${phone}`
              : activeTab === 'register'
              ? 'Приветственная скидка 3% на все букеты + персональный подарок в день рождения'
              : 'Введите номер телефона для доступа к вашей накопительной карте и заказам'}
          </p>
        </div>

        {/* Tab Switcher (Registration vs Login) */}
        {step === 'form' && (
          <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-2xl mb-6 text-xs">
            <button
              type="button"
              onClick={() => handleTabSwitch('register')}
              className={`py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'register'
                  ? 'bg-[#6C1E26] text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Регистрация (Карта 3%)
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('login')}
              className={`py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-[#6C1E26] text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Уже есть карта (Вход)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 bg-red-950/60 border border-red-500/40 text-xs text-red-200 rounded-xl text-center font-light leading-relaxed">
            {error}
          </div>
        )}

        {isSuccess && (
          <div className="mb-5 p-4 bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 rounded-2xl text-center flex flex-col items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="font-serif text-base text-white">Карта успешно оформлена!</span>
            <span className="text-[11px] text-emerald-300/80">
              Добро пожаловать в клуб «София». Ваша приветственная скидка 3% активирована.
            </span>
          </div>
        )}

        {/* Step 1: Form (Registration or Login) */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
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

            {/* Registration Additional Fields */}
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-white/70 font-light flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Дата рождения</span>
                    </label>
                    <span className="text-[10px] text-[#C5A880] font-light">
                      🎂 Для подарка и скидки 10%
                    </span>
                  </div>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm focus:outline-none transition-colors [color-scheme:dark]"
                  />
                  <span className="text-[10px] text-white/45 block mt-1 font-light">
                    В ваш день рождения салон «София» дарит авторский комплимент и персональную скидку.
                  </span>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#6C1E26] to-[#8C1B2F] hover:from-[#5A121A] hover:to-[#6C1E26] text-white font-sans text-xs uppercase tracking-[0.2em] font-medium border border-[#C5A880]/30 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-98 disabled:opacity-50"
              >
                <span>
                  {isLoading
                    ? 'Отправка...'
                    : activeTab === 'register'
                    ? 'Зарегистрироваться и получить карту'
                    : 'Получить СМС-код для входа'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Footer Trust Note */}
            <div className="pt-2 text-center text-[10px] text-white/40 font-light flex items-center justify-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-[#C5A880]/60" />
              <span>Ваши данные надёжно защищены и хранятся в закрытой базе салона</span>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#C5A880] mb-2 font-light text-center">
                Введите 4 цифры проверочного кода
              </label>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="0 0 0 0"
                className="w-full max-w-[200px] mx-auto block px-4 py-3.5 bg-black/50 border border-[#C5A880]/40 focus:border-[#C5A880] text-white font-serif text-3xl tracking-[0.5em] text-center rounded-2xl focus:outline-none transition-colors"
                autoFocus
              />
              <span className="text-[11px] text-white/50 block text-center mt-2.5 font-light">
                Код отправлен в SMS на номер <span className="text-white font-mono">{phone}</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 4}
              className="w-full py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-sans text-xs uppercase tracking-[0.2em] font-medium border border-white/20 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              <span>{isLoading ? 'Проверка...' : 'Подтвердить и войти'}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtp('');
                setError('');
              }}
              className="w-full text-center text-xs text-white/60 hover:text-white transition-colors"
            >
              ← Изменить номер телефона или данные
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
