/**
 * DevilStateMachine.ts
 * 
 * A pure TypeScript finite state machine that orchestrates the cinematic
 * video sequence. This has zero React dependency — it can be tested,
 * reused, and composed independently.
 * 
 * Design: The machine is persona-agnostic. The Devil's Advocate is just
 * the first consumer. Future personas (Investor, Judge, etc.) can define
 * their own state graphs and reuse the same engine.
 */

// ── State & Event Types ─────────────────────────────────────────────────

export type CinematicState =
  | 'IDLE'
  | 'INTRO'
  | 'ANALYSIS'
  | 'ANALYSIS_LOOP'
  | 'REACTION'
  | 'REPORT';

export type CinematicEvent =
  | { type: 'START' }
  | { type: 'VIDEO_ENDED' }
  | { type: 'LOOP_TIMEOUT' }
  | { type: 'FORCE_STATE'; target: CinematicState };

// ── Transition Map ──────────────────────────────────────────────────────

/**
 * Defines which state follows which, and what event triggers the move.
 * Each entry maps: [currentState][eventType] → nextState
 */
type TransitionTable = {
  [S in CinematicState]?: {
    [E in CinematicEvent['type']]?: CinematicState;
  };
};

const DEVIL_TRANSITIONS: TransitionTable = {
  IDLE: {
    START: 'INTRO',
  },
  INTRO: {
    VIDEO_ENDED: 'ANALYSIS',
  },
  ANALYSIS: {
    VIDEO_ENDED: 'ANALYSIS_LOOP',
  },
  ANALYSIS_LOOP: {
    LOOP_TIMEOUT: 'REACTION',
  },
  REACTION: {
    VIDEO_ENDED: 'REPORT',
  },
  // REPORT is a terminal state — no transitions out
};

// ── Subscriber ──────────────────────────────────────────────────────────

type StateListener = (
  newState: CinematicState,
  prevState: CinematicState,
) => void;

// ── State Machine Config ────────────────────────────────────────────────

export interface StateMachineConfig {
  /** Initial state (defaults to IDLE) */
  initialState?: CinematicState;
  /** Custom transition table (defaults to DEVIL_TRANSITIONS) */
  transitions?: TransitionTable;
}

// ── State Machine Instance ──────────────────────────────────────────────

export interface StateMachineInstance {
  /** Get the current state */
  getState: () => CinematicState;
  /** Send an event to the machine */
  send: (event: CinematicEvent) => void;
  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe: (listener: StateListener) => () => void;
  /** Reset to the initial state */
  reset: () => void;
  /** Get the full ordered list of states in this machine */
  getStateOrder: () => CinematicState[];
}

// ── Factory ─────────────────────────────────────────────────────────────

/** The ordered sequence of states for the Devil's Advocate persona */
export const DEVIL_STATE_ORDER: CinematicState[] = [
  'IDLE',
  'INTRO',
  'ANALYSIS',
  'ANALYSIS_LOOP',
  'REACTION',
  'REPORT',
];

export function createStateMachine(
  config: StateMachineConfig = {},
): StateMachineInstance {
  const {
    initialState = 'IDLE',
    transitions = DEVIL_TRANSITIONS,
  } = config;

  let currentState: CinematicState = initialState;
  const listeners = new Set<StateListener>();

  function notify(prev: CinematicState, next: CinematicState) {
    listeners.forEach((fn) => fn(next, prev));
  }

  function send(event: CinematicEvent) {
    // FORCE_STATE bypasses the transition table
    if (event.type === 'FORCE_STATE') {
      const prev = currentState;
      currentState = event.target;
      notify(prev, currentState);
      return;
    }

    const stateTransitions = transitions[currentState];
    if (!stateTransitions) return;

    const nextState = stateTransitions[event.type];
    if (!nextState) return;

    const prev = currentState;
    currentState = nextState;
    notify(prev, currentState);
  }

  function getState() {
    return currentState;
  }

  function subscribe(listener: StateListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function reset() {
    const prev = currentState;
    currentState = initialState;
    notify(prev, currentState);
  }

  function getStateOrder() {
    return DEVIL_STATE_ORDER;
  }

  return { getState, send, subscribe, reset, getStateOrder };
}
