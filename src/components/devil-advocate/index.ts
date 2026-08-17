/**
 * Barrel exports for the Devil's Advocate cinematic engine.
 *
 * Import from '@/components/devil-advocate' for clean imports.
 *
 * Milestone 1: Cinematic engine + state machine
 * Milestone 2: ReactionPrompt, ChamberReadingOverlay, CaseFilePanel
 */

// ── Milestone 1: Core Cinematic Engine ──────────────────────────────────

export { CinematicPlayer } from './CinematicPlayer';
export type { CinematicPlayerProps, CinematicPlayerHandle } from './CinematicPlayer';

export { TransitionLayer } from './TransitionLayer';
export type { TransitionLayerProps, TransitionVariant } from './TransitionLayer';

export { VideoOverlay } from './VideoOverlay';
export type { VideoOverlayProps } from './VideoOverlay';

export { DebugPanel } from './DebugPanel';

export { ReportPlaceholder } from './ReportPlaceholder';

export { useDevilCinematic } from './useDevilCinematic';
export type { DevilCinematicState } from './useDevilCinematic';

export { DEVIL_ADVOCATE_ASSETS, preloadVideo, getVideoForState } from './VideoManager';
export type { VideoAsset, VideoAssetMap } from './VideoManager';

export { createStateMachine, DEVIL_STATE_ORDER } from './DevilStateMachine';
export type { CinematicState, CinematicEvent, StateMachineConfig, StateMachineInstance } from './DevilStateMachine';

// ── Milestone 2: Chamber Report Experience ──────────────────────────────

export { ReactionPrompt } from './ReactionPrompt';
export { ChamberReadingOverlay } from './ChamberReadingOverlay';
export { CaseFilePanel } from './CaseFilePanel';

// ── Milestone 3: Real Backend Connection ─────────────────────────────────

export { useDevilReport } from './useDevilReport';
export type { DevilReportState, ReportStatus, UseDevilReportOptions } from './useDevilReport';

export { InvestigationMessages } from './InvestigationMessages';
export { ReportErrorState } from './ReportErrorState';
export { LoadingModeSelector, useLoadingMode } from './LoadingModeSelector';
export type { LoadingMode } from './LoadingModeSelector';

export type { DevilCinematicOptions } from './useDevilCinematic';
