'use client';

import { useState } from 'react';
import { BACKGROUND_PRESETS, BACKGROUND_CATEGORIES, BackgroundPreset } from '@/constants/backgrounds';
import {
  ConceptVariant,
  DEFAULT_VARIANT,
  SCENE_DETAIL_OPTIONS,
  CAMERA_DISTANCE_OPTIONS,
  TOY_SIZE_OPTIONS,
  CAMERA_ANGLE_OPTIONS,
  TOY_POSE_OPTIONS,
  VariantOption,
} from '@/constants/variants';

export interface SelectedConcept {
  backgroundId: string;
  variant: ConceptVariant;
}

interface BackgroundSelectorProps {
  selected: SelectedConcept[];
  onChange: (concepts: SelectedConcept[]) => void;
  maxSelections?: number;
}

function VariantPicker({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: VariantOption[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <span className="text-[10px] text-white/40 block mb-1">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={(e) => { e.stopPropagation(); onSelect(opt.id); }}
            className={`text-[10px] px-2 py-1 rounded-md transition-all ${
              value === opt.id
                ? 'bg-purple-500/25 border border-purple-500/40 text-purple-300'
                : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
            }`}
          >
            {opt.emoji} {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BackgroundSelector({
  selected,
  onChange,
  maxSelections = 30,
}: BackgroundSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const selectedIds = selected.map((s) => s.backgroundId);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selected.filter((s) => s.backgroundId !== id));
      if (expandedId === id) setExpandedId(null);
    } else {
      if (selected.length >= maxSelections) return;
      const newConcept: SelectedConcept = { backgroundId: id, variant: { ...DEFAULT_VARIANT } };
      onChange([...selected, newConcept]);
      setExpandedId(id);
    }
  };

  const updateVariant = (bgId: string, key: keyof ConceptVariant, value: string | number) => {
    onChange(
      selected.map((s) =>
        s.backgroundId === bgId ? { ...s, variant: { ...s.variant, [key]: value } } : s
      )
    );
  };

  const getVariant = (bgId: string): ConceptVariant => {
    return selected.find((s) => s.backgroundId === bgId)?.variant || DEFAULT_VARIANT;
  };

  const selectAll = () => {
    const presets = filteredPresets.slice(0, maxSelections);
    onChange(presets.map((p) => ({ backgroundId: p.id, variant: { ...DEFAULT_VARIANT } })));
  };

  const clearAll = () => {
    onChange([]);
    setExpandedId(null);
  };

  const applyToAll = (key: keyof ConceptVariant, value: string) => {
    onChange(selected.map((s) => ({ ...s, variant: { ...s.variant, [key]: value } })));
  };

  const filteredPresets =
    activeCategory === 'all'
      ? BACKGROUND_PRESETS
      : BACKGROUND_PRESETS.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
            activeCategory === 'all'
              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
          }`}
        >
          Tumu ({BACKGROUND_PRESETS.length})
        </button>
        {BACKGROUND_CATEGORIES.map((cat) => {
          const count = BACKGROUND_PRESETS.filter((p) => p.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                activeCategory === cat.id
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
              }`}
            >
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Stats & Actions */}
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm">
          <span className="text-purple-400 font-semibold">{selected.length}</span> konsept,{' '}
          <span className="text-orange-400 font-semibold">{selected.reduce((sum, s) => sum + (s.variant.count || 1), 0)}</span> gorsel
        </span>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors px-2 py-1 rounded hover:bg-purple-500/10"
          >
            Gosterilenleri sec
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded hover:bg-white/5"
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Toplu Ayar */}
      {selected.length > 1 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
          <p className="text-orange-300/70 text-xs font-semibold mb-2">Toplu Ayar (tum secilenlere uygula)</p>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40">Sahne:</span>
              {SCENE_DETAIL_OPTIONS.map((o) => (
                <button key={o.id} onClick={() => applyToAll('sceneDetail', o.id)} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white/80">
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40">Mesafe:</span>
              {CAMERA_DISTANCE_OPTIONS.map((o) => (
                <button key={o.id} onClick={() => applyToAll('cameraDistance', o.id)} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white/80">
                  {o.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40">Boyut:</span>
              {TOY_SIZE_OPTIONS.map((o) => (
                <button key={o.id} onClick={() => applyToAll('toySize', o.id)} className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white/80">
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredPresets.map((preset: BackgroundPreset) => {
          const isSelected = selectedIds.includes(preset.id);
          const isDisabled = !isSelected && selected.length >= maxSelections;
          const isExpanded = expandedId === preset.id && isSelected;

          return (
            <div key={preset.id} className="relative">
              <button
                onClick={() => toggle(preset.id)}
                disabled={isDisabled}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-200
                  ${isSelected
                    ? 'border-purple-400 bg-purple-500/15'
                    : isDisabled
                    ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                    : 'border-white/10 bg-white/[0.03] hover:border-purple-400/50 hover:bg-white/[0.06]'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl">{preset.emoji}</span>
                  {isSelected && (
                    <div className="flex items-center gap-1">
                      {(getVariant(preset.id).count || 1) > 1 && (
                        <span className="text-[9px] bg-orange-500/30 text-orange-300 font-bold px-1.5 py-0.5 rounded-full">
                          x{getVariant(preset.id).count}
                        </span>
                      )}
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <p className={`text-xs font-medium leading-tight ${isSelected ? 'text-purple-300' : 'text-white/70'}`}>
                  {preset.label}
                </p>
              </button>

              {/* Expand/Collapse Variant Button */}
              {isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : preset.id);
                  }}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 bg-purple-500/80 hover:bg-purple-500 text-white text-[9px] px-2 py-0.5 rounded-full transition-all"
                >
                  {isExpanded ? '▲ Kapat' : '▼ Ayarla'}
                </button>
              )}

              {/* Variant Panel */}
              {isExpanded && (
                <div className="mt-3 bg-white/[0.04] border border-purple-500/20 rounded-xl p-3 space-y-2.5">
                  {/* Adet */}
                  <div>
                    <span className="text-[10px] text-white/40 block mb-1">Adet</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={(e) => { e.stopPropagation(); updateVariant(preset.id, 'count', n as unknown as string); }}
                          className={`text-[10px] w-7 h-7 rounded-md flex items-center justify-center font-bold transition-all ${
                            getVariant(preset.id).count === n
                              ? 'bg-orange-500/25 border border-orange-500/40 text-orange-300'
                              : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <VariantPicker
                    label="Sahne Detayi"
                    options={SCENE_DETAIL_OPTIONS}
                    value={getVariant(preset.id).sceneDetail}
                    onSelect={(v) => updateVariant(preset.id, 'sceneDetail', v)}
                  />
                  <VariantPicker
                    label="Kamera Mesafesi"
                    options={CAMERA_DISTANCE_OPTIONS}
                    value={getVariant(preset.id).cameraDistance}
                    onSelect={(v) => updateVariant(preset.id, 'cameraDistance', v)}
                  />
                  <VariantPicker
                    label="Oyuncak Boyutu"
                    options={TOY_SIZE_OPTIONS}
                    value={getVariant(preset.id).toySize}
                    onSelect={(v) => updateVariant(preset.id, 'toySize', v)}
                  />
                  <VariantPicker
                    label="Kamera Acisi"
                    options={CAMERA_ANGLE_OPTIONS}
                    value={getVariant(preset.id).cameraAngle}
                    onSelect={(v) => updateVariant(preset.id, 'cameraAngle', v)}
                  />
                  <VariantPicker
                    label="Oyuncak Pozu"
                    options={TOY_POSE_OPTIONS}
                    value={getVariant(preset.id).toyPose}
                    onSelect={(v) => updateVariant(preset.id, 'toyPose', v)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
