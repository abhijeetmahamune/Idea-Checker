import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, unique } from 'drizzle-orm/pg-core';

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
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // Proposer (can be different from problem owner)
  guestSessionId: uuid('guest_session_id'), // Guest proposer ID
  content: text('content').notNull(),
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
  } | null>(),
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
