import React, { useState } from 'react';
import { X, ArrowRight, User, Phone, Calendar, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatRussianPhone, normalizePhone } from '../../services/customerDb';
import { SALON_MAX_URL } from '../../config/contacts';

interface AuthModalProps {
  onOpenLegal?: (tab: 'privacy'|'offer'|'refund'|'cookie') => void;
}

export const AuthModal: React.FC<AuthModalProps> = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    registerCustomer,
    loginWithPassword,
    claimCustomerPassword,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login'|'register'>('login');
  const [isPasswordSetupMode, setIsPasswordSetupMode] = useState(false);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPdAgreed, setIsPdAgreed] = useState(false);

  if (!isAuthModalOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRussianPhone(e.target.value);
    setPhone(formatted);
    if (error) setError('');
  };

  const handleTabSwitch = (tab: 'login'|'register') => {
    setActiveTab(tab);
    setIsPasswordSetupMode(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (password.length < 6) {
        setError('Придумайте пароль от 6 символов');
        return;
      }
      if (!isPdAgreed) {
        setError('Подтвердите согласие на обработку персональных данных');
        return;
      }

      setIsLoading(true);
      const result = await registerCustomer({
        phone,
        firstName,
        lastName,
        birthDate: birthDate || undefined,
        password,
        consent: true,
      });
      setIsLoading(false);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          setPhone('');
          setPassword('');
          setFirstName('');
          setLastName('');
          setBirthDate('');
          setIsPdAgreed(false);
        }, 600);
      } else {
        setError(result.error || 'Ошибка при сохранении профиля');
      }
    } else if (isPasswordSetupMode) {
      if (!firstName.trim()) {
        setError('Укажите имя из вашего профиля');
        return;
      }
      if (password.length < 6) {
        setError('Придумайте пароль от 6 символов');
        return;
      }
      if (!isPdAgreed) {
        setError('Подтвердите согласие на обработку персональных данных');
        return;
      }

      setIsLoading(true);
      const result = await claimCustomerPassword({
        phone,
        firstName,
        password,
        consent: true,
      });
      setIsLoading(false);

      if (result.success) {
        setIsPasswordSetupMode(false);
        setPhone('');
        setPassword('');
        setFirstName('');
        setIsPdAgreed(false);
      } else {
        setError(result.error || 'Не удалось задать пароль');
      }
    } else {
      if (!password) {
        setError('Введите пароль');
        return;
      }
      setIsLoading(true);
      const result = await loginWithPassword(phone, password);
      setIsLoading(false);

      if (result.success) {
        setPhone('');
        setPassword('');
      } else if (result.needsPasswordSetup) {
        setIsPasswordSetupMode(true);
        setPassword('');
        setError('');
      } else {
        setError(result.error || 'Неверный номер телефона или пароль');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#1A0B10] border border-[#6C1E26]/40 rounded-xl p-6 sm:p-8 shadow-2xl text-[#FAF7F5]">
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-sans block mb-1.5 font-light">
            Салон цветов «София»
          </span>
          <h3 className="text-2xl sm:text-3xl text-white font-medium">
            {activeTab === 'register' ? 'Регистрация' : 'Вход в личный кабинет'}
          </h3>
          <p className="text-xs text-white/60 font-light mt-1.5 max-w-sm mx-auto">
            {activeTab === 'register'
              ? 'Создайте профиль, чтобы копить скидку до 10% и видеть историю заказов'
              : 'Введите номер телефона и пароль от вашего профиля'}
          </p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-xl mb-6 text-xs">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`py-2.5 rounded-lg font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-[#6C1E26] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Вход
          </button>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
                autoComplete="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+7 (___) ___-__-__"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm tracking-wider focus:outline-none transition-colors"
                autoFocus
              />
            </div>
          </div>

          {activeTab === 'login' && isPasswordSetupMode && (
            <div className="space-y-3">
              <div className="p-3 bg-[#C5A880]/10 border border-[#C5A880]/30 rounded-xl text-xs text-[#FAF7F5]/90 leading-relaxed">
                Для этого номера пароль ещё не задан. Подтвердите ваше имя из профиля и придумайте новый пароль.
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-light">
                  Имя из профиля <span className="text-[#C5A880]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Как указывали при регистрации"
                    className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

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
                      autoComplete="given-name"
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
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Васильева"
                    className="w-full px-4 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-light flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Дата рождения (для бонусов)</span>
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

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-white/70 mb-1.5 font-light">
              Пароль <span className="text-[#C5A880]">*</span>{' '}
              {activeTab === 'register' && (
                <span className="normal-case text-white/45">(минимум 6 символов)</span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={activeTab === 'register' ? 6 : 1}
                maxLength={128}
                autoComplete={activeTab === 'register' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder={activeTab === 'register' ? 'Придумайте пароль' : 'Введите пароль'}
                className="w-full pl-10 pr-11 py-3 bg-black/40 border border-white/15 focus:border-[#C5A880] rounded-xl text-white font-sans text-sm focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {(activeTab === 'register' || isPasswordSetupMode) && (
            <label className="flex items-start gap-2.5 text-[11px] text-white/75 font-light leading-relaxed cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={isPdAgreed}
                onChange={(e) => {
                  setIsPdAgreed(e.target.checked);
                  if (error) setError('');
                }}
                required
                className="mt-0.5 w-4 h-4 rounded border-white/30 bg-black/40 text-[#922E3D] focus:ring-[#C5A880] shrink-0 cursor-pointer"
              />
              <span>
                Я даю согласие на обработку персональных данных в соответствии с{' '}
                <a
                  href="/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C5A880] hover:underline font-medium"
                >
                  Политикой конфиденциальности (152-ФЗ)
                </a>{' '}
                и принимаю условия{' '}
                <a
                  href="/offer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C5A880] hover:underline font-medium"
                >
                  Публичной оферты
                </a>
                .
              </span>
            </label>
          )}

          <div className="pt-2">
            <button
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-sans text-xs uppercase tracking-[0.2em] font-medium border border-[#C5A880]/30 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50"
            >
              <span>
                {isLoading
                  ? 'Проверка...'
                  : activeTab === 'register'
                  ? 'Зарегистрироваться'
                  : isPasswordSetupMode
                  ? 'Задать пароль и войти'
                  : 'Войти в кабинет'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {activeTab === 'login' && isPasswordSetupMode && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsPasswordSetupMode(false);
                  setError('');
                }}
                className="text-[11px] text-white/60 hover:text-white underline cursor-pointer"
              >
                Вернуться ко входу с паролем
              </button>
            </div>
          )}

          {activeTab === 'login' && (
            <p className="text-[11px] text-center text-white/50 font-light">
              Забыли пароль?{' '}
              <a
                href={SALON_MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C5A880] hover:underline"
              >
                Напишите флористу в MAX
              </a>
              , поможем восстановить доступ.
            </p>
          )}

          <div className="pt-3 mt-3 border-t border-white/10 text-center">
            <button
              type="button"
              onClick={() => {
                closeAuthModal();
                window.location.hash = '#admin';
              }}
              className="text-xs text-[#C5A880]/80 hover:text-[#C5A880] transition-colors inline-flex items-center gap-1.5 font-light cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white/5"
            >
              <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Вы владелица салона? Войти в CRM управление</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
