'use client';

import { SigmaSettings } from '@/lib/types';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface SigmaControlProps {
  sigmaSettings: SigmaSettings;
  onChange: (settings: SigmaSettings) => void;
}

const SIGMA_MIN = 0;
const SIGMA_MAX = 4;
const SIGMA_STEP = 0.5;
const SIGMA_OPTIONS = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4];

export function SigmaControl({ sigmaSettings, onChange }: SigmaControlProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSelect = (value: number) => {
    onChange({ multiplier: value });
  };

  // --- Range slider logic ---
  const getValueFromPosition = useCallback((clientX: number): number => {
    if (!sliderRef.current) return sigmaSettings.multiplier;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = SIGMA_MIN + ratio * (SIGMA_MAX - SIGMA_MIN);
    const snapped = Math.round(raw / SIGMA_STEP) * SIGMA_STEP;
    return Math.max(SIGMA_MIN, Math.min(SIGMA_MAX, parseFloat(snapped.toFixed(1))));
  }, [sigmaSettings.multiplier]);

  const handleSliderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const val = getValueFromPosition(e.clientX);
    onChange({ multiplier: val });
  }, [getValueFromPosition, onChange]);

  const handleSliderTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const val = getValueFromPosition(touch.clientX);
    onChange({ multiplier: val });
  }, [getValueFromPosition, onChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const val = getValueFromPosition(e.clientX);
      onChange({ multiplier: val });
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const val = getValueFromPosition(touch.clientX);
      onChange({ multiplier: val });
    };
    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, getValueFromPosition, onChange]);

  const sliderPercent = SIGMA_MAX === SIGMA_MIN
    ? 0
    : ((sigmaSettings.multiplier - SIGMA_MIN) / (SIGMA_MAX - SIGMA_MIN)) * 100;

  return (
    <div className="relative">
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-4">
        {/* Label + Info button side by side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-indigo-100 p-1.5 rounded-lg">
            <svg className="h-4 w-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16M4 4l8 16M12 20l8-16" />
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">Sigma (σ) Multiplier</span>
          {/* Info button — slightly larger */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-1.5 rounded-lg transition-colors ${
              showInfo
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title="How sigma-based alerting works"
          >
            <Info className="h-4.5 w-4.5" style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Volume-bar style selector */}
        <div className="flex items-end gap-1 flex-shrink-0">
          {SIGMA_OPTIONS.map((val) => {
            const isSelected = sigmaSettings.multiplier === val;
            const isFilled = val <= sigmaSettings.multiplier;
            // 0 gets a short bar, then scales up
            const barHeight = val === 0
              ? 14
              : Math.round(16 + (val / 4) * 24);
            return (
              <button
                key={val}
                onClick={() => handleSelect(val)}
                className={`relative w-8 rounded transition-all text-[10px] font-bold border flex items-end justify-center ${
                  isSelected
                    ? val === 0
                      ? 'bg-gray-700 text-white border-gray-800 shadow-md scale-105 z-10'
                      : 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-105 z-10'
                    : isFilled
                      ? val === 0
                        ? 'bg-gray-300 text-gray-700 border-gray-400 hover:bg-gray-400'
                        : 'bg-indigo-200 text-indigo-800 border-indigo-300 hover:bg-indigo-300'
                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 hover:text-gray-700'
                }`}
                style={{ height: `${barHeight}px` }}
                title={val === 0 ? 'No sigma threshold — alert everything above Avg' : `Alert threshold: Avg + ${val}σ`}
              >
                <span className="pb-0.5">{val}</span>
              </button>
            );
          })}
        </div>

        {/* Draggable range slider */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-medium text-gray-400 flex-shrink-0 w-4 text-right">{SIGMA_MIN}</span>
          <div
            ref={sliderRef}
            className="relative flex-1 h-8 flex items-center cursor-pointer select-none touch-none"
            onMouseDown={handleSliderMouseDown}
            onTouchStart={handleSliderTouchStart}
          >
            {/* Track background */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-gray-200 rounded-full" />
            {/* Filled track */}
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-2 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-[width] duration-75"
              style={{ width: `${sliderPercent}%` }}
            />
            {/* Tick marks */}
            {SIGMA_OPTIONS.map((val) => {
              const pct = ((val - SIGMA_MIN) / (SIGMA_MAX - SIGMA_MIN)) * 100;
              const isActive = val <= sigmaSettings.multiplier;
              return (
                <div
                  key={val}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${pct}%` }}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-white' : 'bg-gray-400'
                  }`} />
                </div>
              );
            })}
            {/* Thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-[left] duration-75 flex items-center justify-center ${
                isDragging
                  ? 'bg-indigo-700 scale-110 shadow-indigo-300'
                  : 'bg-indigo-600 hover:scale-110'
              }`}
              style={{ left: `${sliderPercent}%` }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            {/* Value tooltip above thumb */}
            <div
              className={`absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white transition-all duration-75 ${
                isDragging ? 'bg-indigo-700 opacity-100 scale-100' : 'bg-indigo-600 opacity-0 scale-90'
              }`}
              style={{ left: `${sliderPercent}%` }}
            >
              {sigmaSettings.multiplier}σ
            </div>
          </div>
          <span className="text-[10px] font-medium text-gray-400 flex-shrink-0 w-4">{SIGMA_MAX}</span>
        </div>

        {/* Current threshold badge */}
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${
            sigmaSettings.multiplier === 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              sigmaSettings.multiplier === 0 ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className={`font-semibold ${
              sigmaSettings.multiplier === 0 ? 'text-amber-700' : 'text-red-700'
            }`}>
              {sigmaSettings.multiplier === 0
                ? 'Alert above Avg'
                : `Alert at ${sigmaSettings.multiplier}σ`}
            </span>
          </span>
        </div>
      </div>

      {/* Info popover */}
      {showInfo && (
        <div className="absolute top-full left-0 right-0 mt-2 z-20">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs text-blue-800 space-y-1.5">
                <p className="font-bold text-sm text-blue-900 mb-2">How Sigma-Based Alerting Works</p>
                <p><strong>Finding Rate</strong> = Number of Findings / Number of EOD Applications per month.</p>
                <p><strong>Weighted Average (Avg)</strong> = Sum(rate × EOD) / Sum(EOD) — months with more EODs carry more weight.</p>
                <p><strong>Weighted Sigma (σ)</strong> = sqrt(Sum(EOD × (rate - Avg)²) / Sum(EOD))</p>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> <strong>Normal:</strong></span>{' '}
                    {sigmaSettings.multiplier === 0
                      ? 'Rate is at or below the weighted Avg'
                      : `Rate is within Avg + ${sigmaSettings.multiplier} × σ`}
                  </p>
                  <p>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> <strong>Alert:</strong></span>{' '}
                    {sigmaSettings.multiplier === 0
                      ? 'Rate exceeds the weighted Avg'
                      : `Rate exceeds Avg + ${sigmaSettings.multiplier} × σ`}
                  </p>
                </div>
                {sigmaSettings.multiplier === 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-200">
                    <p className="text-amber-700 font-medium">⚠️ With σ = 0, any value above the weighted average triggers an alert. This is the most sensitive setting.</p>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <p><strong>Aircraft:</strong> Each aircraft&apos;s rate compared to fleet-wide weighted Avg &amp; σ.</p>
                  <p><strong>Component:</strong> Each component&apos;s own weighted Avg &amp; σ across all months.</p>
                  <p><strong>ATA:</strong> Each ATA chapter&apos;s own weighted Avg &amp; σ across all months.</p>
                </div>
                <p className="mt-1 text-blue-600">Months with no EOD data are excluded. Click any alert row to view its findings.</p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 text-blue-400 hover:text-blue-600 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
