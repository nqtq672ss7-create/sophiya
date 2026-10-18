import React from 'react';

interface FigmaSplashScreenProps {
  onEnter: () => void;
}

export const FigmaSplashScreen: React.FC<FigmaSplashScreenProps> = ({ onEnter }) => {
  return (
    <div
      onClick={onEnter}
      className="absolute inset-0 z-50 bg-[#5A121A] flex flex-col items-center justify-center p-6 cursor-pointer select-none animate-fadeIn"
    >
      <div className="relative flex flex-col items-center">
        {/* Gold Emblem Crest */}
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-[#C5A880] flex flex-col items-center justify-center p-6 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#C5A880]/10 to-transparent pointer-events-none" />
          <span className="font-serif text-2xl sm:text-3xl text-[#E8D8C8] tracking-widest uppercase block mb-1">
            SWEET SOFI
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#C5A880] tracking-[0.25em] uppercase font-sans">
            студия цветов
          </span>
        </div>

        <span className="text-xs text-[#C5A880]/70 uppercase tracking-[0.2em] font-light mt-12 animate-pulse">
          Нажмите, чтобы войти в салон
        </span>
      </div>
    </div>
  );
};
