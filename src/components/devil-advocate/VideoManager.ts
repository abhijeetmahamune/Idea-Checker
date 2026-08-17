/**
 * VideoManager.ts
 * 
 * Centralized video asset registry and preloading engine.
 * 
 * Design Decisions:
 * - No hardcoded filenames in components — everything goes through this map.
 * - Preloading creates off-screen <video> elements to warm the browser cache.
 * - Graceful error handling: if a video fails to load, the system degrades
 *   silently rather than crashing.
 * - Persona-agnostic: each persona defines its own VideoAssetMap.
 */

import type { CinematicState } from './DevilStateMachine';

// ── Types ───────────────────────────────────────────────────────────────

export interface VideoAsset {
  /** Public URL path to the video file */
  src: string;
  /** Whether this scene should loop its video */
  loop?: boolean;
  /** Whether to eagerly preload this asset on init */
  preloadOnInit?: boolean;
}

/**
 * Maps each cinematic state to its video asset configuration.
 * States without a video entry (e.g. IDLE, REPORT) simply have no video.
 */
export type VideoAssetMap = Partial<Record<CinematicState, VideoAsset>>;

// ── Devil's Advocate Asset Map ──────────────────────────────────────────

export const DEVIL_ADVOCATE_ASSETS: VideoAssetMap = {
  INTRO: {
    src: '/videos/devil-advocate/scene-1.mp4',
    loop: false,
    preloadOnInit: true,
  },
  ANALYSIS: {
    src: '/videos/devil-advocate/scene-2.mp4',
    loop: false,
  },
  ANALYSIS_LOOP: {
    src: '/videos/devil-advocate/scene-3.mp4',
    loop: true,
  },
  REACTION: {
    // Reuses scene-3 until a dedicated reaction video is provided
    src: '/videos/devil-advocate/scene-3.mp4',
    loop: false,
  },
};

// ── Preload Cache ───────────────────────────────────────────────────────

const preloadCache = new Map<string, HTMLVideoElement>();

/**
 * Preloads a single video by creating an off-screen <video> element.
 * Resolves when the browser has buffered enough to play through.
 * Rejects gracefully — callers should catch and continue.
 */
export function preloadVideo(src: string): Promise<HTMLVideoElement> {
  // Return cached element if already preloaded
  const cached = preloadCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = src;

    const cleanup = () => {
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('error', onError);
    };

    const onReady = () => {
      cleanup();
      preloadCache.set(src, video);
      resolve(video);
    };

    const onError = () => {
      cleanup();
      console.warn(`[VideoManager] Failed to preload: ${src}`);
      reject(new Error(`Failed to preload video: ${src}`));
    };

    video.addEventListener('canplaythrough', onReady, { once: true });
    video.addEventListener('error', onError, { once: true });

    // Trigger the load
    video.load();
  });
}

// ── State-Aware Helpers ─────────────────────────────────────────────────

/**
 * Returns the video asset config for a given state, or null if the
 * state has no associated video (e.g. IDLE, REPORT).
 */
export function getVideoForState(
  state: CinematicState,
  assets: VideoAssetMap = DEVIL_ADVOCATE_ASSETS,
): VideoAsset | null {
  return assets[state] ?? null;
}

/**
 * Determines the next state's video and preloads it.
 * Call this as soon as a scene starts playing so the next video
 * is ready by the time we transition.
 */
export function preloadNextVideo(
  currentState: CinematicState,
  assets: VideoAssetMap = DEVIL_ADVOCATE_ASSETS,
): void {
  const stateOrder: CinematicState[] = [
    'IDLE',
    'INTRO',
    'ANALYSIS',
    'ANALYSIS_LOOP',
    'REACTION',
    'REPORT',
  ];

  const currentIndex = stateOrder.indexOf(currentState);
  if (currentIndex === -1 || currentIndex >= stateOrder.length - 1) return;

  const nextState = stateOrder[currentIndex + 1];
  const nextAsset = assets[nextState];

  if (nextAsset?.src) {
    preloadVideo(nextAsset.src).catch(() => {
      // Silently ignore — the player will handle missing videos gracefully
    });
  }
}

/**
 * Eagerly preloads all assets marked with preloadOnInit.
 * Call once when the cinematic experience mounts.
 */
export function preloadInitialAssets(
  assets: VideoAssetMap = DEVIL_ADVOCATE_ASSETS,
): void {
  Object.values(assets).forEach((asset) => {
    if (asset?.preloadOnInit && asset.src) {
      preloadVideo(asset.src).catch(() => {
        // Silently ignore
      });
    }
  });
}
