'use client';

/**
 * InvestigationMessages.tsx
 *
 * Rotating investigation status messages shown during the ANALYSIS_LOOP
 * while the backend is generating the report.
 *
 * Messages cycle every CYCLE_MS milliseconds via CSS animation + a
 * useInterval pattern. They are purely decorative — no state dependency.
 *
 * Accessibility: aria-live="polite" announces messages to screen readers,
 * but only when visible. When prefers-reduced-motion is set, cycling stops
 * after the first message.
 */

import { useState, useEffect } from 'react';

const MESSAGES = [
  'Examining assumptions...',
  'Testing market logic...',
  'Searching for hidden weaknesses...',
  'Questioning founder bias...',
  'Looking for ignored competitors...',
  'Cross-referencing market data...',
  'Stress-testing unit economics...',
  'Reviewing regulatory exposure...',
  'Profiling founder psychology...',
  'Challenging go-to-market claims...',
];

const CYCLE_MS = 4000;

interface InvestigationMessagesProps {
  /** Whether to show the messages (tied to ANALYSIS_LOOP state) */
  visible: boolean;
}

export function InvestigationMessages({ visible }: InvestigationMessagesProps) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (!visible || prefersReducedMotion) return;

    const interval = setInterval(() => {
      // Fade out first
      setFading(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setFading(false);
      }, 400);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, [visible, prefersReducedMotion]);

  // Reset when hidden
  useEffect(() => {
    if (!visible) {
      setIndex(0);
      setFading(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="investigation-messages"
      role="status"
      aria-live="polite"
      aria-label="Investigation progress"
    >
      <div className="investigation-messages__dots" aria-hidden="true">
        <span className="investigation-dot" />
        <span className="investigation-dot" />
        <span className="investigation-dot" />
      </div>
      <p
        className={`investigation-messages__text ${fading ? 'investigation-messages__text--fading' : ''}`}
        aria-label={MESSAGES[index]}
      >
        {MESSAGES[index]}
      </p>
    </div>
  );
}
