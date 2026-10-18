import React from 'react';

interface FigmaSplashScreenProps {
  onEnter: () => void;
}

export const FigmaSplashScreen: React.FC<FigmaSplashScreenProps> = ({ onEnter }) => {
  return (
    <div
      onClick={onEnter}
      className="fixed inset-0 z-50 bg-[#5A121A] flex flex-col items-center justify-center p-6 cursor-pointer select-none animate-fadeIn"
    >
      <div className="relative flex flex-col items-center text-center">
        {/* Official Gold/Cream Logo Frame */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-[#C5A880]/40 flex flex-col items-center justify-center p-6 text-center shadow-2xl relative overflow-hidden bg-black/10 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#C5A880]/10 to-transparent pointer-events-none" />
          <img
            src="/logo-light.png"
            alt="Салон цветов София"
            className="w-40 sm:w-48 h-auto object-contain drop-shadow"
          />
        </div>

        <span className="text-xs text-[#C5A880]/80 uppercase tracking-[0.25em] font-light mt-12 animate-pulse">
          Нажмите, чтобы войти в салон
        </span>
      </div>
    </div>
  );
};
