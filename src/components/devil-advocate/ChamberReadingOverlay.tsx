'use client';

/**
 * ChamberReadingOverlay.tsx
 *
 * A semi-transparent dark overlay that fades in over the cinematic
 * chamber when the report is open. It does NOT hide the chamber —
 * the video continues playing behind it. This creates the effect of
 * reading a file in a dimly lit room.
 *
 * z-index: sits above the video but below the case file panel.
 * The Devil and the room remain visible through the darkness.
 */

// ── Types ───────────────────────────────────────────────────────────────

interface ChamberReadingOverlayProps {
  /** Whether the overlay is visible (controls fade-in) */
  visible: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

export function ChamberReadingOverlay({ visible }: ChamberReadingOverlayProps) {
  return (
    <div
      className="chamber-reading-overlay"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    />
  );
}
