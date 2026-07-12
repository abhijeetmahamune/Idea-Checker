import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, unique, numeric } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // Links directly to Supabase auth.users.id
  email: text('email').unique().notNull(),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const problems = pgTable('problems', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // Nullable for guest evaluations
  guestSessionId: uuid('guest_session_id'), // Tracks temporary guest owner session
  title: text('title').notNull(),
  description: text('description').notNull(),
  tags: text('tags').array(), // Text array for tags
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});


export const solutions = pgTable('solutions', {
  id: uuid('id').defaultRandom().primaryKey(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  guestSessionId: uuid('guest_session_id'),
  content: text('content').notNull(),
  isMerged: boolean('is_merged').default(false).notNull(),
  mergedFromIds: text('merged_from_ids').array(), // uuid[] stored as text[]
  deepReport: jsonb('deep_report').$type<{
    executiveSummary: string;
    problemValidation: { score: number; analysis: string };
    marketSizing: { tam: string; sam: string; som: string; analysis: string };
    competitiveLandscape: { players: { name: string; threat: string }[]; differentiation: string };
    businessModelViability: { revenueModel: string; unitEconomics: string; pricing: string };
    technicalFeasibility: { complexity: 'Low' | 'Medium' | 'High'; risks: string[]; analysis: string };
    goToMarket: { channel: string; firstHundredCustomers: string };
    regulatoryRisks: { risks: string[]; severity: 'Low' | 'Medium' | 'High' };
    teamExecutionRisk: { founderProfile: string; keyHires: string[] };
    overallVerdict: { rating: 'Promising' | 'Needs Work' | 'Abandon'; summary: string; topStrengths: string[]; topRisks: string[] };
  } | null>(), // DEPRECATED: Use the deepReports table instead
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const evaluations = pgTable('evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').references(() => solutions.id, { onDelete: 'cascade' }).notNull(),
  feasibility: integer('feasibility').notNull(), // 0-10
  effectiveness: integer('effectiveness').notNull(), // 0-10
  scalability: integer('scalability').notNull(), // 0-10
  costEfficiency: integer('cost_efficiency').notNull(), // 0-10
  innovation: integer('innovation').notNull(), // 0-10
  overallScore: integer('overall_score').notNull(), // 0-100
  domain: text('domain'), // optional domain hint used during evaluation
  feedback: jsonb('feedback').$type<{
    strengths: string[];
    weaknesses: string[];
    summary: string;
  }>().notNull(),
  pivotSuggestions: jsonb('pivot_suggestions').$type<{
    title: string;
    description: string;
    rationale: string;
    estimatedScoreLift: string;
  }[] | null>(), // null when score >= 60
  successfulModels: jsonb('successful_models').$type<string[]>().notNull(),
  failedModels: jsonb('failed_models').$type<string[]>().notNull(),
  
  // Extended AI consensus and request auditing fields
  rawResponses: jsonb('raw_responses').$type<any[]>(),
  consensusResult: jsonb('consensus_result').$type<any>(),
  modelUsed: text('model_used'),
  promptVersion: text('prompt_version'),
  generationTimeMs: integer('generation_time_ms'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 6 }),
  contentHash: text('content_hash'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const deepReports = pgTable('deep_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').references(() => solutions.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  version: integer('version').notNull().default(1),
  modelUsed: text('model_used'),
  promptVersion: text('prompt_version'),
  generationTimeMs: integer('generation_time_ms'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 6 }),
  content: jsonb('content').$type<{
    executiveSummary: string;
    problemValidation: { score: number; analysis: string };
    marketSizing: { tam: string; sam: string; som: string; analysis: string };
    competitiveLandscape: { players: { name: string; threat: string }[]; differentiation: string };
    businessModelViability: { revenueModel: string; unitEconomics: string; pricing: string };
    technicalFeasibility: { complexity: 'Low' | 'Medium' | 'High'; risks: string[]; analysis: string };
    goToMarket: { channel: string; firstHundredCustomers: string };
    regulatoryRisks: { risks: string[]; severity: 'Low' | 'Medium' | 'High' };
    teamExecutionRisk: { founderProfile: string; keyHires: string[] };
    overallVerdict: { rating: 'Promising' | 'Needs Work' | 'Abandon'; summary: string; topStrengths: string[]; topRisks: string[] };
  }>(),
  errorMessage: text('error_message'),
  contentHash: text('content_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiRequests = pgTable('ai_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  endpoint: text('endpoint').notNull(),
  model: text('model').notNull(),
  promptVersion: text('prompt_version'),
  latency: integer('latency'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  estimatedCost: numeric('estimated_cost', { precision: 10, scale: 6 }),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const attachments = pgTable('attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').references(() => solutions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const simulations = pgTable('simulations', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').references(() => solutions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // Nullable for guests
  guestSessionId: uuid('guest_session_id'), // Nullable for logged in users
  scenario: text('scenario').notNull(),
  resilienceScore: integer('resilience_score').notNull(), // 0-100 rating
  feedback: jsonb('feedback').$type<{
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const devilAdvocateReports = pgTable('devil_advocate_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  solutionId: uuid('solution_id').references(() => solutions.id, { onDelete: 'cascade' }).notNull(),
  report: jsonb('report').$type<{
    verdict: string;
    failureReasons: { reason: string; severity: 'Fatal' | 'Severe' | 'Moderate' }[];
    ignoredCompetitors: { name: string; why_threat: string }[];
    founderTraps: string[];
    conditionToReconsider: string;
  }>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Community Upvotes (one per user per problem) ─────────────────────────────
export const problemUpvotes = pgTable(
  'problem_upvotes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('problem_upvotes_unique').on(table.problemId, table.userId)]
);

// ── Solution Star Ratings (one per user per solution, 1–5) ───────────────────
export const solutionRatings = pgTable(
  'solution_ratings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    solutionId: uuid('solution_id').references(() => solutions.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    rating: integer('rating').notNull(), // 1–5
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('solution_ratings_unique').on(table.solutionId, table.userId)]
);

// ── Community Comments (on public problems) ───────────────────────────────────
export const problemComments = pgTable('problem_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ── Collaboration Workspaces ──────────────────────────────────────────────────
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  problemId: uuid('problem_id').references(() => problems.id, { onDelete: 'cascade' }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').unique().notNull(), // 8-char random code
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: text('role').notNull().default('viewer'), // 'owner' | 'editor' | 'viewer'
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('workspace_members_unique').on(table.workspaceId, table.userId)]
);

export const workspaceMessages = pgTable('workspace_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  senderName: text('sender_name').notNull().default('Unknown'), // denormalized for realtime
  content: text('content').notNull(),
  type: text('type').notNull().default('text'), // 'text' | 'ai' | 'system'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
