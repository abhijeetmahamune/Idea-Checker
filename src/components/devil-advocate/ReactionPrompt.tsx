'use client';

/**
 * ReactionPrompt.tsx
 *
 * The interstitial shown after the REACTION video ends, before the
 * report opens. The chamber is still behind it — this floats on top.
 *
 * Sequence pacing:
 *   1. Hold frame for ~700ms (chamber stays dark & still)
 *   2. Fade in "I've seen enough." tagline
 *   3. Pause 500ms
 *   4. Animate CTA button ("Open Case File") with elegant glow
 *
 * Keyboard:
 *   - Auto-focuses CTA button once revealed
 *   - Pressing Enter or Space triggers onViewCase
 */

import { useState, useEffect, useRef } from 'react';

interface ReactionPromptProps {
  /** Whether the prompt is visible */
  visible: boolean;
  /** Called when the user clicks "Open Case File" */
  onViewCase: () => void;
}

export function ReactionPrompt({ visible, onViewCase }: ReactionPromptProps) {
  // Stage 0: hidden/holding frame
  // Stage 1: text visible
  // Stage 2: CTA visible & interactive
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visible) {
      setStage(0);
      return;
    }

    // Step 1: Hold final frame for 700ms before showing text
    const timer1 = setTimeout(() => {
      setStage(1);
    }, 700);

    // Step 2: Show CTA button 500ms after text (1200ms total)
    const timer2 = setTimeout(() => {
      setStage(2);
    }, 1250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [visible]);

  // Auto-focus CTA button when stage 2 is reached
  useEffect(() => {
    if (stage === 2 && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [stage]);

  if (!visible) return null;

  return (
    <div className="reaction-prompt" aria-live="polite">
      {/* Ambient vignette to darken the chamber for focus */}
      <div className={`reaction-prompt__vignette ${stage > 0 ? 'reaction-prompt__vignette--active' : ''}`} aria-hidden="true" />

      {/* Center content */}
      <div className="reaction-prompt__content">
        {/* Top line */}
        <div className={`reaction-prompt__line ${stage >= 1 ? 'reaction-prompt__line--visible' : ''}`} aria-hidden="true" />

        {/* Tagline */}
        <p className={`reaction-prompt__tagline ${stage >= 1 ? 'reaction-prompt__tagline--visible' : ''}`}>
          I&apos;ve seen enough.
        </p>

        {/* CTA Button */}
        <div className={`reaction-prompt__cta-wrapper ${stage >= 2 ? 'reaction-prompt__cta-wrapper--visible' : ''}`}>
          <button
            ref={buttonRef}
            id="view-the-case-btn"
            type="button"
            className="reaction-prompt__cta"
            onClick={onViewCase}
            disabled={stage < 2}
            aria-label="Open the Devil's Advocate case file report"
          >
            <span className="reaction-prompt__cta-text">Open Case File</span>
            <span className="reaction-prompt__cta-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        {/* Bottom line */}
        <div className={`reaction-prompt__line ${stage >= 1 ? 'reaction-prompt__line--visible' : ''}`} aria-hidden="true" />
      </div>
    </div>
  );
}
