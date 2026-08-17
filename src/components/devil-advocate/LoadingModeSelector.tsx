'use client';

/**
 * LoadingModeSelector.tsx
 *
 * Shown on the start prompt. Lets users choose between:
 *   ● Cinematic Experience  (default)
 *   ○ Standard Loading      (skip videos, go straight to report)
 *
 * Preference is stored in localStorage under the key
 * 'devil-advocate-loading-mode' so it persists across page visits.
 *
 * This component is purely presentational — it reads/writes the preference
 * and notifies the parent via onChange. The parent decides what to render.
 */

import { useState, useEffect } from 'react';

export type LoadingMode = 'cinematic' | 'standard';

const STORAGE_KEY = 'devil-advocate-loading-mode';

interface LoadingModeSelectorProps {
  /** Current mode */
  value: LoadingMode;
  /** Called when user selects a different mode */
  onChange: (mode: LoadingMode) => void;
}

export function LoadingModeSelector({ value, onChange }: LoadingModeSelectorProps) {
  return (
    <div className="loading-mode-selector" role="radiogroup" aria-label="Loading mode preference">
      <label className="loading-mode-option">
        <input
          type="radio"
          name="loading-mode"
          value="cinematic"
          checked={value === 'cinematic'}
          onChange={() => onChange('cinematic')}
          className="loading-mode-radio"
        />
        <span className="loading-mode-label">
          <span className="loading-mode-label__title">Cinematic Experience</span>
          <span className="loading-mode-label__desc">Full immersive introduction</span>
        </span>
      </label>

      <label className="loading-mode-option">
        <input
          type="radio"
          name="loading-mode"
          value="standard"
          checked={value === 'standard'}
          onChange={() => onChange('standard')}
          className="loading-mode-radio"
        />
        <span className="loading-mode-label">
          <span className="loading-mode-label__title">Standard Loading</span>
          <span className="loading-mode-label__desc">Skip to report immediately</span>
        </span>
      </label>
    </div>
  );
}

/**
 * Hook to read/write the loading mode preference from localStorage.
 * Returns the persisted preference and a setter that also persists.
 */
export function useLoadingMode(): [LoadingMode, (mode: LoadingMode) => void] {
  const [mode, setMode] = useState<LoadingMode>('cinematic');

  // Read from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'cinematic' || stored === 'standard') {
        setMode(stored);
      }
    } catch {
      // localStorage unavailable (SSR, private mode, etc.) — use default
    }
  }, []);

  const setAndPersist = (newMode: LoadingMode) => {
    setMode(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore storage errors
    }
  };

  return [mode, setAndPersist];
}
