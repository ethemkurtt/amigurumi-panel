'use client';

import { BACKGROUND_PRESETS, BackgroundPreset } from '@/constants/backgrounds';

interface BackgroundSelectorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  maxSelections?: number;
}

export default function BackgroundSelector({
  selected,
  onChange,
  maxSelections = 10,
}: BackgroundSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= maxSelections) return;
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    onChange(BACKGROUND_PRESETS.map((p) => p.id).slice(0, maxSelections));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm">
          <span className="text-purple-400 font-semibold">{selected.length}</span>
          /{maxSelections} konsept secili
        </span>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-purple-500/10"
          >
            Tumunu sec
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {BACKGROUND_PRESETS.map((preset: BackgroundPreset) => {
          const isSelected = selected.includes(preset.id);
          const isDisabled = !isSelected && selected.length >= maxSelections;

          return (
            <button
              key={preset.id}
              onClick={() => !isDisabled && toggle(preset.id)}
              disabled={isDisabled}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
                ${isSelected
                  ? 'border-purple-400 bg-purple-500/20'
                  : isDisabled
                  ? 'border-white/5 bg-white/3 opacity-40 cursor-not-allowed'
                  : 'border-white/10 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
                }`}
            >
              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              <span className="text-2xl mb-2 block">{preset.emoji}</span>
              <p className={`text-xs font-medium leading-tight ${isSelected ? 'text-purple-300' : 'text-white/80'}`}>
                {preset.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
