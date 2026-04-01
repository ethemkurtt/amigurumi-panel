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
  variants: ConceptVariant[];
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
      <div className="flex gap-1 flex-wrap">
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
  const [activeVariantTab, setActiveVariantTab] = useState<number>(0);

  const selectedIds = selected.map((s) => s.backgroundId);

  const totalImages = selected.reduce((sum, s) => sum + s.variants.length, 0);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selected.filter((s) => s.backgroundId !== id));
      if (expandedId === id) setExpandedId(null);
    } else {
      if (selected.length >= maxSelections) return;
      const newConcept: SelectedConcept = { backgroundId: id, variants: [{ ...DEFAULT_VARIANT }] };
      onChange([...selected, newConcept]);
      setExpandedId(id);
      setActiveVariantTab(0);
    }
  };

  const addVariant = (bgId: string) => {
    onChange(
      selected.map((s) => {
        if (s.backgroundId !== bgId || s.variants.length >= 5) return s;
        const lastVariant = s.variants[s.variants.length - 1];
        return { ...s, variants: [...s.variants, { ...lastVariant }] };
      })
    );
    const concept = selected.find((s) => s.backgroundId === bgId);
    if (concept) setActiveVariantTab(concept.variants.length); // new tab index
  };

  const removeVariant = (bgId: string, index: number) => {
    onChange(
      selected.map((s) => {
        if (s.backgroundId !== bgId || s.variants.length <= 1) return s;
        return { ...s, variants: s.variants.filter((_, i) => i !== index) };
      })
    );
    setActiveVariantTab((prev) => Math.max(0, prev - 1));
  };

  const updateVariant = (bgId: string, variantIndex: number, key: keyof ConceptVariant, value: string) => {
    onChange(
      selected.map((s) => {
        if (s.backgroundId !== bgId) return s;
        return {
          ...s,
          variants: s.variants.map((v, i) =>
            i === variantIndex ? { ...v, [key]: value } : v
          ),
        };
      })
    );
  };

  const getVariants = (bgId: string): ConceptVariant[] => {
    return selected.find((s) => s.backgroundId === bgId)?.variants || [{ ...DEFAULT_VARIANT }];
  };

  const selectAll = () => {
    const presets = filteredPresets.slice(0, maxSelections);
    onChange(presets.map((p) => ({ backgroundId: p.id, variants: [{ ...DEFAULT_VARIANT }] })));
  };

  const clearAll = () => {
    onChange([]);
    setExpandedId(null);
  };

  const applyToAll = (key: keyof ConceptVariant, value: string) => {
    onChange(
      selected.map((s) => ({
        ...s,
        variants: s.variants.map((v) => ({ ...v, [key]: value })),
      }))
    );
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
          <span className="text-orange-400 font-semibold">{totalImages}</span> gorsel
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
          const variants = getVariants(preset.id);
          const variantCount = variants.length;

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
                      {variantCount > 1 && (
                        <span className="text-[9px] bg-orange-500/30 text-orange-300 font-bold px-1.5 py-0.5 rounded-full">
                          x{variantCount}
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
                    if (isExpanded) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(preset.id);
                      setActiveVariantTab(0);
                    }
                  }}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 bg-purple-500/80 hover:bg-purple-500 text-white text-[9px] px-2 py-0.5 rounded-full transition-all"
                >
                  {isExpanded ? '▲ Kapat' : '▼ Ayarla'}
                </button>
              )}

              {/* Variant Panel */}
              {isExpanded && (
                <div className="mt-3 bg-white/[0.04] border border-purple-500/20 rounded-xl p-3 space-y-3">
                  {/* Variant Tabs */}
                  <div className="flex items-center gap-1.5">
                    {variants.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveVariantTab(idx); }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all relative ${
                          activeVariantTab === idx
                            ? 'bg-orange-500/25 border border-orange-500/40 text-orange-300'
                            : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                        }`}
                      >
                        Gorsel {idx + 1}
                        {variants.length > 1 && activeVariantTab === idx && (
                          <button
                            onClick={(e) => { e.stopPropagation(); removeVariant(preset.id, idx); }}
                            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-[8px] text-white"
                          >
                            x
                          </button>
                        )}
                      </button>
                    ))}
                    {variants.length < 5 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); addVariant(preset.id); }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 font-bold transition-all"
                      >
                        + Ekle
                      </button>
                    )}
                  </div>

                  {/* Active Variant Settings */}
                  {variants[activeVariantTab] && (
                    <div className="space-y-2.5">
                      <VariantPicker
                        label="Sahne Detayi"
                        options={SCENE_DETAIL_OPTIONS}
                        value={variants[activeVariantTab].sceneDetail}
                        onSelect={(v) => updateVariant(preset.id, activeVariantTab, 'sceneDetail', v)}
                      />
                      <VariantPicker
                        label="Kamera Mesafesi"
                        options={CAMERA_DISTANCE_OPTIONS}
                        value={variants[activeVariantTab].cameraDistance}
                        onSelect={(v) => updateVariant(preset.id, activeVariantTab, 'cameraDistance', v)}
                      />
                      <VariantPicker
                        label="Oyuncak Boyutu"
                        options={TOY_SIZE_OPTIONS}
                        value={variants[activeVariantTab].toySize}
                        onSelect={(v) => updateVariant(preset.id, activeVariantTab, 'toySize', v)}
                      />
                      <VariantPicker
                        label="Kamera Acisi"
                        options={CAMERA_ANGLE_OPTIONS}
                        value={variants[activeVariantTab].cameraAngle}
                        onSelect={(v) => updateVariant(preset.id, activeVariantTab, 'cameraAngle', v)}
                      />
                      <VariantPicker
                        label="Oyuncak Pozu"
                        options={TOY_POSE_OPTIONS}
                        value={variants[activeVariantTab].toyPose}
                        onSelect={(v) => updateVariant(preset.id, activeVariantTab, 'toyPose', v)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
