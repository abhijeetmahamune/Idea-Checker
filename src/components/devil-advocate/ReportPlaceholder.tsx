'use client';

/**
 * ReportPlaceholder.tsx
 * 
 * The terminal state UI for the cinematic experience.
 * Shows a styled placeholder where the real Devil's Advocate
 * report will be connected in a future milestone.
 */

// ── Types ───────────────────────────────────────────────────────────────

interface ReportPlaceholderProps {
  /** Whether the placeholder is visible (controls entrance animation) */
  visible: boolean;
}

// ── Component ───────────────────────────────────────────────────────────

export function ReportPlaceholder({ visible }: ReportPlaceholderProps) {
  if (!visible) return null;

  return (
    <div className="cinematic-report-placeholder">
      {/* Background ambient glow */}
      <div className="cinematic-report-glow cinematic-report-glow--left" />
      <div className="cinematic-report-glow cinematic-report-glow--right" />

      {/* Content */}
      <div className="cinematic-report-content animate-fade-slide-up">
        {/* Icon */}
        <div className="cinematic-report-icon">
          <span className="cinematic-report-emoji">😈</span>
        </div>

        {/* Title */}
        <h1 className="cinematic-report-title">
          DEVIL&apos;S ADVOCATE
        </h1>

        {/* Divider */}
        <div className="cinematic-report-divider" />

        {/* Subtitle */}
        <p className="cinematic-report-subtitle">
          Report Placeholder
        </p>

        {/* Note */}
        <p className="cinematic-report-note">
          The real report will be connected in the next milestone.
        </p>
      </div>
    </div>
  );
}
