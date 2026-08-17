'use client';

/**
 * useDevilReport.ts
 *
 * Manages ALL report API state for the cinematic Devil's Advocate experience.
 * This hook is completely independent of the video/cinematic state.
 *
 * Responsibilities:
 * 1. On mount: check for an existing report (GET /api/devil-advocate/exists)
 * 2. If report exists → status = 'ready' immediately (no AI call needed)
 * 3. generate() → POST /api/devil-advocate → status = 'loading' → 'ready'/'failed'
 * 4. retry() → same as generate() (for the error recovery flow)
 *
 * State machine:
 *   idle ──generate()──► loading ──success──► ready
 *          ↑                     └──error───► failed ──retry()──► loading
 *   (pre-checked existing report also goes idle → ready)
 *
 * This hook does NOT render anything — pure state + handlers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DevilReport } from '@/lib/mock-devil-report';

// ── Types ────────────────────────────────────────────────────────────────

export type ReportStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface DevilReportState {
  /** Current report generation status */
  status: ReportStatus;
  /** The generated report — non-null when status === 'ready' */
  report: DevilReport | null;
  /** Error message — non-null when status === 'failed' */
  error: string | null;
  /**
   * Trigger report generation.
   * Called by the page when the ANALYSIS video begins.
   * No-ops if already loading or ready.
   */
  generate: () => void;
  /**
   * Retry after a failure.
   * Resets to 'loading' and retries the POST without replaying the cinematic.
   */
  retry: () => void;
  /**
   * Force a specific status (debug mode only).
   * Pass null for report to keep the existing one.
   */
  debugForce: (status: ReportStatus, report?: DevilReport | null) => void;
}

export interface UseDevilReportOptions {
  /** The solution UUID. null → demo mode (no API calls). */
  solutionId: string | null;
  /** Optional report UUID to view a specific historical version */
  reportId?: string | null;
  /** Force generating a new challenge version (Challenge Again) */
  forceNew?: boolean;
  /** Optional domain hint passed to the generator */
  domain?: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useDevilReport({
  solutionId,
  reportId,
  forceNew = false,
  domain,
}: UseDevilReportOptions): DevilReportState {
  const [status, setStatus] = useState<ReportStatus>('idle');
  const [report, setReport] = useState<DevilReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate calls (e.g. StrictMode double-mount)
  const generatingRef = useRef(false);
  const checkedExistingRef = useRef(false);

  // ── Check for Existing Report on Mount ───────────────────────────────
  // If forceNew is false and a report exists for this solution/reportId, mark ready
  useEffect(() => {
    if (!solutionId || checkedExistingRef.current || forceNew) return;
    checkedExistingRef.current = true;

    const checkExisting = async () => {
      try {
        const query = `/api/devil-advocate/exists?solutionId=${encodeURIComponent(solutionId)}${
          reportId ? `&reportId=${encodeURIComponent(reportId)}` : ''
        }`;
        const res = await fetch(query);
        if (!res.ok) return; // Auth error or server error — silently ignore, will generate fresh

        const data = await res.json();
        if (data.exists && data.report) {
          setReport(data.report as DevilReport);
          setStatus('ready');
        }
      } catch {
        // Network error — silently ignore, generate fresh on demand
      }
    };

    void checkExisting();
  }, [solutionId, reportId, forceNew]);

  // ── Generate ──────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    // Guard: no-op if no solutionId, already running, or already ready
    if (!solutionId || generatingRef.current || status === 'ready') return;

    generatingRef.current = true;
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/devil-advocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solutionId, domain }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `API error ${res.status}`);
      }

      setReport(data.report as DevilReport);
      setStatus('ready');
    } catch (err: any) {
      setError(err?.message || 'The Advocate could not reach a verdict.');
      setStatus('failed');
    } finally {
      generatingRef.current = false;
    }
  }, [solutionId, domain, status]);

  // ── Retry ─────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    if (generatingRef.current) return;
    // Reset status to idle so generate() will run again
    setStatus('idle');
    setError(null);
    // generate() reads status from state, so we need the next tick
    // Use a small trick: reset the guard so the next generate() call works
    generatingRef.current = false;
  }, []);

  // Re-trigger generate after retry sets status back to idle
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current === 'failed' && status === 'idle') {
      void generate();
    }
    prevStatusRef.current = status;
  }, [status, generate]);

  // ── Debug Force ───────────────────────────────────────────────────────
  const debugForce = useCallback(
    (newStatus: ReportStatus, newReport?: DevilReport | null) => {
      setStatus(newStatus);
      setError(null);
      generatingRef.current = false;
      if (newReport !== undefined) {
        setReport(newReport);
      }
    },
    [],
  );

  return {
    status,
    report,
    error,
    generate,
    retry,
    debugForce,
  };
}
