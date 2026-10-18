import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
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
    <div className="absolute inset-0 z-50 bg-[#FAF7F5] flex flex-col font-sans text-zinc-900 animate-slideUp">
      {/* Top Header */}
      <div className="px-5 pt-8 pb-4 flex items-center gap-3 border-b border-zinc-200">
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
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-serif text-2xl text-[#6C1E26] font-normal">
          {activeSubmenu === 'none' && 'Фильтры'}
          {activeSubmenu === 'category' && 'Тип букета'}
          {activeSubmenu === 'color' && 'Цветовая гамма'}
        </h2>
      </div>

      {/* Main Filter Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-lg mx-auto w-full">
        {activeSubmenu === 'none' && (
          <div className="space-y-6">
            {/* Price Range */}
            <div>
              <span className="block text-sm font-medium text-[#6C1E26] mb-3">
                Цена ₽
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm flex items-center">
                  <span className="text-xs text-zinc-400 mr-2">от</span>
                  <input
                    type="number"
                    value={minPrice || ''}
                    onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
                    placeholder="5 000"
                    className="w-full text-sm font-medium text-[#6C1E26] focus:outline-none bg-transparent"
                  />
                </div>

                <div className="bg-white rounded-2xl p-3 border border-zinc-200 shadow-sm flex items-center">
                  <span className="text-xs text-zinc-400 mr-2">до</span>
                  <input
                    type="number"
                    value={maxPrice || ''}
                    onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
                    placeholder="25 000"
                    className="w-full text-sm font-medium text-[#6C1E26] focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Category Row */}
            <div
              onClick={() => setActiveSubmenu('category')}
              className="py-4 border-b border-zinc-200 flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm font-medium text-zinc-800">Тип</span>
              <div className="flex items-center gap-1 text-xs text-[#6C1E26]">
                <span>{category}</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            {/* Color Row */}
            <div
              onClick={() => setActiveSubmenu('color')}
              className="py-4 border-b border-zinc-200 flex items-center justify-between cursor-pointer"
            >
              <span className="text-sm font-medium text-zinc-800">Цвет</span>
              <div className="flex items-center gap-1 text-xs text-[#6C1E26]">
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
                className="w-full py-3.5 px-4 rounded-xl bg-white border border-zinc-200 flex items-center justify-between text-sm"
              >
                <span>{c}</span>
                {category === c && <Check className="w-4 h-4 text-[#6C1E26]" />}
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
                className="w-full py-3.5 px-4 rounded-xl bg-white border border-zinc-200 flex items-center justify-between text-sm"
              >
                <span>{c}</span>
                {color === c && <Check className="w-4 h-4 text-[#6C1E26]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="p-6 max-w-lg mx-auto w-full">
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-[#6C1E26] hover:bg-[#5A121A] text-white font-medium text-sm transition-all shadow-md active:scale-[0.99]"
        >
          Применить
        </button>
      </div>
    </div>
  );
};
