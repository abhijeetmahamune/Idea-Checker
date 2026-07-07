# Idea Checker — Detailed Project Description

Idea Checker is a premium, modern web application designed for startup founders, product managers, and developers to validate and iterate on product ideas and solutions. It uses a multi-model consensus AI engine, stress simulators, deep McKinsey-style business analysts, and real-time team collaboration workspaces to evaluate whether a proposed solution effectively addresses a stated problem.

---

## 1. System Architecture

The application is built on a modern server-less architecture:
- **Framework**: Next.js 15 (utilizing App Router, Server Actions, Server Components, and Client Components).
- **Backend Database**: Supabase PostgreSQL.
- **ORM**: Drizzle ORM for schema definitions, migrations, and database queries.
- **Authentication**: Supabase Auth (with automatic user synchronization to public profile tables).
- **Real-time Engine**: Supabase Realtime (used for instant messaging within team workspaces).
- **Rate Limiting**: Upstash Redis (preventing API abuse through request throttling).
- **AI Engines**:
  - **OpenRouter API**: Accesses top free AI models (e.g., Llama 3.3 70B, GPT OSS 120B, Nemotron 3 120B) in parallel to execute consensus evaluations.
  - **Google Gemini API**: Direct integration via `@google/generative-ai` for solution synthesis (merging), deep report generation, and real-time workspace `@ai` assistance.

---

## 2. Technical Stack

| Tech Layer | Technology Used |
| :--- | :--- |
| **Framework** | Next.js 15 (React 19) |
| **Language** | TypeScript |
| **Database** | Supabase PostgreSQL |
| **ORM** | Drizzle ORM |
| **Auth** | Supabase Auth (SSR Server & Client) |
| **Styling** | Tailwind CSS v4, shadcn/ui components (Radix primitives) |
| **Notifications** | Sonner toast notifications |
| **Caching/Rate Limit** | Upstash Redis (`@upstash/ratelimit`) |
| **AI SDKs** | Google Generative AI (`@google/generative-ai`), OpenRouter SDK / Fetch API |

---

## 3. Database Schema

The database is defined in [src/db/schema.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/db/schema.ts) and managed with Drizzle ORM. The relational model consists of the following tables:

### 3.1 `users`
- Tracks profile records.
- Synced automatically from Supabase Auth (`auth.users`) via a PostgreSQL trigger function (`public.handle_new_user`).
- **Columns**: `id` (uuid, primary key), `email` (text, unique), `name` (text), `createdAt` (timestamp).

### 3.2 `problems`
- Holds problem statements created by registered users or guest sessions.
- **Columns**: `id` (uuid, default random, primary key), `userId` (uuid, references `users.id`, nullable for guests), `guestSessionId` (uuid, tracks guest owner), `title` (text), `description` (text), `tags` (text[]), `isPublic` (boolean), `createdAt` (timestamp), `deletedAt` (timestamp).

### 3.3 `solutions`
- Stores proposed solution variants linked to parent problems.
- **Columns**:
  - `id` (uuid, default random, primary key).
  - `problemId` (uuid, references `problems.id`).
  - `userId` (uuid, references `users.id`).
  - `guestSessionId` (uuid).
  - `content` (text).
  - `isMerged` (boolean, indicates if synthesized from other solutions).
  - `mergedFromIds` (text[], array of UUIDs representing source solutions).
  - `deepReport` (jsonb, stores the 10-section market & business analysis).
  - `createdAt` (timestamp), `deletedAt` (timestamp).

### 3.4 `evaluations`
- Stores scores across 5 dimensions and overall consensus evaluations.
- **Columns**:
  - `id` (uuid, primary key).
  - `solutionId` (uuid, references `solutions.id`).
  - `feasibility` (integer, 0-10).
  - `effectiveness` (integer, 0-10).
  - `scalability` (integer, 0-10).
  - `costEfficiency` (integer, 0-10).
  - `innovation` (integer, 0-10).
  - `overallScore` (integer, 0-100).
  - `domain` (text).
  - `feedback` (jsonb: `{ strengths: string[], weaknesses: string[], summary: string }`).
  - `pivotSuggestions` (jsonb: array of `{ title, description, rationale, estimatedScoreLift }[]` or null).
  - `successfulModels` (jsonb, string array of models that computed the score).
  - `failedModels` (jsonb, string array of models that errored).
  - `createdAt` (timestamp).

### 3.5 `simulations`
- Captures stress-testing results under risk scenarios.
- **Columns**: `id` (uuid), `solutionId` (uuid), `userId` (uuid), `guestSessionId` (uuid), `scenario` (text), `resilienceScore` (integer, 0-100), `feedback` (jsonb: analysis, strengths, weaknesses, recommendations), `createdAt` (timestamp).

### 3.6 `devilAdvocateReports`
- Holds hyper-critical teardown reports.
- **Columns**: `id` (uuid), `solutionId` (uuid), `report` (jsonb: verdict, failure reasons with severity, ignored competitors, founder traps, conditions to reconsider), `createdAt` (timestamp).

### 3.7 `problemUpvotes`
- Tracks user upvotes on public problems.
- Unique index on `(problem_id, user_id)`.

### 3.8 `solutionRatings`
- Tracks user star ratings (1-5) on solutions.
- Unique index on `(solution_id, user_id)`.

### 3.9 `problemComments`
- Stores community discussions on public problems.
- **Columns**: `id` (uuid), `problemId` (uuid), `userId` (uuid), `content` (text), `createdAt` (timestamp).

### 3.10 `workspaces`
- Private collaboration boards for teams.
- **Columns**: `id` (uuid), `problemId` (uuid), `ownerId` (uuid), `name` (text), `inviteCode` (text, unique 8-character string), `createdAt` (timestamp).

### 3.11 `workspaceMembers`
- Maps users to workspaces with granular roles.
- **Columns**: `id` (uuid), `workspaceId` (uuid), `userId` (uuid), `role` (text: 'owner' \| 'editor' \| 'viewer'), `joinedAt` (timestamp).
- Unique index on `(workspace_id, user_id)`.

### 3.12 `workspaceMessages`
- Logs real-time messages in workspaces.
- Includes RLS policies so only workspace members can select/insert.
- Subscribed to via Supabase Realtime channel.
- **Columns**: `id` (uuid), `workspaceId` (uuid), `userId` (uuid, nullable for AI messages), `senderName` (text), `content` (text), `type` (text: 'text' \| 'ai' \| 'system'), `createdAt` (timestamp).

---

## 4. Main Product Features & AI Pipelines

### 4.1 Consensus Evaluation Engine
- **Files**: [src/lib/evaluator.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/lib/evaluator.ts) & [src/app/api/evaluate/route.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/api/evaluate/route.ts)
- **Mechanism**:
  - Triggers three models in parallel: **Llama 3.3 70B**, **GPT OSS 120B**, and **Nemotron 3 120B** (via OpenRouter Free tier).
  - If any model fails or times out (25 seconds), it falls back to a secondary Nemetron query.
  - Scores are aggregated by averaging successful model ratings.
  - Highlights strengths, weaknesses, consensus summary, and domain-specific hints (e.g. SaaS metrics, healthcare regulatory barriers).

### 4.2 Solution Merging (AI Synthesis)
- **Files**: [src/lib/solution-merger.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/lib/solution-merger.ts) & [src/app/api/merge-solutions/route.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/api/merge-solutions/route.ts)
- **Mechanism**:
  - Allows problem owners to select **2 to 4** distinct solutions.
  - Invokes Gemini models (in order: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-flash-8b`) to combine them.
  - The model acts as a startup strategist, finding complementary factors, resolving contradictions, and synthesising a single, higher-quality proposal.
  - Inserts the new solution with `isMerged: true` and triggers a consensus evaluation on it automatically.

### 4.3 Deep McKinsey-Style Report
- **Files**: [src/lib/deep-report-generator.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/lib/deep-report-generator.ts) & [src/app/api/deep-report/route.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/api/deep-report/route.ts)
- **Mechanism**:
  - Generates a data-rich, structured analysis across 10 business sections:
    1. Executive Summary
    2. Problem Validation (0-10 score & analysis)
    3. Market Sizing (TAM, SAM, SOM with validation logic)
    4. Competitive Landscape (key players and defensibility)
    5. Business Model Viability (revenue, unit economics, pricing)
    6. Technical Feasibility (complexity: Low/Medium/High, risks, analysis)
    7. Go-to-Market Strategy (channels, acquiring first 100 users)
    8. Regulatory Risks (risks and severity)
    9. Team Execution Risk (founder profiles needed and first hires)
    10. Overall Verdict (Promising, Needs Work, or Abandon; top strengths & risks)

### 4.4 Devil's Advocate Teardown
- **Files**: [src/lib/devil-advocate-generator.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/lib/devil-advocate-generator.ts) & [src/app/api/devil-advocate/route.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/api/devil-advocate/route.ts)
- **Mechanism**:
  - Subjecting the solution to extreme scrutiny.
  - Outlines fatal/severe failure reasons, lists overlooked competitors, points out common founder traps, and specifies a "condition to reconsider" the pivot.

### 4.5 Risk Stress Simulation
- **Files**: [src/lib/simulation.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/lib/simulation.ts) & [src/app/api/simulate/route.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/api/simulate/route.ts)
- **Mechanism**:
  - Tests how the solution holds up under a chosen hypothetical scenario (e.g. "Google releases a free native competitor", "VC funding market freezes").
  - Outputs a Resilience Score (0-100) and actionable advice for risk mitigation.

### 4.6 Collaboration Workspaces & Real-time Chat
- **Files**:
  - [src/app/(dashboard)/workspace/[id]/page.tsx](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/%28dashboard%29/workspace/%5Bid%5D/page.tsx)
  - [src/components/workspace-chat.tsx](file:///c:/Abhijeet/Projects/Idea%20Checker/src/components/workspace-chat.tsx)
  - [src/app/api/workspace/[id]/messages/route.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/api/workspace/%5Bid%5D/messages/route.ts)
- **Mechanism**:
  - Enables team collaboration directly on a problem space.
  - Invite mechanism via unique codes (`/workspace/join/[inviteCode]`).
  - Chat screen with real-time sync powered by Supabase Realtime client.
  - **AI Assistant Integration**: Users can type `@ai` in the chat. The API intercepts this message, gathers context (the problem description and top-scored solution proposals), and asks a Gemini model to respond directly in the chat history.

### 4.7 Community Features
- **Files**: [src/components/comment-section.tsx](file:///c:/Abhijeet/Projects/Idea%20Checker/src/components/comment-section.tsx), [src/app/api/comments/route.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/app/api/comments/route.ts)
- **Mechanism**:
  - Users can upvote public problems and give star ratings (1-5) to solutions.
  - Public ideas include a discussion thread (comments list) where users can post feedback and delete their comments. The problem owner also has the permission to delete any comment on their problem page.

---

## 5. File Structure Map

```
idea-checker/
├── drizzle/                      # Drizzle migrations
├── scripts/
│   └── apply-migration.ts        # Script applying database updates & Supabase Realtime config
├── supabase/
│   └── policies_and_triggers.sql # Sets up user sync triggers and main tables RLS
├── src/
│   ├── app/
│   │   ├── (auth)/               # Authentication pages (login, register)
│   │   ├── (dashboard)/          # Authenticated routes
│   │   │   ├── dashboard/        # Main hub for user's owned problems
│   │   │   ├── problems/         # Problem detail, solutions, reports, simulations
│   │   │   └── workspace/        # Collaboration workspace dashboards & join handlers
│   │   ├── api/                  # Backend endpoints
│   │   │   ├── auth/             # Callback URLs
│   │   │   ├── comments/         # GET, POST, DELETE comments
│   │   │   ├── deep-report/      # Generate business validation reports
│   │   │   ├── devil-advocate/   # Generate devil's advocate reviews
│   │   │   ├── evaluate/         # 3-Model evaluation pipeline
│   │   │   ├── merge-solutions/  # Solutions AI merger endpoint
│   │   │   ├── simulate/         # Scenario risk simulations
│   │   │   └── workspace/        # Workspaces CRUD, members, messages
│   │   └── guest-evaluation/     # Unauthenticated quick-check route
│   ├── components/               # Frontend elements
│   │   ├── ui/                   # Reusable base components (buttons, cards, etc.)
│   │   ├── comment-section.tsx   # Comments panel
│   │   ├── create-workspace-dialog.tsx  # Modal creating workspaces
│   │   ├── merge-solutions-dialog.tsx   # Modal merging solutions
│   │   ├── solution-form.tsx     # Solution submission text editor
│   │   └── workspace-chat.tsx    # Live messaging box with @ai parser
│   ├── db/
│   │   ├── index.ts              # Database connection client
│   │   └── schema.ts             # Drizzle tables & typescript types
│   └── lib/                      # Helper modules
│       ├── deep-report-generator.ts
│       ├── devil-advocate-generator.ts
│       ├── evaluator.ts          # Parallel OpenRouter evaluation orchestrator
│       ├── ratelimit.ts          # Redis rate-limiting setup
│       ├── simulation.ts         # Stress test handler
│       ├── solution-merger.ts    # AI solution synthesiser
│       └── supabase/             # Client & SSR server handlers
```

---

## 6. Access Control & Security

1. **Row Level Security (RLS)** is enabled on all tables in public PostgreSQL schema:
   - Users can only read and write their own problems and solutions, unless the problem is set to public.
   - Evaluations can only be queried if the associated solution is owned by the user or is a guest solution.
   - Workspaces and membership mappings enforce that only validated workspace members can query members or send/view messages.
2. **Supabase Auth Middleware** ([src/middleware.ts](file:///c:/Abhijeet/Projects/Idea%20Checker/src/middleware.ts)) runs on every dashboard page to ensure authentication, managing redirect URLs and keeping track of guest session cookies.
3. **Database triggers** sync user profiles instantly upon signup.

---

## 7. Migration & Setup Workflows

### Setup database schema and Realtime configurations:
```bash
# 1. Generate TypeScript definitions to SQL migrations
npm run db:generate

# 2. Run standard drizzle-orm migration
npm run db:migrate

# 3. Apply custom SQL policies, sync triggers, and Realtime RLS rules:
# Paste contents of supabase/policies_and_triggers.sql into Supabase SQL editor

# 4. Apply application-specific migrations (merges, comments, workspaces RLS):
npx tsx --env-file=.env.local scripts/apply-migration.ts
```
