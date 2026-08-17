'use client';

/**
 * TransitionLayer.tsx
 * 
 * A fullscreen overlay that provides smooth fade-to-black transitions
 * between cinematic scenes.
 * 
 * Design: Uses CSS opacity transitions (GPU-accelerated) for buttery
 * smooth fades. The orchestrator controls it via the `active` prop:
 * 
 *   1. Set active=true  → fade to black (~400ms)
 *   2. Swap video source underneath
 *   3. Set active=false → fade from black (~400ms)
 * 
 * Future-ready: the `variant` prop supports different transition styles
 * (only 'fade' is implemented for now).
 */

import { useCallback } from 'react';

// ── Types ───────────────────────────────────────────────────────────────

export type TransitionVariant = 'fade' | 'crossDissolve' | 'wipe';

export interface TransitionLayerProps {
  /** Whether the transition overlay is active (visible) */
  active: boolean;
  /** Duration of the transition in milliseconds */
  duration?: number;
  /** Transition style variant */
  variant?: TransitionVariant;
  /** Called when the fade-in or fade-out animation completes */
  onTransitionComplete?: () => void;
}

// ── Component ───────────────────────────────────────────────────────────

export function TransitionLayer({
  active,
  duration = 400,
  variant = 'fade',
  onTransitionComplete,
}: TransitionLayerProps) {
  const handleTransitionEnd = useCallback(() => {
    onTransitionComplete?.();
  }, [onTransitionComplete]);

  // Only 'fade' is implemented for now
  if (variant !== 'fade') {
    console.warn(
      `[TransitionLayer] Variant "${variant}" is not yet implemented. Falling back to "fade".`,
    );
  }

  return (
    <div
      className="cinematic-transition-layer"
      style={{
        opacity: active ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
      onTransitionEnd={handleTransitionEnd}
      aria-hidden="true"
    />
  );
}
