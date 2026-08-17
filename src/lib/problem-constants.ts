// ── Problem Stage & Seeking — Controlled value constants ─────────────────────
//
// These are the SINGLE SOURCE OF TRUTH for all stage and seeking values.
// The stored value (e.g. 'EXPLORING') is intentionally different from the
// displayed label ('Exploring') to allow future i18n / label changes without
// a DB migration.

// ── Stage ─────────────────────────────────────────────────────────────────────

export const PROBLEM_STAGE_VALUES = [
  'EXPLORING',
  'VALIDATING',
  'TESTING',
  'BUILDING',
  'IMPLEMENTED',
  'SOLVED',
] as const;

export type ProblemStage = (typeof PROBLEM_STAGE_VALUES)[number];

export interface StageInfo {
  value: ProblemStage;
  label: string;
  emoji: string;
  /** Tailwind semantic color classes for badge/indicator */
  colorClass: string;
  /** Subtle bg for the active step */
  bgClass: string;
}

export const PROBLEM_STAGES: StageInfo[] = [
  {
    value: 'EXPLORING',
    label: 'Exploring',
    emoji: '💡',
    colorClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-500/10 border-violet-500/30',
  },
  {
    value: 'VALIDATING',
    label: 'Validating',
    emoji: '🔎',
    colorClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
  },
  {
    value: 'TESTING',
    label: 'Testing',
    emoji: '🧪',
    colorClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    value: 'BUILDING',
    label: 'Building',
    emoji: '🛠️',
    colorClass: 'text-orange-600 dark:text-orange-400',
    bgClass: 'bg-orange-500/10 border-orange-500/30',
  },
  {
    value: 'IMPLEMENTED',
    label: 'Implemented',
    emoji: '🚀',
    colorClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 border-emerald-500/30',
  },
  {
    value: 'SOLVED',
    label: 'Solved',
    emoji: '✅',
    colorClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-500/10 border-green-500/30',
  },
];

/** Returns stage metadata for a given stored value, or falls back to EXPLORING. */
export function getStageInfo(value: string): StageInfo {
  return (
    PROBLEM_STAGES.find((s) => s.value === value) ?? PROBLEM_STAGES[0]
  );
}

/** Type guard — is this string a valid ProblemStage? */
export function isProblemStage(value: string): value is ProblemStage {
  return PROBLEM_STAGE_VALUES.includes(value as ProblemStage);
}

// ── Seeking ───────────────────────────────────────────────────────────────────

export const SEEKING_OPTION_VALUES = [
  'FEEDBACK',
  'VALIDATION',
  'DOMAIN_EXPERT',
  'COLLABORATORS',
  'COFOUNDER',
  'EARLY_USERS',
  'FUNDING',
] as const;

export type SeekingOption = (typeof SEEKING_OPTION_VALUES)[number];

export interface SeekingInfo {
  value: SeekingOption;
  label: string;
  emoji: string;
  description: string;
}

export const SEEKING_OPTIONS: SeekingInfo[] = [
  {
    value: 'FEEDBACK',
    label: 'Feedback',
    emoji: '💬',
    description: 'I want opinions, critique, or suggestions.',
  },
  {
    value: 'VALIDATION',
    label: 'Validation',
    emoji: '🔍',
    description: 'I want people to help determine whether this problem is real and meaningful.',
  },
  {
    value: 'DOMAIN_EXPERT',
    label: 'Domain Expert',
    emoji: '🧠',
    description: 'I am looking for someone with relevant industry or domain knowledge.',
  },
  {
    value: 'COLLABORATORS',
    label: 'Collaborators',
    emoji: '🤝',
    description: 'I am looking for people who want to work on this.',
  },
  {
    value: 'COFOUNDER',
    label: 'Co-founder',
    emoji: '🚀',
    description: 'I am looking for a potential co-founder.',
  },
  {
    value: 'EARLY_USERS',
    label: 'Early Users',
    emoji: '🧪',
    description: 'I am looking for people willing to try or test a solution.',
  },
  {
    value: 'FUNDING',
    label: 'Funding',
    emoji: '💰',
    description: 'I am looking for funding or investor interest.',
  },
];

export const MAX_SEEKING_SELECTIONS = 4;

/** Type guard — is this string a valid SeekingOption? */
export function isSeekingOption(value: string): value is SeekingOption {
  return SEEKING_OPTION_VALUES.includes(value as SeekingOption);
}

/** Returns seeking metadata for a given stored value. */
export function getSeekingInfo(value: string): SeekingInfo | undefined {
  return SEEKING_OPTIONS.find((s) => s.value === value);
}
