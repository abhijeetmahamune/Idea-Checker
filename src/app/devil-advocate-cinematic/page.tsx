'use client';

/**
 * Devil's Advocate Cinematic Experience — Page
 *
 * Milestone 4: Polish, Transition Excellence & Immersion
 *
 * State architecture (three independent slices):
 *   VideoState  — managed by useDevilCinematic (FSM + video player)
 *   ReportState — managed by useDevilReport (API fetch + caching)
 *   UIState     — local: reportOpen, loadingMode, reportPanelVisible
 *
 * Polish Highlights:
 * 1.  Reaction Ending Pacing: Hold final frame for 700ms, then staggered
 *     text reveal ("I've seen enough.") & CTA ("Open Case File").
 * 2.  Report Opening: Chamber dims smoothly, video pauses on current frame (`isPaused={reportOpen}`)
 *     so the background freezes without distracting the reader.
 * 3.  Return to Chamber: Closing report smoothly fades out, revealing chamber without reload.
 * 4.  Keyboard shortcuts: Escape key closes report. Arrow keys navigate report sections.
 * 5.  Standard/Cinematic Loading selector: Persisted locally & toggleable.
 *
 * Query params:
 *   ?solutionId=<uuid>   — required for real data
 *   ?domain=<string>     — optional domain hint
 */

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { CinematicPlayer }         from '@/components/devil-advocate/CinematicPlayer';
import { TransitionLayer }         from '@/components/devil-advocate/TransitionLayer';
import { VideoOverlay }            from '@/components/devil-advocate/VideoOverlay';
import { DebugPanel }              from '@/components/devil-advocate/DebugPanel';
import { ReactionPrompt }          from '@/components/devil-advocate/ReactionPrompt';
import { ChamberReadingOverlay }   from '@/components/devil-advocate/ChamberReadingOverlay';
import { CaseFilePanel }           from '@/components/devil-advocate/CaseFilePanel';
import { InvestigationMessages }   from '@/components/devil-advocate/InvestigationMessages';
import { ReportErrorState }        from '@/components/devil-advocate/ReportErrorState';
import { LoadingModeSelector, useLoadingMode } from '@/components/devil-advocate/LoadingModeSelector';
import { useDevilCinematic }       from '@/components/devil-advocate/useDevilCinematic';
import { useDevilReport }          from '@/components/devil-advocate/useDevilReport';
import { MOCK_DEVIL_REPORT }       from '@/lib/mock-devil-report';

// ── Inner page component (needs useSearchParams) ──────────────────────────

function DevilAdvocateCinematicInner() {
  const searchParams = useSearchParams();
  const solutionId = searchParams.get('solutionId');
  const reportId   = searchParams.get('reportId');
  const forceNew   = searchParams.get('forceNew') === 'true';
  const domain     = searchParams.get('domain') ?? undefined;

  // ── Loading Mode Preference ─────────────────────────────────────────
  const [loadingMode, setLoadingMode] = useLoadingMode();

  // ── Report State ────────────────────────────────────────────────────
  const {
    status: reportStatus,
    report,
    error: reportError,
    generate,
    retry,
    debugForce,
  } = useDevilReport({ solutionId, reportId, forceNew, domain });

  // ── Cinematic State ─────────────────────────────────────────────────
  const {
    state,
    videoSrc,
    isLooping,
    isTransitioning,
    isReportVisible,
    hasStarted,
    showReactionPrompt,
    start,
    forceState,
    handleVideoEnded,
    viewReport,
    stateOrder,
  } = useDevilCinematic({
    // Gate ANALYSIS_LOOP: don't advance until the report is actually ready.
    reportReady: solutionId ? reportStatus === 'ready' : true,
  });

  // ── UI State ────────────────────────────────────────────────────────
  const [reportOpen, setReportOpen] = useState(false);

  // When the FSM reaches REPORT, auto-open the panel
  if (isReportVisible && !reportOpen) setReportOpen(true);

  // ── Fire report generation when ANALYSIS begins ─────────────────────
  useEffect(() => {
    if (state === 'ANALYSIS' && reportStatus === 'idle' && solutionId) {
      void generate();
    }
  }, [state, reportStatus, solutionId, generate]);

  // ── Standard Mode: fire generate() immediately on "Begin" ───────────
  const [standardStarted, setStandardStarted] = useState(false);
  const handleStandardBegin = useCallback(() => {
    setStandardStarted(true);
    if (reportStatus === 'idle') void generate();
  }, [generate, reportStatus]);

  // When standard mode report is ready → open panel
  useEffect(() => {
    if (loadingMode === 'standard' && reportStatus === 'ready') {
      setReportOpen(true);
    }
  }, [loadingMode, reportStatus]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleReturnToChamber = () => setReportOpen(false);

  const handleViewCase = () => {
    viewReport();        // advances FSM: REACTION → REPORT
    setReportOpen(true);
  };

  const handleRetryReport = useCallback(() => {
    retry();
  }, [retry]);

  // ── Debug Callbacks ─────────────────────────────────────────────────
  const handleForceReportReady = useCallback(() => {
    debugForce('ready', report ?? MOCK_DEVIL_REPORT);
  }, [debugForce, report]);

  const handleForceReportFailed = useCallback(() => {
    debugForce('failed', null);
  }, [debugForce]);

  const handleForceReportLoading = useCallback(() => {
    debugForce('loading', null);
  }, [debugForce]);

  // ── Standard Mode Render ────────────────────────────────────────────
  if (loadingMode === 'standard') {
    return (
      <div className="cinematic-container" style={{ background: '#080a12' }}>
        {/* Start prompt (standard) */}
        {!standardStarted && (
          <button
            onClick={handleStandardBegin}
            className="cinematic-start-prompt"
            type="button"
            aria-label="Begin the Devil's Advocate analysis"
          >
            <div className="cinematic-start-glow" aria-hidden="true" />
            <div className="cinematic-start-icon" aria-hidden="true">
              <span className="cinematic-start-emoji">😈</span>
            </div>
            <h2 className="cinematic-start-title">Devil&apos;s Advocate</h2>
            <p className="cinematic-start-subtitle">Click to generate your report</p>
            <div className="cinematic-start-ring" aria-hidden="true" />
            
            <div
              className="cinematic-start-mode-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              <LoadingModeSelector value={loadingMode} onChange={setLoadingMode} />
            </div>
          </button>
        )}

        {/* Standard loading spinner */}
        {standardStarted && reportStatus === 'loading' && (
          <div className="standard-loading-screen" role="status" aria-label="Generating report">
            <div className="standard-loading-icon" aria-hidden="true">😈</div>
            <p className="standard-loading-text">Summoning the Advocate...</p>
            <div className="standard-loading-dots" aria-hidden="true">
              <span className="investigation-dot" />
              <span className="investigation-dot" />
              <span className="investigation-dot" />
            </div>
          </div>
        )}

        {/* Standard mode error */}
        {standardStarted && reportStatus === 'failed' && (
          <ReportErrorState
            visible={true}
            error={reportError}
            onRetry={handleRetryReport}
            onDismiss={() => setStandardStarted(false)}
          />
        )}

        {/* Standard mode report panel */}
        {reportOpen && report && (
          <CaseFilePanel
            onClose={() => {
              setReportOpen(false);
              setStandardStarted(false);
            }}
            report={report}
            solutionId={solutionId ?? undefined}
          />
        )}

        <DebugPanel
          currentState={state}
          onForceState={forceState}
          stateOrder={stateOrder}
          reportStatus={reportStatus}
          onForceReportReady={handleForceReportReady}
          onForceReportFailed={handleForceReportFailed}
          onForceReportLoading={handleForceReportLoading}
        />
      </div>
    );
  }

  // ── Cinematic Mode Render ────────────────────────────────────────────
  return (
    <div className="cinematic-container">

      {/* ── Start Prompt ─────────────────────────────────────────────── */}
      {!hasStarted && (
        <button
          onClick={start}
          className="cinematic-start-prompt"
          type="button"
          aria-label="Begin the Devil's Advocate experience"
        >
          <div className="cinematic-start-glow" aria-hidden="true" />

          <div className="cinematic-start-icon" aria-hidden="true">
            <span className="cinematic-start-emoji">😈</span>
          </div>

          <h2 className="cinematic-start-title">Devil&apos;s Advocate</h2>
          <p className="cinematic-start-subtitle">Click anywhere to begin the experience</p>

          <div className="cinematic-start-ring" aria-hidden="true" />

          <div
            className="cinematic-start-mode-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <LoadingModeSelector value={loadingMode} onChange={setLoadingMode} />
          </div>
        </button>
      )}

      {/* ── Video Layer ──────────────────────────────────────────────────
          Paused when reportOpen is true so the background stays still.
      ── */}
      {hasStarted && videoSrc && (
        <CinematicPlayer
          src={videoSrc}
          loop={isLooping}
          isPaused={reportOpen}
          onEnded={handleVideoEnded}
        />
      )}

      {/* ── Analysis HUD ───────────────────────────────────────────────── */}
      {hasStarted && (state === 'ANALYSIS' || state === 'ANALYSIS_LOOP') && !showReactionPrompt && (
        <VideoOverlay visible={true}>
          <InvestigationMessages visible={state === 'ANALYSIS_LOOP'} />
        </VideoOverlay>
      )}

      {/* ── Report Error ───────────────────────────────────────────────── */}
      <ReportErrorState
        visible={reportStatus === 'failed' && !reportOpen && state !== 'REPORT'}
        error={reportError}
        onRetry={handleRetryReport}
        onDismiss={() => {}}
      />

      {/* ── Reaction Prompt ────────────────────────────────────────────── */}
      <ReactionPrompt
        visible={showReactionPrompt}
        onViewCase={handleViewCase}
      />

      {/* ── Chamber Reading Overlay ────────────────────────────────────── */}
      <ChamberReadingOverlay visible={reportOpen} />

      {/* ── Case File Panel ────────────────────────────────────────────── */}
      {reportOpen && (
        <CaseFilePanel
          onClose={handleReturnToChamber}
          report={report ?? MOCK_DEVIL_REPORT}
          solutionId={solutionId ?? undefined}
        />
      )}

      {/* ── Transition Layer ─────────────────────────────────────────── */}
      <TransitionLayer
        active={isTransitioning}
        duration={400}
      />

      {/* ── Debug Panel ─────────────────────────────────────────────── */}
      <DebugPanel
        currentState={state}
        onForceState={forceState}
        stateOrder={stateOrder}
        reportStatus={reportStatus}
        onForceReportReady={handleForceReportReady}
        onForceReportFailed={handleForceReportFailed}
        onForceReportLoading={handleForceReportLoading}
      />
    </div>
  );
}

// ── Outer wrapper (Suspense boundary for useSearchParams) ─────────────────

export default function DevilAdvocateCinematicPage() {
  return (
    <Suspense fallback={
      <div className="cinematic-container" style={{ background: '#080a12' }}>
        <div className="standard-loading-screen">
          <div className="standard-loading-icon" aria-hidden="true">😈</div>
          <p className="standard-loading-text">Loading...</p>
        </div>
      </div>
    }>
      <DevilAdvocateCinematicInner />
    </Suspense>
  );
}
