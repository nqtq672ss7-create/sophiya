import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { FilterOptions } from '../../types/figma-app';

interface FigmaFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: FilterOptions;
  onApply: (newOptions: FilterOptions) => void;
}

export const FigmaFilterModal: React.FC<FigmaFilterModalProps> = ({
  isOpen,
  onClose,
  options,
  onApply,
}) => {
  const [minPrice, setMinPrice] = useState<number>(options.minPrice);
  const [maxPrice, setMaxPrice] = useState<number>(options.maxPrice);
  const [category, setCategory] = useState<string>(options.category);
  const [color, setColor] = useState<string>(options.color);

  const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'category' | 'color'>('none');

  if (!isOpen) return null;

  const categories = ['Все', 'Монобукеты', 'Авторские', 'Коробки', 'Корзины'];
  const colors = ['Все', 'Розовый', 'Красный', 'Белый', 'Бордовый'];

  const handleSave = () => {
    onApply({
      minPrice,
      maxPrice,
      category,
      color,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none font-sans text-zinc-900 animate-fadeIn"
      onClick={onClose}
    >
      {/* Dialog box: Bottom sheet on mobile, Centered elegant dialog on desktop */}
      <div
        className="w-full sm:max-w-md bg-[#FAF7F5] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border border-zinc-200 flex flex-col max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeSubmenu !== 'none') {
                  setActiveSubmenu('none');
                } else {
                  onClose();
                }
              }}
              className="p-1 text-[#6C1E26] hover:opacity-75 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-serif text-2xl text-[#6C1E26] font-normal">
              {activeSubmenu === 'none' && 'Фильтры'}
              {activeSubmenu === 'category' && 'Тип букета'}
              {activeSubmenu === 'color' && 'Цветовая гамма'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Filter Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeSubmenu === 'none' && (
            <div className="space-y-6">
              {/* Price Range */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#6C1E26] mb-3">
                  Диапазон цен, ₽
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm flex items-center">
                    <span className="text-xs text-zinc-400 mr-2">от</span>
                    <input
                      type="number"
                      value={minPrice || ''}
                      onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-sm font-medium text-[#6C1E26] focus:outline-none bg-transparent"
                    />
                  </div>

                  <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm flex items-center">
                    <span className="text-xs text-zinc-400 mr-2">до</span>
                    <input
                      type="number"
                      value={maxPrice || ''}
                      onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
                      placeholder="30 000"
                      className="w-full text-sm font-medium text-[#6C1E26] focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Category Row */}
              <div
                onClick={() => setActiveSubmenu('category')}
                className="py-4 border-b border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-100/50 -mx-2 px-2 rounded-xl transition-colors"
              >
                <span className="text-sm font-medium text-zinc-800">Категория букетов</span>
                <div className="flex items-center gap-1.5 text-xs text-[#6C1E26] font-medium">
                  <span>{category}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </div>
              </div>

              {/* Color Row */}
              <div
                onClick={() => setActiveSubmenu('color')}
                className="py-4 border-b border-zinc-200 flex items-center justify-between cursor-pointer hover:bg-zinc-100/50 -mx-2 px-2 rounded-xl transition-colors"
              >
                <span className="text-sm font-medium text-zinc-800">Цветовая гамма</span>
                <div className="flex items-center gap-1.5 text-xs text-[#6C1E26] font-medium">
                  <span>{color}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </div>
              </div>
            </div>
          )}

          {/* Submenu for Category */}
          {activeSubmenu === 'category' && (
            <div className="space-y-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setActiveSubmenu('none');
                  }}
                  className={`w-full py-3.5 px-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
                    category === c
                      ? 'bg-[#6C1E26] text-white border-[#6C1E26] shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  <span>{c}</span>
                  {category === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          )}

          {/* Submenu for Color */}
          {activeSubmenu === 'color' && (
            <div className="space-y-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setActiveSubmenu('none');
                  }}
                  className={`w-full py-3.5 px-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
                    color === c
                      ? 'bg-[#6C1E26] text-white border-[#6C1E26] shadow-sm'
                      : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  <span>{c}</span>
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Apply & Reset Buttons */}
        <div className="p-6 border-t border-zinc-200 bg-white flex items-center gap-3">
          <button
            onClick={() => {
              setMinPrice(0);
              setMaxPrice(30000);
              setCategory('Все');
              setColor('Все');
            }}
            className="py-3.5 px-4 rounded-2xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Сброс
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-sm transition-all shadow-md active:scale-[0.99]"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};
