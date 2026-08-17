'use client';

/**
 * ReportErrorState.tsx
 *
 * Shown inside the chamber when Devil's Advocate report generation fails.
 * Stays inside the cinematic experience — does NOT navigate away.
 *
 * Actions:
 *   Retry        — restarts report generation only (no video replay)
 *   Try Again Later — dismisses and returns to chamber
 *   Report Problem  — logs to console (stub; future: sends error report)
 *
 * The chamber video continues playing behind this overlay.
 */

interface ReportErrorStateProps {
  /** Whether this error state is visible */
  visible: boolean;
  /** The error message from the API */
  error: string | null;
  /** Retry report generation (no cinematic replay) */
  onRetry: () => void;
  /** Dismiss and return to watching the chamber */
  onDismiss: () => void;
}

export function ReportErrorState({
  visible,
  error,
  onRetry,
  onDismiss,
}: ReportErrorStateProps) {
  if (!visible) return null;

  const handleReportProblem = () => {
    // Stub: future milestone will send error telemetry
    console.warn('[DevilAdvocate] User reported a problem:', error);
    onDismiss();
  };

  return (
    <div
      className="report-error-state"
      role="alertdialog"
      aria-modal="false"
      aria-label="Report generation failed"
    >
      {/* Ambient dark vignette */}
      <div className="report-error-state__vignette" aria-hidden="true" />

      {/* Content card */}
      <div className="report-error-state__card">
        {/* Icon */}
        <div className="report-error-state__icon" aria-hidden="true">
          ⚠
        </div>

        {/* Title */}
        <h2 className="report-error-state__title">
          The Advocate could not complete the new case.
        </h2>

        {/* Error detail (only shown in dev/debug) */}
        {process.env.NODE_ENV === 'development' && error && (
          <p className="report-error-state__detail">{error}</p>
        )}

        {/* Divider */}
        <div className="report-error-state__divider" aria-hidden="true" />

        {/* Actions */}
        <div className="report-error-state__actions" role="group" aria-label="Error recovery options">
          <button
            id="error-retry-btn"
            type="button"
            className="report-error-state__btn report-error-state__btn--primary"
            onClick={onRetry}
            aria-label="Retry report generation"
          >
            Retry
          </button>

          <button
            id="error-later-btn"
            type="button"
            className="report-error-state__btn report-error-state__btn--ghost"
            onClick={onDismiss}
            aria-label="Return to previous case"
          >
            Return to Previous Case
          </button>

          <button
            id="error-report-btn"
            type="button"
            className="report-error-state__btn report-error-state__btn--ghost"
            onClick={handleReportProblem}
            aria-label="Report this problem"
          >
            Report Problem
          </button>
        </div>
      </div>
    </div>
  );
}
