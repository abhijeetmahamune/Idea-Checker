'use client';

/**
 * DebugPanel.tsx
 * 
 * A floating development panel that shows the current cinematic state
 * and allows forcing any state for rapid iteration.
 * 
 * Visibility:
 * - Always visible in development (NODE_ENV === 'development')
 * - Visible in production only with ?debug=true query param
 */

import { useState } from 'react';
import type { CinematicState } from './DevilStateMachine';

// ── Types ───────────────────────────────────────────────────────────────

interface DebugPanelProps {
  /** Current FSM state */
  currentState: CinematicState;
  /** Force the machine into a specific state */
  onForceState: (state: CinematicState) => void;
  /** Ordered list of all states */
  stateOrder: CinematicState[];
  // ── Milestone 3: Report State Debug ──────────────────────────────
  /** Current report generation status */
  reportStatus?: 'idle' | 'loading' | 'ready' | 'failed';
  /** Force report into ready state (uses mock data) */
  onForceReportReady?: () => void;
  /** Force report into failed state */
  onForceReportFailed?: () => void;
  /** Force report into loading state */
  onForceReportLoading?: () => void;
}

// ── State Colors ────────────────────────────────────────────────────────

const STATE_COLORS: Record<CinematicState, string> = {
  IDLE: '#6b7280',        // gray
  INTRO: '#8b5cf6',       // violet
  ANALYSIS: '#3b82f6',    // blue
  ANALYSIS_LOOP: '#06b6d4', // cyan
  REACTION: '#f59e0b',    // amber
  REPORT: '#10b981',      // emerald
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  idle:    '#6b7280', // gray
  loading: '#06b6d4', // cyan
  ready:   '#10b981', // emerald
  failed:  '#ef4444', // red
};

// ── Component ───────────────────────────────────────────────────────────

export function DebugPanel({
  currentState,
  onForceState,
  stateOrder,
  reportStatus,
  onForceReportReady,
  onForceReportFailed,
  onForceReportLoading,
}: DebugPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Only render in development or with debug query param
  const isDev = process.env.NODE_ENV === 'development';
  const hasDebugParam =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'true';

  if (!isDev && !hasDebugParam) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        fontFamily: 'var(--font-geist-mono, monospace)',
        fontSize: '11px',
        minWidth: isCollapsed ? 'auto' : '180px',
      }}
    >
      {/* Glass card container */}
      <div
        style={{
          background: 'rgba(10, 12, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '11px',
            fontFamily: 'inherit',
          }}
        >
          {/* State indicator dot */}
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: STATE_COLORS[currentState],
              boxShadow: `0 0 8px ${STATE_COLORS[currentState]}`,
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
            {currentState}
          </span>
          <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
            {isCollapsed ? '▲' : '▼'}
          </span>
        </button>

        {/* State buttons */}
        {!isCollapsed && (
          <div
            style={{
              padding: '4px 8px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            <div
              style={{
                padding: '4px 4px 6px',
                marginBottom: '2px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Force State
            </div>
            {stateOrder.map((s) => (
              <button
                key={s}
                onClick={() => onForceState(s)}
                disabled={s === currentState}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background:
                    s === currentState
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'transparent',
                  color:
                    s === currentState
                      ? STATE_COLORS[s]
                      : 'rgba(255, 255, 255, 0.5)',
                  cursor: s === currentState ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  fontWeight: s === currentState ? 700 : 400,
                  textAlign: 'left',
                  transition: 'all 150ms ease',
                  opacity: s === currentState ? 1 : 0.7,
                }}
                onMouseEnter={(e) => {
                  if (s !== currentState) {
                    (e.target as HTMLElement).style.background =
                      'rgba(255, 255, 255, 0.05)';
                    (e.target as HTMLElement).style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (s !== currentState) {
                    (e.target as HTMLElement).style.background = 'transparent';
                    (e.target as HTMLElement).style.opacity = '0.7';
                  }
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: STATE_COLORS[s],
                    opacity: s === currentState ? 1 : 0.4,
                    flexShrink: 0,
                  }}
                />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Report state section — Milestone 3 */}
        {!isCollapsed && reportStatus !== undefined && (
          <div
            style={{
              padding: '4px 8px 8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}
          >
            {/* Section label */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 4px 4px',
                color: 'rgba(255, 255, 255, 0.35)',
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Report API
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: REPORT_STATUS_COLORS[reportStatus] ?? '#6b7280',
                  boxShadow: `0 0 6px ${REPORT_STATUS_COLORS[reportStatus] ?? '#6b7280'}`,
                  marginLeft: '2px',
                }}
              />
              <span style={{ color: REPORT_STATUS_COLORS[reportStatus] ?? '#6b7280', fontWeight: 700 }}>
                {reportStatus.toUpperCase()}
              </span>
            </div>

            {/* Force buttons */}
            {[{
              label: 'Force Ready',
              fn: onForceReportReady,
              active: reportStatus === 'ready',
              color: REPORT_STATUS_COLORS.ready,
            }, {
              label: 'Force Loading',
              fn: onForceReportLoading,
              active: reportStatus === 'loading',
              color: REPORT_STATUS_COLORS.loading,
            }, {
              label: 'Force Failed',
              fn: onForceReportFailed,
              active: reportStatus === 'failed',
              color: REPORT_STATUS_COLORS.failed,
            }].map(({ label, fn, active, color }) => (
              <button
                key={label}
                onClick={fn}
                disabled={!fn || active}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: active ? color : 'rgba(255, 255, 255, 0.5)',
                  cursor: active || !fn ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  fontWeight: active ? 700 : 400,
                  textAlign: 'left',
                  opacity: active ? 1 : 0.7,
                  transition: 'all 150ms ease',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    opacity: active ? 1 : 0.4,
                    flexShrink: 0,
                  }}
                />
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
