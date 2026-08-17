'use client';

/**
 * VideoOverlay.tsx
 * 
 * A transparent overlay layer positioned above the video but below
 * the transition layer. This is the future home for:
 * 
 * - Subtitles / captions
 * - Character dialogue bubbles
 * - Report data overlaid on the video
 * - Any HUD-style information
 * 
 * For this milestone it renders as an empty shell — just the
 * structural slot for future content.
 */

// ── Types ───────────────────────────────────────────────────────────────

export interface VideoOverlayProps {
  /** Whether the overlay content is visible */
  visible?: boolean;
  /** Overlay content (subtitles, dialogue, report, etc.) */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// ── Component ───────────────────────────────────────────────────────────

export function VideoOverlay({
  visible = true,
  children,
  className = '',
}: VideoOverlayProps) {
  return (
    <div
      className={`cinematic-overlay ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 300ms ease',
      }}
    >
      {children}
    </div>
  );
}
