'use client';

/**
 * CinematicPlayer.tsx
 * 
 * A reusable video player component designed for cinematic sequences.
 * 
 * Key design choices:
 * - No browser controls — this is a cinematic background, not a media player.
 * - Autoplay with muted (required by browsers) + playsInline (mobile).
 * - Smooth opacity transition on load to prevent video flicker.
 * - `isPaused` prop: pauses video playback (e.g., when reading the report)
 *   so the background freezes on its last frame without distracting the user.
 * - Silent failure: if the video source is missing or errors, fires onEnded
 *   so the state machine can advance instead of hanging.
 */

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';

// ── Types ───────────────────────────────────────────────────────────────

export interface CinematicPlayerProps {
  /** Video source URL */
  src: string | null;
  /** Whether the video should loop */
  loop?: boolean;
  /** Whether playback should be paused (e.g. while reading report) */
  isPaused?: boolean;
  /** Called when a non-looping video finishes playing */
  onEnded?: () => void;
  /** Called when the video is loaded and ready to play */
  onReady?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export interface CinematicPlayerHandle {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getElement: () => HTMLVideoElement | null;
}

// ── Component ───────────────────────────────────────────────────────────

export const CinematicPlayer = forwardRef<
  CinematicPlayerHandle,
  CinematicPlayerProps
>(function CinematicPlayer(
  { src, loop = false, isPaused = false, onEnded, onReady, className = '' },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time: number) => {
      if (videoRef.current) videoRef.current.currentTime = time;
    },
    getElement: () => videoRef.current,
  }));

  // ── Video Ready Handler ──────────────────────────────────────────────
  const handleCanPlayThrough = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onReady?.();
  }, [onReady]);

  // ── Video Ended Handler ──────────────────────────────────────────────
  const handleEnded = useCallback(() => {
    if (!loop) {
      onEnded?.();
    }
  }, [loop, onEnded]);

  // ── Error Handler (graceful degradation) ─────────────────────────────
  const handleError = useCallback(() => {
    console.warn(`[CinematicPlayer] Video failed to load: ${src}`);
    setHasError(true);
    setIsLoading(false);
    // Advance the state machine so we don't hang
    onEnded?.();
  }, [src, onEnded]);

  // ── Source Change Effect ─────────────────────────────────────────────
  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const video = videoRef.current;
    if (video) {
      video.src = src;
      video.load();
      if (!isPaused) {
        video.play().catch(() => {
          // Autoplay may fail if no user interaction yet — that's OK
        });
      }
    }
  }, [src]);

  // ── Pause / Play Effect ──────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPaused) {
      video.pause();
    } else if (!isLoading) {
      video.play().catch(() => {});
    }
  }, [isPaused, isLoading]);

  // ── No source → render nothing ──────────────────────────────────────
  if (!src || hasError) {
    return null;
  }

  return (
    <>
      {/* Loading shimmer */}
      {isLoading && (
        <div className="cinematic-loading-shimmer" aria-hidden="true">
          <div className="cinematic-loading-pulse" />
        </div>
      )}

      <video
        ref={videoRef}
        className={`cinematic-video ${isLoading ? 'cinematic-video--loading' : 'cinematic-video--loaded'} ${className}`}
        autoPlay={!isPaused}
        muted
        playsInline
        loop={loop}
        onCanPlayThrough={handleCanPlayThrough}
        onEnded={handleEnded}
        onError={handleError}
        aria-hidden="true"
      />
    </>
  );
});
