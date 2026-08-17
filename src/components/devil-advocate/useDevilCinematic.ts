'use client';

/**
 * useDevilCinematic.ts
 * 
 * The orchestrator hook that wires the state machine to the video player,
 * transition layer, and preloader. This is the single source of truth
 * for the entire cinematic experience.
 * 
 * Responsibilities:
 * 1. Initialize and own the state machine instance
 * 2. Map CinematicState → video src + loop config via VideoManager
 * 3. Coordinate fade transitions between scenes
 * 4. Manage the ANALYSIS_LOOP timer — loops indefinitely until reportReady
 * 5. Preload next video as soon as a scene starts
 * 6. Expose a clean API for the page component
 * 7. (Milestone 2) After REACTION video ends, pause to show the
 *    "I've seen enough" prompt before advancing to REPORT.
 * 8. (Milestone 2) Respect prefers-reduced-motion — skip cinematic.
 * 9. (Milestone 3) Gate ANALYSIS_LOOP advancement on reportReady flag.
 *    When the loop timer fires but reportReady === false, reschedule
 *    rather than advancing to REACTION.
 * 
 * This hook does NOT render anything — it returns state + handlers.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createStateMachine,
  type CinematicState,
  type StateMachineInstance,
  DEVIL_STATE_ORDER,
} from './DevilStateMachine';
import {
  getVideoForState,
  preloadNextVideo,
  preloadInitialAssets,
  type VideoAssetMap,
  DEVIL_ADVOCATE_ASSETS,
} from './VideoManager';

// ── Config ──────────────────────────────────────────────────────────────

const TRANSITION_DURATION = 400; // ms per fade (in or out)
/**
 * How long each ANALYSIS_LOOP iteration lasts before checking reportReady.
 * If reportReady is false, the timer resets for another iteration.
 * This keeps the cinematic seamless regardless of API latency.
 */
const LOOP_TIMEOUT_MS = 8000;

// ── Return Type ─────────────────────────────────────────────────────────

export interface DevilCinematicState {
  /** Current FSM state */
  state: CinematicState;
  /** Video source URL for the current state (null if no video) */
  videoSrc: string | null;
  /** Whether the current video should loop */
  isLooping: boolean;
  /** Whether a fade transition is in progress */
  isTransitioning: boolean;
  /** Whether the report placeholder should be shown */
  isReportVisible: boolean;
  /** Whether the experience has started (user has interacted) */
  hasStarted: boolean;
  /**
   * (Milestone 2) True after the REACTION video ends, before the user
   * clicks "View the Case". Shows the interstitial reaction prompt.
   */
  showReactionPrompt: boolean;
  /** Start the cinematic experience */
  start: () => void;
  /** Force the machine into a specific state (debug) */
  forceState: (target: CinematicState) => void;
  /** Handle video ended event from CinematicPlayer */
  handleVideoEnded: () => void;
  /**
   * (Milestone 2) Called when user clicks "View the Case".
   * Advances the FSM from REACTION → REPORT.
   */
  viewReport: () => void;
  /** The ordered list of all states */
  stateOrder: CinematicState[];
}

// ── Options ──────────────────────────────────────────────────────────────

export interface DevilCinematicOptions {
  /** Video asset map (defaults to DEVIL_ADVOCATE_ASSETS) */
  assets?: VideoAssetMap;
  /**
   * (Milestone 3) Set to true when the backend report is ready.
   * The ANALYSIS_LOOP will not advance to REACTION until this is true.
   * If false when the loop timer fires, the timer resets for another
   * iteration — the loop continues indefinitely until ready.
   *
   * Default: true (for backwards compatibility / demo mode).
   */
  reportReady?: boolean;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useDevilCinematic(
  options: DevilCinematicOptions = {},
): DevilCinematicState {
  const { assets = DEVIL_ADVOCATE_ASSETS, reportReady = true } = options;
  // ── Reduced Motion Detection ───────────────────────────────────────
  // Respect prefers-reduced-motion: reduce. When set, skip the cinematic
  // and open the report immediately on start().
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // ── State Machine ──────────────────────────────────────────────────
  const machineRef = useRef<StateMachineInstance | null>(null);

  if (!machineRef.current) {
    machineRef.current = createStateMachine();
  }

  const machine = machineRef.current;

  // ── React State ────────────────────────────────────────────────────
  const [state, setState] = useState<CinematicState>(machine.getState());
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  /**
   * True after REACTION video ends, before the user clicks "View the Case".
   * The FSM stays in REACTION; we pause the auto-transition here.
   */
  const [showReactionPrompt, setShowReactionPrompt] = useState(false);

  // ── reportReady Ref ────────────────────────────────────────────────
  // We use a ref (not state) so that setTimeout callbacks always see the
  // current value without needing to be recreated on every render.
  const reportReadyRef = useRef(reportReady);
  useEffect(() => {
    reportReadyRef.current = reportReady;
  }, [reportReady]);

  // Refs for cleanup
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Preload on Mount ───────────────────────────────────────────────
  useEffect(() => {
    preloadInitialAssets(assets);
  }, [assets]);

  // ── Apply Video for State ──────────────────────────────────────────
  const applyVideoForState = useCallback(
    (newState: CinematicState) => {
      const videoAsset = getVideoForState(newState, assets);
      if (videoAsset) {
        setVideoSrc(videoAsset.src);
        setIsLooping(videoAsset.loop ?? false);
      } else {
        setVideoSrc(null);
        setIsLooping(false);
      }

      // Preload the next scene's video
      preloadNextVideo(newState, assets);
    },
    [assets],
  );

  // ── Transition Orchestration ───────────────────────────────────────
  const performTransition = useCallback(
    (newState: CinematicState) => {
      // Clear any existing loop timer
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }

      // Phase 1: Fade to black
      setIsTransitioning(true);

      transitionTimerRef.current = setTimeout(() => {
        // Phase 2: Swap video (while screen is black)
        setState(newState);
        applyVideoForState(newState);

        // Phase 3: Fade from black (after a brief hold)
        transitionTimerRef.current = setTimeout(() => {
          setIsTransitioning(false);

          // Start loop timer if entering ANALYSIS_LOOP.
          // (Milestone 3) The loop reschedules itself until reportReady === true.
          if (newState === 'ANALYSIS_LOOP') {
            const scheduleLoopTick = () => {
              loopTimerRef.current = setTimeout(() => {
                if (reportReadyRef.current) {
                  // Report is ready — advance to REACTION
                  machine.send({ type: 'LOOP_TIMEOUT' });
                } else {
                  // Report not ready yet — keep looping seamlessly
                  scheduleLoopTick();
                }
              }, LOOP_TIMEOUT_MS);
            };
            scheduleLoopTick();
          }
        }, TRANSITION_DURATION);
      }, TRANSITION_DURATION);
    },
    [applyVideoForState, machine],
  );

  // ── Subscribe to State Machine ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = machine.subscribe((newState) => {
      performTransition(newState);
    });

    return () => {
      unsubscribe();
      if (loopTimerRef.current) clearTimeout(loopTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [machine, performTransition]);

  // ── Public API ─────────────────────────────────────────────────────
  const start = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);
    // Accessibility: skip cinematic entirely when reduced motion is on
    if (prefersReducedMotion) {
      machine.send({ type: 'FORCE_STATE', target: 'REPORT' });
      return;
    }
    machine.send({ type: 'START' });
  }, [hasStarted, machine, prefersReducedMotion]);

  const forceState = useCallback(
    (target: CinematicState) => {
      machine.send({ type: 'FORCE_STATE', target });
    },
    [machine],
  );

  const handleVideoEnded = useCallback(() => {
    // Milestone 2: When REACTION video ends, pause before advancing.
    // Show the "I've seen enough" interstitial prompt instead of
    // immediately transitioning to REPORT.
    if (machine.getState() === 'REACTION') {
      setShowReactionPrompt(true);
      return; // Do NOT send VIDEO_ENDED yet — wait for user action
    }
    machine.send({ type: 'VIDEO_ENDED' });
  }, [machine]);

  /**
   * Called when the user clicks "View the Case".
   * Hides the reaction prompt and advances the FSM to REPORT.
   */
  const viewReport = useCallback(() => {
    setShowReactionPrompt(false);
    machine.send({ type: 'VIDEO_ENDED' }); // REACTION → REPORT
  }, [machine]);

  return {
    state,
    videoSrc,
    isLooping,
    isTransitioning,
    isReportVisible: state === 'REPORT',
    hasStarted,
    showReactionPrompt,
    start,
    forceState,
    handleVideoEnded,
    viewReport,
    stateOrder: DEVIL_STATE_ORDER,
  };
}
