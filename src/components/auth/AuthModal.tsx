import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, requestOtp, verifyOtp, completeRegistration } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('+7 (917) ');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const raw = phone.replace(/\D/g, '');
    if (raw.length < 11) {
      setError('Пожалуйста, введите полный номер телефона');
      return;
    }
    setIsLoading(true);
    await requestOtp(phone);
    setIsLoading(false);
    setStep('otp');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length < 4) {
      setError('Введите 4-значный код');
      return;
    }
    setIsLoading(true);
    const result = await verifyOtp(otp);
    setIsLoading(false);
    if (result.success) {
      if (result.isNewUser) {
        setStep('profile');
      } else {
        closeAuthModal();
        setStep('phone');
        setOtp('');
      }
    } else {
      setError('Неверный код. Попробуйте 1111');
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Пожалуйста, укажите имя и фамилию');
      return;
    }
    completeRegistration(firstName, lastName, birthDate);
    setStep('phone');
    setOtp('');
    setFirstName('');
    setLastName('');
  };

  const handleFillDemo = (demoPhone: string) => {
    setPhone(demoPhone);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-sofiya-black-purple border border-sofiya-viola/25 p-8 sm:p-10 shadow-2xl text-sofiya-petal">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-6 right-6 text-sofiya-viola/70 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-sofiya-viola font-sans block mb-2 font-light">
            Клуб привилегий «София»
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl text-white font-light">
            {step === 'phone' && 'Вход по номеру'}
            {step === 'otp' && 'Код подтверждения'}
            {step === 'profile' && 'Ваш профиль'}
          </h3>
          <p className="text-xs text-sofiya-petal/70 font-light mt-2 max-w-sm mx-auto">
            {step === 'phone' && 'Для накопления персональной скидки до 10% и быстрой связи по букетам'}
            {step === 'otp' && `Отправили проверочный код на номер ${phone}`}
            {step === 'profile' && 'Укажите ваши данные для оформления персональной накопительной карты'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-500/30 text-xs text-red-200 text-center font-light">
            {error}
          </div>
        )}

        {/* Step 1: Phone Input */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-sofiya-viola mb-2 font-light">
                Номер мобильного телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (917) 000-00-00"
                className="w-full px-4 py-3.5 bg-black/40 border border-sofiya-viola/30 focus:border-sofiya-viola text-white font-sans text-base tracking-wider focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-sofiya-red-berry hover:bg-sofiya-red-berry/90 text-white font-sans text-xs uppercase tracking-[0.25em] font-medium border border-sofiya-viola/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Отправляем код...' : 'Получить код в СМС'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Fill Buttons for Testing */}
            <div className="pt-4 border-t border-sofiya-viola/15 text-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-sofiya-petal/50 block mb-2">
                Тестовые аккаунты для проверки:
              </span>
              <div className="flex flex-col gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleFillDemo('+7 (917) 256-32-35')}
                  className="text-sofiya-viola hover:text-white transition-colors underline decoration-sofiya-viola/40"
                >
                  Айгуль Сафина (постоянный клиент, скидка 7%)
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('+7 (999) 777-11-22')}
                  className="text-sofiya-petal/70 hover:text-white transition-colors underline decoration-sofiya-petal/20"
                >
                  Новый номер (регистрация с нуля)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-sofiya-viola mb-2 font-light">
                Код из СМС
              </label>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1111"
                className="w-full px-4 py-3.5 bg-black/40 border border-sofiya-viola/30 focus:border-sofiya-viola text-white font-serif text-2xl tracking-[0.5em] text-center focus:outline-none transition-colors"
                autoFocus
              />
              <span className="text-[11px] text-sofiya-petal/50 block text-center mt-2 font-light">
                💡 В тестовом режиме подходит любой 4-значный код (например 1111)
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-sofiya-red-berry hover:bg-sofiya-red-berry/90 text-white font-sans text-xs uppercase tracking-[0.25em] font-medium border border-sofiya-viola/30 transition-all flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Проверка...' : 'Подтвердить код'}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-center text-xs text-sofiya-viola/70 hover:text-white transition-colors"
            >
              Изменить номер телефона
            </button>
          </form>
        )}

        {/* Step 3: Registration Profile (First & Last Name, Birthdate) */}
        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-sofiya-viola mb-1 font-light">
                Имя *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Анастасия"
                className="w-full px-4 py-3 bg-black/40 border border-sofiya-viola/30 focus:border-sofiya-viola text-white font-sans text-sm focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-sofiya-viola mb-1 font-light">
                Фамилия *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Васильева"
                className="w-full px-4 py-3 bg-black/40 border border-sofiya-viola/30 focus:border-sofiya-viola text-white font-sans text-sm focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-sofiya-viola mb-1 font-light">
                Дата рождения <span className="text-sofiya-petal/40">(для подарка и спецскидки)</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-sofiya-viola/30 focus:border-sofiya-viola text-white font-sans text-sm focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-sofiya-red-berry hover:bg-sofiya-red-berry/90 text-white font-sans text-xs uppercase tracking-[0.25em] font-medium border border-sofiya-viola/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Получить карту привилегий (3%)</span>
                <Sparkles className="w-4 h-4 text-sofiya-petal" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
