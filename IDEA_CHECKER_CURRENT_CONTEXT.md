# IDEA_CHECKER_CURRENT_CONTEXT.md
> **Generated:** 2026-07-23 · **Status:** READ-ONLY audit — no project files were modified  
> **Source of truth:** Actual source code. Documentation was cross-checked against implementation.  
> **Secrets policy:** No API keys, passwords, or connection strings are disclosed. Only environment-variable **names** are referenced.

---

## TABLE OF CONTENTS

1. Executive Product Overview  
2. Current Tech Stack  
3. High-Level System Architecture  
4. Complete Feature Audit  
5. Mesh API Integration — Extremely Important  
6. AI Model Inventory  
7. Multi-Model Consensus Engine  
8. AI Prompt Architecture  
9. Database Architecture  
10. API / Server Endpoint Inventory  
11. Authentication & Authorization  
12. Rate Limiting & Cost Control  
13. Community / "GitHub for Ideas" Layer  
14. Collaboration Architecture  
15. Security Audit Summary  
16. Deployment & Production Status  
17. Hackathon-Specific Changes  
18. Current Project Strengths  
19. Current Limitations & Technical Debt  
20. Dependency on Mesh API  
21. Product Roadmap Evidence  
22. Partnership-Ready Project Summary  
23. Important File Map  

---

## 1. EXECUTIVE PRODUCT OVERVIEW

### What Idea Checker Is

Idea Checker is a web application that helps founders, product managers, and entrepreneurs validate startup ideas by submitting a problem statement alongside one or more proposed solutions, which are then analysed by a multi-model AI ensemble and scored across five business dimensions (Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation).

### The Real-World Problem It Solves

Most startup ideas die for the same preventable reasons: unvalidated assumptions, unexamined competition, ignored market-sizing, and founder cognitive bias. Traditional validation requires expensive consultants, investor calls, or peer networks. Idea Checker makes rigorous, structured, multi-perspective idea pressure-testing available to anyone, instantly and at negligible cost.

### Target Users

- **First-time founders** who want an external sanity check before committing.
- **Product managers** assessing new feature directions or pivots.
- **Startup students and accelerator cohorts** doing ideation workshops.
- **Bootstrappers** who cannot afford market research firms.

### Core User Journey (Current)

1. User authenticates (or continues as guest).
2. User defines a **Problem** (title, description, optional tags and domain).
3. User submits a **Solution** (free-text or AI-drafted from a guided questionnaire).
4. Three AI models evaluate the solution in parallel via Mesh API and return an **AI Consensus Score** (0–100) with per-dimension scores and strengths/weaknesses.
5. User reviews scores, feedback, a **Pentagon Radar Chart**, and optionally:
   - Generates a **10-section Deep Report** (market sizing, competitive landscape, etc.).
   - Runs a **Devil's Advocate** critique.
   - Runs a **Stress Simulation** against a custom risk scenario.
   - If score < 60, receives auto-generated **Pivot Suggestions**.
   - Views a **Score Timeline** tracking improvement across re-evaluations.
   - Merges multiple solutions into one AI-synthesised proposal.
6. Owner can toggle the problem **public**, enabling community upvotes, star ratings, and comments.
7. Owner can create a **Workspace** for collaborative team discussion, including an **@ai in-chat assistant**.

### Current Value Proposition

> "Submit your idea. Three AI models evaluate it. Get a score, a consensus report, a deep analysis, a brutal Devil's Advocate critique, and a stress simulation — in minutes."

### Long-Term "GitHub for Ideas" Vision

The documented vision (see `PROJECT_DESCRIPTION.md`) is to become "GitHub for Ideas" — a social layer where problems are public, solutions are forkable, contributions are tracked, reputation is earned, and teams collaborate on validation. Features like forking, versioning, contribution history, feeds, notifications, and trending ideas are **not yet implemented**.

### How Current Implementation Supports the Vision

The **community page**, **upvotes**, **comments**, **solution ratings**, and **workspaces** are the first concrete steps toward the community layer. The underlying data model (public problems, workspace members with roles, invite codes) is designed to support the social layer. However, the key GitHub-like mechanics (forking, versioning, profiles, feeds) remain unbuilt.

---

## 2. CURRENT TECH STACK

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | Next.js | 16.2.9 | Full-stack React SSR/SSG app with App Router |
| **Language** | TypeScript | ^5 | Type safety across frontend and backend |
| **React** | React / React DOM | 19.2.4 | UI rendering |
| **Styling** | Tailwind CSS | ^4 | Utility-first CSS via PostCSS |
| **Component Library** | shadcn/ui | 4.11.0 | Radix-based accessible UI components |
| **Additional UI** | @base-ui/react | ^1.5.0 | Supplementary accessible primitives |
| **Icons** | lucide-react | ^1.20.0 | Icon set |
| **Animations** | tw-animate-css | ^1.4.0 | Tailwind animation utilities |
| **Theming** | next-themes | ^0.4.6 | Light/Dark mode toggle |
| **Toasts** | sonner | ^2.0.7 | Non-blocking notification toasts |
| **Database** | Supabase (PostgreSQL) | Hosted | Primary relational database |
| **DB Client (Server)** | Drizzle ORM + postgres driver | ^0.45.2 / ^3.4.9 | Type-safe SQL queries, migrations |
| **Authentication** | Supabase Auth | @supabase/ssr ^0.12.0 | Email/password auth, session management |
| **Mesh API (Primary AI)** | Mesh API | via HTTPS | Unified LLM gateway for all core AI calls |
| **Google Gemini (Secondary AI)** | @google/generative-ai | ^0.24.1 | Workspace @ai assistant primary; solution merger primary |
| **Rate Limiting** | Upstash Redis + @upstash/ratelimit | ^2.0.8 / ^1.38.0 | Sliding-window rate limits for guests and users |
| **Validation** | Zod | ^4.4.3 | Schema validation for API I/O and AI responses |
| **CSS Utilities** | clsx + tailwind-merge + class-variance-authority | — | Conditional class composition |
| **Deployment Target** | Render (Docker) | — | Container-based deployment |
| **Build Tool** | next build | — | Production bundling |
| **Migration Tool** | drizzle-kit | ^0.31.10 | Schema generation and migration |

### Notable Absence

- **Vertex AI** — The `.env.example` file and all source files confirm `MESH_API_KEY` and `GEMINI_API_KEY` are the two AI providers. **No Vertex AI code exists anywhere in the repository.**
- **OpenRouter** — The function `runOpenRouterModel` in `evaluator.ts` is a legacy name from before migration; it now calls `https://api.meshapi.ai/v1/chat/completions`. No OpenRouter API key or URL appears in the codebase.

---

## 3. HIGH-LEVEL SYSTEM ARCHITECTURE

```
Browser / Client
  │
  ├── Static Pages (Next.js SSR)
  │     Landing Page, Login, Register, Dashboard, Problem Detail,
  │     Solution Detail, Community, Workspace
  │
  ↓
Next.js App Router (Edge + Node.js runtime)
  │
  ├── Server Actions (auth-actions.ts, problem-actions.ts, solution-actions.ts)
  │     → Supabase Auth → Drizzle ORM → PostgreSQL
  │
  └── API Route Handlers (/api/*)
        │
        ├── /api/evaluate           → evaluator.ts (3 parallel Mesh API calls)
        ├── /api/deep-report        → deep-report-generator.ts (sequential Mesh API)
        ├── /api/devil-advocate     → devil-advocate-generator.ts (single Mesh API call)
        ├── /api/simulate           → simulation.ts (single Mesh API call)
        ├── /api/generate-solution  → streaming Mesh API call
        ├── /api/merge-solutions    → solution-merger.ts (Gemini primary, Mesh fallback)
        ├── /api/workspace/[id]/messages → Gemini primary, Mesh fallback (@ai trigger)
        ├── /api/comments           → Drizzle ORM only
        ├── /api/upvote             → Drizzle ORM only
        ├── /api/rate-solution      → Drizzle ORM only
        └── /api/auth/callback      → Supabase OAuth callback
        
  ↓
External Services
  ├── Mesh API (https://api.meshapi.ai/v1/chat/completions)
  │     Models: meta-llama/llama-3.3-70b-instruct,
  │             google/gemini-flash-1.5,
  │             anthropic/claude-3-haiku
  │
  ├── Google Gemini API (direct SDK)
  │     Models: gemini-2.0-flash (primary), gemini-1.5-flash, gemini-1.5-flash-8b
  │     Used for: workspace @ai, solution merger
  │
  └── Upstash Redis (rate limiting only)

  ↓
Supabase PostgreSQL
  ├── users, problems, solutions, evaluations
  ├── deep_reports, devil_advocate_reports, simulations, ai_requests
  ├── problem_upvotes, solution_ratings, problem_comments
  └── workspaces, workspace_members, workspace_messages

  ↓
Supabase Realtime
  └── workspace_messages table → pushed to workspace chat UI (postgres_changes)
```

**Key Boundaries:**
- All AI calls happen **server-side only**. The `MESH_API_KEY` and `GEMINI_API_KEY` are never exposed to the browser.
- Supabase Auth manages session cookies via `@supabase/ssr`. The middleware (`middleware.ts`) refreshes sessions on every request.
- Drizzle ORM is used exclusively server-side; no direct DB connection from client.
- Supabase Realtime is consumed **client-side** only in the `WorkspaceChat` component, using the anon key (which is public by design).

---

## 4. COMPLETE FEATURE AUDIT

---

### 4.1 Problem Creation
- **Status:** ✅ WORKING
- **Purpose:** Define the startup problem context that solutions will be evaluated against.
- **User Flow:** Authenticated user → `/problems/new` → fills title, description, tags → `createProblemAction` → redirected to `/problems/[id]`.
- **Key Files:** `src/app/(dashboard)/problems/new/page.tsx`, `src/app/problem-actions.ts`
- **Database:** `problems` table
- **AI Involvement:** None
- **Limitations:** Guests cannot create standalone problems through this form; guest problems are created implicitly during quick evaluation.

---

### 4.2 Solution Creation / Quick Evaluation
- **Status:** ✅ WORKING
- **Purpose:** Submit a solution text against a problem and trigger multi-model evaluation.
- **User Flow:** Problem detail page → `SolutionForm` → POST `/api/evaluate` → results rendered on solution detail page.
- **Key Files:** `src/components/solution-form.tsx`, `src/components/quick-eval-form.tsx`, `src/app/api/evaluate/route.ts`
- **Database:** `problems`, `solutions`, `evaluations`
- **AI Involvement:** Full 3-model consensus via Mesh API
- **Known Limitations:** No streaming on evaluation; user waits for all three model calls to complete.

---

### 4.3 Guided Solution Formation (Questionnaire)
- **Status:** ✅ WORKING
- **Purpose:** Structured, domain-specific question flow that assembles a solution and submits for evaluation.
- **User Flow:** Problem detail page → "Guided" tab in SolutionForm → select domain → answer questions → AI assembles solution draft → user reviews → submit for evaluation.
- **Key Files:** `src/components/solution-questionnaire.tsx`, `src/lib/questionnaire-config.ts`
- **Domains Covered:** SaaS, Healthcare, E-Commerce, EdTech, FinTech, Hardware, Social (7 domains, ~8-10 questions each)
- **AI Involvement:** Mesh API assembles solution from questionnaire answers via `/api/generate-solution`
- **Database:** Same as solution creation

---

### 4.4 AI-Drafted Solution (Quick Draft)
- **Status:** ✅ WORKING
- **Purpose:** Let Mesh API generate a solution draft from the problem statement, which the user can edit before submission.
- **User Flow:** SolutionForm → "Generate with AI" → POST `/api/generate-solution` → **streaming response** rendered token-by-token → user edits → submits.
- **Key Files:** `src/app/api/generate-solution/route.ts`
- **AI Involvement:** Mesh API SSE streaming (with non-streaming fallback)
- **Streaming:** Yes — uses `ReadableStream` to pipe Mesh API SSE chunks to client as plain text.

---

### 4.5 Multi-Model AI Evaluation (Consensus Engine)
- **Status:** ✅ WORKING — Core Feature
- **Purpose:** Evaluate a solution across 5 dimensions using 3 AI models in parallel.
- **User Flow:** Triggered automatically on solution submit or solution edit.
- **Key Files:** `src/lib/evaluator.ts`, `src/app/api/evaluate/route.ts`
- **Database:** `evaluations`, `ai_requests`
- **AI Involvement:** See Section 7 for full detail.

---

### 4.6 Evaluation Score Breakdown (Pentagon Radar Chart)
- **Status:** ✅ WORKING
- **Purpose:** Visualise the 5 evaluation dimensions as a Pentagon radar chart.
- **Key Files:** `src/components/pentagon-radar-chart.tsx`, `src/components/evaluation-view.tsx`
- **Notes:** Replaced a circular score ring in commit `dad980e` during hackathon period.

---

### 4.7 AI Model Consensus Breakdown UI
- **Status:** ✅ WORKING
- **Purpose:** Show which AI models succeeded/failed and per-model token usage and cost data.
- **Key Files:** `src/components/evaluation-view.tsx`
- **Notes:** Added in commit `91686b1` during hackathon period.

---

### 4.8 Pivot Suggestions
- **Status:** ✅ WORKING
- **Purpose:** Auto-generate 3 strategic pivot directions when a solution scores below 60/100.
- **User Flow:** Triggered automatically after a low-scoring evaluation.
- **Key Files:** `src/lib/solution-generator.ts` (`generatePivots`), `src/components/pivot-suggestions.tsx`
- **AI Involvement:** Single Mesh API call to `meta-llama/llama-3.3-70b-instruct`
- **Database:** `evaluations.pivot_suggestions` (jsonb)

---

### 4.9 Deep Report
- **Status:** ✅ WORKING
- **Purpose:** Generate a 10-section VC-style deep analysis of a solution (market sizing, competitive landscape, regulatory risks, etc.).
- **User Flow:** Solution detail page → "Deep Report" tab → POST `/api/deep-report` → report rendered in `DeepReportView`.
- **Key Files:** `src/lib/deep-report-generator.ts`, `src/app/api/deep-report/route.ts`, `src/components/deep-report-view.tsx`
- **Database:** `deep_reports` table (with status: PENDING/RUNNING/COMPLETED/FAILED, versioning, content hash caching)
- **AI Involvement:** Sequential Mesh API model fallback (Llama → Gemini Flash → Claude Haiku)
- **Caching:** SHA-256 hash of problem+solution content; cached result reused if hash matches.
- **Auth:** Deep report requires authentication; owner-only.

---

### 4.10 Devil's Advocate Analysis
- **Status:** ✅ WORKING
- **Purpose:** Generate a brutal, structured critique: verdict, failure reasons (Fatal/Severe/Moderate), ignored competitors, founder traps, and condition to reconsider.
- **User Flow:** Solution detail page → "Devil's Advocate" tab → POST `/api/devil-advocate`.
- **Key Files:** `src/lib/devil-advocate-generator.ts`, `src/app/api/devil-advocate/route.ts`, `src/components/devil-advocate-view.tsx`
- **Database:** `devil_advocate_reports` table
- **AI Involvement:** Single Mesh API call to `meta-llama/llama-3.3-70b-instruct`
- **Auth:** Requires auth; owner or public-problem viewer can trigger.

---

### 4.11 Stress Simulation (Risk/Scenario Testing)
- **Status:** ✅ WORKING
- **Purpose:** Test how resilient a solution is against a user-defined risk scenario (e.g., "What if a major competitor copies this feature in 6 months?"). Returns a Resilience Score (0–100).
- **User Flow:** Solution detail page → "Stress Test" tab → enter scenario → POST `/api/simulate`.
- **Key Files:** `src/lib/simulation.ts`, `src/app/api/simulate/route.ts`, `src/components/stress-test-view.tsx`
- **Database:** `simulations` table
- **AI Involvement:** Single Mesh API call to `meta-llama/llama-3.3-70b-instruct`
- **Guest Access:** Supported with guest session cookie; shares rate limit bucket with evaluation.

---

### 4.12 Solution Merging
- **Status:** ✅ WORKING
- **Purpose:** Intelligently synthesise 2–4 selected solutions into one superior merged proposal, then auto-evaluate it.
- **User Flow:** Problem detail page → select 2–4 solutions → "Merge Solutions" dialog → POST `/api/merge-solutions` → merged solution auto-evaluated.
- **Key Files:** `src/lib/solution-merger.ts`, `src/app/api/merge-solutions/route.ts`, `src/components/merge-solutions-dialog.tsx`
- **AI Involvement:** Gemini SDK primary (gemini-2.0-flash → 1.5-flash → 1.5-flash-8b), Mesh API fallback.
- **Auth:** Authenticated users only; problem owner only.
- **Database:** `solutions` (isMerged=true, mergedFromIds), `evaluations`

---

### 4.13 Score Timeline
- **Status:** ✅ WORKING
- **Purpose:** Display a chronological chart of all evaluation scores for a solution, showing improvement over re-evaluations.
- **Key Files:** `src/components/score-timeline.tsx`
- **Database:** Queries all `evaluations` rows for a solution.

---

### 4.14 Score Coaching Card
- **Status:** ✅ WORKING
- **Purpose:** Display per-dimension feedback and improvement advice.
- **Key Files:** `src/components/score-coaching-card.tsx`

---

### 4.15 Public Problems / Community Board
- **Status:** ✅ WORKING
- **Purpose:** Owners can toggle problems public; public problems appear on the community board with author, solution count, and upvote count.
- **User Flow:** Problem detail → toggle visibility → `toggleProblemVisibilityAction` → problem appears at `/community`.
- **Key Files:** `src/app/(dashboard)/community/page.tsx`, `src/components/visibility-toggle.tsx`
- **Database:** `problems.is_public`, `problem_upvotes`
- **Sorting:** Supports "Latest" and "Top" (by upvote count).
- **Guest Access:** Community page is readable by unauthenticated users (no redirect enforced).

---

### 4.16 Upvotes
- **Status:** ✅ WORKING
- **Purpose:** Authenticated users can toggle upvotes on public problems (one upvote per user per problem).
- **Key Files:** `src/app/api/upvote/route.ts`, `src/components/upvote-button.tsx`
- **Database:** `problem_upvotes` (unique constraint: problemId + userId)
- **Auth:** Required (guests see count but cannot upvote).

---

### 4.17 Solution Ratings (Star Ratings)
- **Status:** ✅ WORKING
- **Purpose:** Authenticated users can rate solutions on public problems (1–5 stars); upsert semantics (one rating per user per solution).
- **Key Files:** `src/app/api/rate-solution/route.ts`, `src/components/community-score-widget.tsx`
- **Database:** `solution_ratings` (unique: solutionId + userId)
- **Limitation:** Solution owner cannot rate their own solution (enforced server-side).

---

### 4.18 Comments
- **Status:** ✅ WORKING
- **Purpose:** Authenticated users can comment on public problems.
- **User Flow:** Community board → problem detail → comment section → POST/DELETE `/api/comments`.
- **Key Files:** `src/app/api/comments/route.ts`, `src/components/comment-section.tsx`
- **Database:** `problem_comments`
- **Auth:** Required for posting; public read (no auth needed for GET).

---

### 4.19 Guest Evaluations
- **Status:** ✅ WORKING
- **Purpose:** Allow users without accounts to submit and evaluate ideas, limited by rate limiting.
- **Mechanism:** A `guest_session_id` UUID cookie is set on the client; problems and solutions use `guest_session_id` FK instead of `user_id`.
- **Key Files:** `src/app/api/evaluate/route.ts`, `src/app/guest-evaluation/[solutionId]/page.tsx`
- **Rate Limit:** 3 evaluations per 24 hours per guest session+IP combination (Upstash).
- **Limitation:** Guest evaluations cannot be carried over to a registered account.

---

### 4.20 "Continue as Guest" Login
- **Status:** ⚠️ PARTIALLY IMPLEMENTED / SECURITY CONCERN
- **Purpose:** Let users quickly explore the dashboard by logging in as a shared demo account.
- **Implementation:** `guestLoginAction` in `auth-actions.ts` signs in with a **hardcoded email and password** stored directly in source code. This is a demo/hackathon convenience shortcut, not a real guest authentication system.
- **Security:** The hardcoded credentials are visible in the source. If the repository is public, this account is compromised. See Section 15.

---

### 4.21 User Authentication
- **Status:** ✅ WORKING
- **Purpose:** Email/password signup and login.
- **Key Files:** `src/app/(auth)/login/`, `src/app/(auth)/register/`, `src/app/auth-actions.ts`, `src/app/api/auth/callback/route.ts`
- **Provider:** Supabase Auth

---

### 4.22 User Dashboard
- **Status:** ✅ WORKING
- **Purpose:** Show all problems owned by the logged-in user with solution counts.
- **Key Files:** `src/app/(dashboard)/dashboard/page.tsx`
- **Database:** `problems`, `solutions`

---

### 4.23 Problem Editing and Deletion
- **Status:** ✅ WORKING
- **Key Files:** `src/app/problem-actions.ts` (`editProblemAction`, `deleteProblemAction`)
- **Notes:** Deletion is soft-delete (sets `deleted_at`); cascades to solutions.

---

### 4.24 Solution Editing (with Re-Evaluation)
- **Status:** ✅ WORKING
- **Purpose:** Edit solution content and trigger automatic re-evaluation via the consensus engine.
- **Key Files:** `src/app/solution-actions.ts` (`editSolutionAction`), `src/components/edit-solution-dialog.tsx`
- **Notes:** Domain is not preserved on re-evaluation (tracked in schema comment as known gap).

---

### 4.25 Collaboration Workspaces
- **Status:** ✅ WORKING
- **Purpose:** Problem owner creates a workspace with an invite code; team members join and chat in real time.
- **Key Files:** `src/app/api/workspace/route.ts`, `src/app/(dashboard)/workspace/[id]/page.tsx`
- **Database:** `workspaces`, `workspace_members`, `workspace_messages`
- **Realtime:** Supabase Realtime (postgres_changes on workspace_messages)

---

### 4.26 Workspace AI Assistant (@ai)
- **Status:** ✅ WORKING
- **Purpose:** Within a workspace chat, typing `@ai <question>` triggers an AI response with the problem and top solution scores as context.
- **Key Files:** `src/app/api/workspace/[id]/messages/route.ts`
- **AI:** Gemini 2.0 Flash (primary), Mesh API Llama/Gemini Flash/Claude Haiku (fallback)

---

### 4.27 Workspace Join via Invite Code
- **Status:** ✅ WORKING
- **Key Files:** `src/app/api/workspace/join/route.ts`, `src/app/(dashboard)/workspace/join/[code]/page.tsx`

---

### 4.28 Light/Dark Mode Toggle
- **Status:** ✅ WORKING
- **Key Files:** `src/components/theme-toggle.tsx`, `src/components/theme-provider.tsx`
- **Notes:** Added in commit `91686b1`.

---

### Features Verified as NOT IMPLEMENTED

| Feature | Evidence |
|---|---|
| User public profiles | No `/profile` route; no profile page component |
| Following other users | No schema column or API route |
| Solution forking / remixing | No fork route, no UI |
| Problem/solution versioning | No version column on problems/solutions |
| Contribution history feed | No feed query or route |
| Trending ideas feed | No trending algorithm |
| Notifications | No notifications table or endpoint |
| Reputation system | No reputation column |
| File attachments (upload) | `attachments` table exists in schema but no upload API route and no UI component |

---

## 5. MESH API INTEGRATION — EXTREMELY IMPORTANT

### Summary

Mesh API is the **primary and dominant** AI provider in Idea Checker. It is used for all five core AI evaluation features: consensus evaluation, deep reports, devil's advocate, stress simulation, solution generation, and pivot suggestions. Gemini (direct SDK) is used only for workspace AI and solution merging (as the preferred provider; Mesh is the fallback).

### Files Containing Mesh Integration

| File | Mesh Usage |
|---|---|
| `src/lib/evaluator.ts` | Primary — 3 parallel calls, fallback logic |
| `src/lib/deep-report-generator.ts` | Sequential fallback across 3 models |
| `src/lib/devil-advocate-generator.ts` | Single call (Llama 3.3 70B) |
| `src/lib/simulation.ts` | Single call (Llama 3.3 70B) |
| `src/lib/solution-merger.ts` | Fallback path (after Gemini SDK fails) |
| `src/app/api/generate-solution/route.ts` | Streaming SSE call, non-streaming fallback |
| `src/app/api/workspace/[id]/messages/route.ts` | Fallback after Gemini SDK for @ai assistant |

### Authentication with Mesh

```
Authorization: Bearer ${process.env.MESH_API_KEY}
```

- Environment variable name: `MESH_API_KEY`
- No OAuth, no project ID — single API key, Bearer token scheme.

### Mesh Base URL and Endpoints

```
https://api.meshapi.ai/v1/chat/completions
```

This is the only Mesh endpoint called. The API is compatible with the OpenAI Chat Completions specification.

### Request Structure

```json
{
  "model": "meta-llama/llama-3.3-70b-instruct",
  "response_format": { "type": "json_object" },
  "messages": [
    { "role": "system", "content": "<system prompt>" },
    { "role": "user",   "content": "<user prompt>" }
  ]
}
```

For streaming (solution generation only):
```json
{
  "model": "...",
  "stream": true,
  "messages": [...]
}
```

### Response Structure

Standard OpenAI-compatible response:
```json
{
  "choices": [{
    "message": {
      "content": "<JSON string or plain text>"
    }
  }],
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "total_tokens": 579
  }
}
```

### Error Handling

| Code | Behaviour |
|---|---|
| 429 Rate Limited | Exponential backoff retry (initial: 1500ms, max 2 retries) in `evaluator.ts` |
| Non-ok HTTP | Throws `Error('Mesh API HTTP error: ${status}')` |
| Empty content | Throws `Error('Empty message content returned from Mesh API')` |
| All models fail | Throws final error to API route handler → returns 500 |

### Timeouts

- Core evaluation calls (`runOpenRouterModel`): **25-second `AbortController` timeout per attempt**.
- Deep report, devil's advocate, simulation, generate-solution: **No explicit timeout** — relies on the Next.js/Node.js default.

### Retries

- Core evaluation (`runOpenRouterModel`): Up to **2 retries** (`maxRetries = 2`) with exponential backoff (1500ms → 3000ms → 6000ms).
- All other Mesh calls: **No retry logic** — fail-fast, move to next model in sequential fallback lists.

### Fallbacks

- **Evaluation:** If a primary model fails, the Nemetron fallback (`runNemetronFallback`) runs `meta-llama/llama-3.3-70b-instruct`. This means Llama can appear twice in the consensus if one of the three primary slots fails. If all models and their fallbacks fail, evaluation throws a total-failure error.
- **Deep Report:** Sequential: `meta-llama/llama-3.3-70b-instruct` → `google/gemini-flash-1.5` → `anthropic/claude-3-haiku`. First success is used.
- **Generate Solution:** Same 3-model sequential fallback, then a non-streaming fallback loop.
- **Merge Solutions:** Gemini SDK first; if no `GEMINI_API_KEY`, tries Mesh 3-model sequential.
- **Workspace @ai:** Gemini SDK first; then Mesh 3-model sequential.

### Rate Limiting (Application Level)

Application-level rate limiting (Upstash) is separate from Mesh API rate limits. See Section 12 for details. Mesh API itself can return 429, which is handled with retries.

### Model Selection and Routing

Models are **hardcoded** — there is no dynamic routing, A/B testing, or cost-based model selection. The models called are determined per feature, not by request parameters.

### Structured Output / JSON Handling

- All evaluation, simulation, devil's advocate, deep report, and pivot calls use `response_format: { type: "json_object" }`.
- Responses are then passed through `parseAndCleanJson()` which strips any markdown code fences and parses JSON.
- Values are clamped: scores are `Math.max(0, Math.min(10, Math.round(Number(val)) || 0))`.
- Zod schemas validate the final parsed object (`evaluationResponseSchema`, `deepReportSchema`, `simulationResponseSchema`, `devilReportSchema`, `pivotSchema`).
- Malformed/invalid JSON causes the model call to fail; fallback model is attempted.

### Successful / Failed Model Tracking

The `evaluations` table stores:
- `successful_models` (jsonb array of model ID strings)
- `failed_models` (jsonb array)
- `raw_responses` (jsonb array with per-model responses and token counts)
- `consensus_result` (jsonb with per-dimension averages)
- `model_used` (set to `'consensus-ensemble'` for the evaluation record)

Every Mesh API call (success or failure) is also logged to the `ai_requests` table with model, latency, token counts, estimated cost, and error message.

### Cost Estimation

A local `estimateMeshCost` function estimates cost using **hardcoded per-million-token rates**:

| Model | Input Rate ($/1M) | Output Rate ($/1M) |
|---|---|---|
| meta-llama/llama-3.3-70b-instruct | $0.70 | $0.90 |
| google/gemini-flash-1.5 | $0.075 | $0.30 |
| anthropic/claude-3-haiku | $0.25 | $1.25 |
| nvidia/nemotron-* | $0.50 | $0.50 |
| gpt-oss-120b | $1.00 | $1.00 |

These are estimates; they are not retrieved from Mesh API's actual billing.

### How Results Flow Back into Idea Checker

```
Mesh API response (JSON)
  → parseAndCleanJson() strips fences, JSON.parse()
  → Zod schema validation
  → Score clamping / normalisation
  → Averaged across models (evaluation) or used directly (other features)
  → Inserted into database (evaluations, deep_reports, simulations, etc.)
  → API route returns JSON to Next.js client component
  → UI renders score, chart, feedback, sections
```

---

## 6. AI MODEL INVENTORY

| Model ID | Provider | Accessed Through | Feature | Purpose | Fallback? | Active? |
|---|---|---|---|---|---|---|
| `meta-llama/llama-3.3-70b-instruct` | Meta | Mesh API | Core Evaluation | 1 of 3 consensus models | Yes (also serves as fallback model) | ✅ Yes |
| `google/gemini-flash-1.5` | Google | Mesh API | Core Evaluation | 1 of 3 consensus models | Falls back to Nemetron | ✅ Yes |
| `anthropic/claude-3-haiku` | Anthropic | Mesh API | Core Evaluation | 1 of 3 consensus models | Falls back to Nemetron | ✅ Yes |
| `meta-llama/llama-3.3-70b-instruct` | Meta | Mesh API | Devil's Advocate | Single hardcoded model | None | ✅ Yes |
| `meta-llama/llama-3.3-70b-instruct` | Meta | Mesh API | Stress Simulation | Single hardcoded model | None | ✅ Yes |
| `meta-llama/llama-3.3-70b-instruct` | Meta | Mesh API | Pivot Suggestions | Single hardcoded model | None | ✅ Yes |
| `meta-llama/llama-3.3-70b-instruct` | Meta | Mesh API | Deep Report | First in sequential fallback | Falls to Gemini Flash | ✅ Yes |
| `google/gemini-flash-1.5` | Google | Mesh API | Deep Report | Second in sequential fallback | Falls to Claude Haiku | ✅ Yes |
| `anthropic/claude-3-haiku` | Anthropic | Mesh API | Deep Report | Third in sequential fallback | None (throws) | ✅ Yes |
| `meta-llama/llama-3.3-70b-instruct` | Meta | Mesh API | Generate Solution | First in sequential fallback | Falls to next model | ✅ Yes |
| `google/gemini-flash-1.5` | Google | Mesh API | Generate Solution | Second in sequential fallback | Falls to Claude Haiku | ✅ Yes |
| `anthropic/claude-3-haiku` | Anthropic | Mesh API | Generate Solution | Third in sequential fallback | None (throws) | ✅ Yes |
| `meta-llama/llama-3.3-70b-instruct` | Meta | Mesh API | Solution Merging | Fallback after Gemini | Fallback | ✅ Yes (fallback) |
| `google/gemini-flash-1.5` | Google | Mesh API | Solution Merging | Second Mesh fallback | Fallback | ✅ Yes (fallback) |
| `anthropic/claude-3-haiku` | Anthropic | Mesh API | Solution Merging | Third Mesh fallback | Fallback | ✅ Yes (fallback) |
| `gemini-2.0-flash` | Google | Gemini SDK | Solution Merging | Primary (before Mesh fallback) | Falls to 1.5-flash | ✅ Yes |
| `gemini-1.5-flash` | Google | Gemini SDK | Solution Merging | Secondary (Gemini SDK) | Falls to 1.5-flash-8b | ✅ Yes |
| `gemini-1.5-flash-8b` | Google | Gemini SDK | Solution Merging | Tertiary (Gemini SDK) | Falls to Mesh | ✅ Yes |
| `gemini-2.0-flash` | Google | Gemini SDK | Workspace @ai | Primary AI assistant model | Falls to Mesh | ✅ Yes |

**Note on "Nemetron":** The code refers to a `runNemetronFallback` function and uses "Nemetron" as the fallback concept name, but the actual model called is `meta-llama/llama-3.3-70b-instruct` — not Nvidia's Nemotron model. The naming is a legacy artifact from an earlier development stage. The `estimateMeshCost` function has a branch for `model.includes('nemotron')` but no feature currently calls an actual Nemotron model. The pricing for `gpt-oss-120b` is also in `estimateMeshCost` but no feature calls that model either.

---

## 7. MULTI-MODEL CONSENSUS ENGINE

### Complete Trace: Evaluation from Submission to UI

**Step 1 — User submits:**
- `SolutionForm` (client component) sends `POST /api/evaluate` with `{ problemTitle?, problemDescription?, solutionContent, domain?, problemId?, force? }`.

**Step 2 — Rate limit check (`/api/evaluate/route.ts`):**
- Identifies user (auth) or guest (cookie `guest_session_id` + IP).
- Calls `checkRateLimit(key, isGuest)`.
- Guest: 3 requests / 24 hours. User: 10 requests / 1 hour.
- If exceeded → 429 returned immediately.

**Step 3 — Problem and solution persistence:**
- If `problemId` provided: fetches problem, verifies ownership.
- If new: inserts problem row.
- Inserts solution row (returns `solutionId`).

**Step 4 — Content hash caching:**
- `SHA-256(problemDescription || "||" || solutionContent)` computed.
- If hash exists in `evaluations` and `force` is not set → cache hit; clones the evaluation record for the new solutionId and skips AI calls entirely.

**Step 5 — `evaluateSolution(problem, solution, domain)` called (if not cached):**
- Three model specs defined:
  ```
  { name: 'Llama 3.3 70B (Mesh)', id: 'meta-llama/llama-3.3-70b-instruct' }
  { name: 'Gemini 1.5 Flash (Mesh)', id: 'google/gemini-flash-1.5' }
  { name: 'Claude 3 Haiku (Mesh)', id: 'anthropic/claude-3-haiku' }
  ```
- `Promise.all()` fires all 3 calls in parallel via `runOpenRouterModel()`.

**Step 6 — Per-model call (`runOpenRouterModel`):**
- AbortController with 25-second timeout.
- Up to 2 retries with exponential backoff.
- On 429: retries with backoff.
- On non-2xx: throws.
- On empty content: throws.
- Parses JSON, strips code fences, clamps scores, Zod-validates.
- On success → logged to `ai_requests`.
- On failure → logged to `ai_requests`, error rethrown to orchestrator.

**Step 7 — Fallback loop:**
- For each failed model result: `runNemetronFallback()` is called, which calls `meta-llama/llama-3.3-70b-instruct` (same model as primary, no retry logic).
- Fallback result labelled `"${original_model} -> Nemetron Fallback"`.
- If fallback also fails: model is added to `failedModels` array.

**Step 8 — Total failure check:**
- If `parsedEvaluations.length === 0` → throws "All AI evaluation models failed."

**Step 9 — Aggregation:**
- For each of 5 dimensions: `avg = Math.round(sum / count)` across all successful models.
- `overallScore = Math.round(((avg1 + avg2 + avg3 + avg4 + avg5) / 5) * 10)` — scales 0–10 averages to 0–100.
- Strengths: union of all models' strength strings, deduped, max 4.
- Weaknesses: union, deduped, max 4.
- Summary: taken from first successful model only.

**Step 10 — Pivot suggestions (conditional):**
- If `overallScore < 60`: calls `generatePivots()` via Mesh API.
- Non-fatal: if pivot generation fails, evaluation still returns.

**Step 11 — Database persistence:**
- Inserts into `evaluations` with all fields including raw_responses, consensusResult, token counts, estimated cost, content hash.

**Step 12 — Response to frontend:**
```json
{
  "success": true,
  "problemId": "uuid",
  "solutionId": "uuid",
  "evaluation": { feasibility, effectiveness, scalability, costEfficiency, innovation, overallScore, feedback, successfulModels, failedModels },
  "cached": false
}
```

**Step 13 — UI rendering:**
- Client navigates to `/problems/[id]/solutions/[solutionId]`.
- `EvaluationView` renders the score, radar chart, dimension breakdown, model consensus info, strengths/weaknesses, pivot suggestions if any.

### Number of Models and Parallelism

- **3 primary models** run in **parallel** (`Promise.all`).
- Fallback for each failed slot runs **sequentially** (one at a time after `Promise.all` resolves).
- Maximum total models used: 6 (3 primary + 3 fallbacks), minimum: 0 (total failure).

### Scoring Dimensions

| Dimension | Range | What It Measures |
|---|---|---|
| Feasibility | 0–10 | Can this realistically be built and launched? |
| Effectiveness | 0–10 | How well does it solve the stated problem? |
| Scalability | 0–10 | Can this grow without linearly increasing costs? |
| Cost Efficiency | 0–10 | Is the unit economics story viable? |
| Innovation | 0–10 | How novel is this approach vs. existing solutions? |
| Overall Score | 0–100 | Mean of 5 dimension averages × 10 |

### Aggregation Algorithm

```
dim_avg = round(sum_of_dim_scores / number_of_successful_models)
overall = round(((feasibility + effectiveness + scalability + costEfficiency + innovation) / 5) * 10)
```

No weighting — all 5 dimensions are equal. No consensus disagreement handling (outlier detection, trimmed mean, etc.) is implemented.

### Domain Detection

Domains are **not auto-detected**. The user explicitly passes a `domain` parameter (`saas`, `healthcare`, `ecommerce`, `edtech`, `fintech`, `hardware`, `social`). If provided, additional domain-specific evaluation instructions are injected into the system prompt via `DOMAIN_HINTS` in `evaluator.ts`.

---

## 8. AI PROMPT ARCHITECTURE

### Prompt 1: Core Evaluation System Prompt

- **Location:** `src/lib/evaluator.ts` → `getSystemPrompt(domain?)`
- **Purpose:** Instruct model to act as startup evaluator and return structured JSON scores.
- **Inputs:** Optional domain hint string.
- **User message:** `"Problem:\n{problem}\n\nSolution:\n{solution}"`
- **Expected Output Schema:**
  ```json
  {
    "feasibility": 0-10,
    "effectiveness": 0-10,
    "scalability": 0-10,
    "costEfficiency": 0-10,
    "innovation": 0-10,
    "strengths": ["string", ...],
    "weaknesses": ["string", ...],
    "summary": "string"
  }
  ```
- **JSON Enforcement:** `response_format: { type: "json_object" }` + explicit schema in system prompt + Zod validation.
- **Prompt Version Tag:** `'evaluator-v1'` (logged to ai_requests)

---

### Prompt 2: Deep Report Prompt

- **Location:** `src/lib/deep-report-generator.ts` → `buildPrompt(problem, solution, domain?)`
- **Purpose:** Generate a 10-section VC-style due-diligence report.
- **Inputs:** problem, solution, optional domain.
- **Structure:** Single user message with full schema embedded.
- **Expected Output:** 10-section JSON object (see schema in Section 9: `deepReports.content`).
- **JSON Enforcement:** `response_format: { type: "json_object" }` + explicit schema in prompt + Zod validation.
- **Prompt Version Tag:** `'deep-report-v1'`

---

### Prompt 3: Devil's Advocate Prompt

- **Location:** `src/lib/devil-advocate-generator.ts` → inline in `generateDevilAdvocate()`
- **Purpose:** Generate a brutal structured critique with verdict, failure reasons, ignored competitors, founder traps.
- **Inputs:** problem, solution, optional domain.
- **Expected Output Schema:**
  ```json
  {
    "verdict": "string",
    "failureReasons": [{ "reason": "string", "severity": "Fatal|Severe|Moderate" }],
    "ignoredCompetitors": [{ "name": "string", "why_threat": "string" }],
    "founderTraps": ["string", ...],
    "conditionToReconsider": "string"
  }
  ```
- **JSON Enforcement:** `response_format: { type: "json_object" }` + Zod validation.

---

### Prompt 4: Stress Simulation Prompt

- **Location:** `src/lib/simulation.ts` → `getSimulationSystemPrompt()`
- **Purpose:** Evaluate solution resilience against a user-defined risk scenario.
- **Inputs:** problem, solution, scenario string.
- **Expected Output Schema:**
  ```json
  {
    "resilienceScore": 0-100,
    "analysis": "string",
    "strengths": ["string"],
    "weaknesses": ["string"],
    "recommendations": ["string"]
  }
  ```
- **JSON Enforcement:** `response_format: { type: "json_object" }` + Zod + clamping.

---

### Prompt 5: Pivot Suggestions Prompt

- **Location:** `src/lib/solution-generator.ts` → `generatePivots()`
- **Purpose:** Generate 3 strategic pivot directions for a low-scoring solution.
- **Inputs:** problem, solution, currentScore, optional domain.
- **Expected Output Schema:**
  ```json
  { "pivots": [{ "title": "", "description": "", "rationale": "", "estimatedScoreLift": "" }] }
  ```
- **JSON Enforcement:** `response_format: { type: "json_object" }` + Zod (exactly 3 pivots).

---

### Prompt 6: Solution Generator (AI Draft)

- **Location:** `src/app/api/generate-solution/route.ts` → `buildSystemPrompt(domainHint?)`
- **Purpose:** Draft a solution proposal (150–250 words) from the problem statement.
- **Output:** Plain prose text (not JSON). Streamed via SSE.
- **No JSON enforcement** — plain text output.

---

### Prompt 7: Solution Merger Prompt

- **Location:** `src/lib/solution-merger.ts` → `mergeSolutions()`
- **Purpose:** Synthesise 2–4 solution texts into one superior proposal.
- **Output:** Plain prose (200–400 words).
- **No JSON enforcement** — plain text.

---

### Prompt 8: Workspace @ai Assistant Prompt

- **Location:** `src/app/api/workspace/[id]/messages/route.ts`
- **Purpose:** Answer team questions about the problem and solutions in the context of the workspace.
- **Context Injected:** Problem title + description + top 3 solutions with scores.
- **Output:** Conversational prose (2–4 sentences max).
- **No JSON enforcement** — plain text.

---

### Prompt 9: Guided Questionnaire Solution Assembly

- **Location:** `src/lib/questionnaire-config.ts` (question definitions), assembly prompt is client-side in `src/components/solution-questionnaire.tsx`
- **Purpose:** The completed questionnaire answers are assembled into a solution draft prompt and submitted to `POST /api/generate-solution`.

---

## 9. DATABASE ARCHITECTURE

### Tables Overview

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Links to `auth.users.id` in Supabase |
| email | text (unique, not null) | |
| name | text | Optional display name |
| created_at | timestamptz | |
- **Populated by:** Postgres trigger `handle_new_user()` on Supabase auth signup.
- **RLS:** Users can read/update their own row only.

---

#### `problems`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Random |
| user_id | uuid (FK → users, cascade delete) | Nullable for guest problems |
| guest_session_id | uuid | Nullable; set for guest-owned problems |
| title | text (not null) | |
| description | text (not null) | |
| tags | text[] | Array of tags |
| is_public | boolean (default false) | Community visibility |
| created_at | timestamptz | |
| deleted_at | timestamptz | Soft delete marker |
- **RLS:** Auth user can read/write their own; `user_id IS NULL` allows guest access.

---

#### `solutions`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Random |
| problem_id | uuid (FK → problems, cascade delete, not null) | |
| user_id | uuid (FK → users, cascade delete) | Nullable for guests |
| guest_session_id | uuid | |
| content | text (not null) | Solution text |
| is_merged | boolean (default false) | Marks AI-merged solutions |
| merged_from_ids | text[] | Source solution UUIDs (stored as text[]) |
| deep_report | jsonb | **DEPRECATED** — legacy field; use `deep_reports` table |
| created_at | timestamptz | |
| deleted_at | timestamptz | Soft delete |

---

#### `evaluations`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| solution_id | uuid (FK → solutions, cascade delete, not null) | |
| feasibility | integer | 0–10 |
| effectiveness | integer | 0–10 |
| scalability | integer | 0–10 |
| cost_efficiency | integer | 0–10 |
| innovation | integer | 0–10 |
| overall_score | integer | 0–100 |
| domain | text | Optional domain hint used during evaluation |
| feedback | jsonb | `{ strengths: string[], weaknesses: string[], summary: string }` |
| pivot_suggestions | jsonb | Array of pivot objects or null (only when score < 60) |
| successful_models | jsonb | `string[]` |
| failed_models | jsonb | `string[]` |
| raw_responses | jsonb | Full per-model response data |
| consensus_result | jsonb | Averaged per-dimension scores |
| model_used | text | `'consensus-ensemble'` |
| prompt_version | text | `'evaluator-v1'` |
| generation_time_ms | integer | |
| prompt_tokens | integer | Total across all models |
| completion_tokens | integer | |
| total_tokens | integer | |
| estimated_cost | numeric(10,6) | In USD |
| content_hash | text | SHA-256 for caching |
| created_at | timestamptz | |

---

#### `deep_reports`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| solution_id | uuid (FK → solutions) | |
| status | text | `'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'` |
| version | integer | Auto-incremented per solution |
| model_used | text | Which model succeeded |
| content | jsonb | Full 10-section report (nullable until COMPLETED) |
| error_message | text | Set on FAILED |
| content_hash | text | SHA-256 for caching |
| + token/cost columns | | Same as evaluations |

---

#### `ai_requests`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users, set null on delete) | Nullable |
| endpoint | text (not null) | The URL called |
| model | text (not null) | Model ID |
| prompt_version | text | |
| latency | integer | ms |
| prompt/completion/total_tokens | integer | |
| estimated_cost | numeric(10,6) | |
| success | boolean (default true) | |
| error_message | text | |
| created_at | timestamptz | |
- **Purpose:** Audit log of every AI API call. Populated from all lib functions.
- **Note:** `user_id` is not populated in most calls (passed as `null` from lib functions). Logging the user requires the calling route to pass `userId` — not currently done in most lib functions.

---

#### `simulations`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| solution_id | uuid (FK) | |
| user_id | uuid (FK) | Nullable for guests |
| guest_session_id | uuid | |
| scenario | text | User-defined scenario |
| resilience_score | integer | 0–100 |
| feedback | jsonb | `{ analysis, strengths, weaknesses, recommendations }` |
| created_at | timestamptz | |

---

#### `devil_advocate_reports`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| solution_id | uuid (FK) | |
| report | jsonb | Full devil's advocate schema |
| created_at | timestamptz | |

---

#### `attachments`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| solution_id | uuid (FK) | |
| user_id | uuid (FK) | |
| name | text | Filename |
| url | text | File URL |
| file_type | text | |
| file_size | integer | |
- **Status:** PLANNED / PARTIAL — Schema and RLS exist; no upload route or UI component exists.

---

#### `problem_upvotes`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| problem_id | uuid (FK) | |
| user_id | uuid (FK) | |
| created_at | timestamptz | |
- **Unique constraint:** `(problem_id, user_id)`

---

#### `solution_ratings`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| solution_id | uuid (FK) | |
| user_id | uuid (FK) | |
| rating | integer | 1–5 |
| created_at, updated_at | timestamptz | |
- **Unique constraint:** `(solution_id, user_id)`

---

#### `problem_comments`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| problem_id | uuid (FK) | |
| user_id | uuid (FK) | |
| content | text (max 1000 chars enforced in API) | |
| created_at | timestamptz | |

---

#### `workspaces`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| problem_id | uuid (FK → problems) | |
| owner_id | uuid (FK → users) | |
| name | text | |
| invite_code | text (unique) | 8-char hex code |
| created_at | timestamptz | |
- **Constraint:** One workspace per problem (enforced in API, not DB).

---

#### `workspace_members`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| user_id | uuid (FK) | |
| role | text | `'owner' | 'editor' | 'viewer'` (default 'viewer') |
| joined_at | timestamptz | |
- **Unique constraint:** `(workspace_id, user_id)`

---

#### `workspace_messages`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| workspace_id | uuid (FK) | |
| user_id | uuid (FK, set null on delete) | Nullable (AI messages have null) |
| sender_name | text (default 'Unknown') | Denormalised for realtime |
| content | text | |
| type | text | `'text' | 'ai' | 'system'` |
| created_at | timestamptz | |

---

### Entity Relationship (Simplified)

```
users
  ↓ (1:many)
problems (is_public → community)
  ↓ (1:many)
solutions (is_merged, merged_from_ids)
  ↓ (1:many)
evaluations (scores, feedback, pivot_suggestions, raw_responses)
  ↓
deep_reports (10-section analysis, versioned)
devil_advocate_reports (critique)
simulations (resilience test)

problems ──→ problem_upvotes ←── users
solutions ──→ solution_ratings ←── users
problems ──→ problem_comments ←── users

problems ──→ workspaces
workspaces ──→ workspace_members ←── users
workspaces ──→ workspace_messages ←── users

solutions → attachments (PLANNED, no upload route)
ai_requests ←── (all AI lib functions)
```

---

## 10. API / SERVER ENDPOINT INVENTORY

### API Routes

| Method | Route | Purpose | Auth Required | Rate Limited | DB | AI |
|---|---|---|---|---|---|---|
| POST | `/api/evaluate` | Core multi-model evaluation | No (guests allowed) | Yes (Upstash) | Yes | Yes (Mesh, 3 models) |
| POST | `/api/simulate` | Stress simulation | No (guests allowed) | Yes (shared bucket) | Yes | Yes (Mesh) |
| POST | `/api/deep-report` | Generate 10-section deep report | Yes (owner only) | No | Yes | Yes (Mesh sequential) |
| POST | `/api/devil-advocate` | Devil's Advocate critique | Yes | No | Yes | Yes (Mesh) |
| POST | `/api/generate-solution` | AI draft solution (streaming) | No | No | No | Yes (Mesh SSE) |
| POST | `/api/merge-solutions` | Merge 2–4 solutions | Yes (problem owner) | No | Yes | Yes (Gemini + Mesh) |
| POST | `/api/comments` | Post a comment | Yes | No | Yes | No |
| GET | `/api/comments` | Fetch comments for a problem | No | No | Yes | No |
| DELETE | `/api/comments` | Delete a comment | Yes (author/owner) | No | Yes | No |
| POST | `/api/upvote` | Toggle upvote on a problem | Yes | No | Yes | No |
| POST | `/api/rate-solution` | Rate a solution (1–5 stars) | Yes | No | Yes | No |
| GET | `/api/rate-solution` | Get solution ratings | No | No | Yes | No |
| POST | `/api/workspace` | Create a workspace | Yes (problem owner) | No | Yes | No |
| GET | `/api/workspace` | Get workspace for a problem | Yes | No | Yes | No |
| POST | `/api/workspace/join` | Join workspace via invite code | Yes | No | Yes | No |
| GET | `/api/workspace/[id]/members` | Get workspace members | Yes (member) | No | Yes | No |
| GET | `/api/workspace/[id]/messages` | Get workspace messages (poll) | Yes (member) | No | Yes | No |
| POST | `/api/workspace/[id]/messages` | Send message (+ @ai trigger) | Yes (member) | No | Yes | Yes (Gemini + Mesh, if @ai) |
| GET | `/api/auth/callback` | Supabase OAuth callback | No | No | No | No |
| GET | `/api/sunrise-sunset` | UNVERIFIED — route directory exists, no file read | — | — | — | — |

### Server Actions (Next.js `'use server'`)

| Action | Purpose | Auth Required |
|---|---|---|
| `loginAction` | Email/password login | No |
| `signupAction` | Create account | No |
| `signOut` | Log out | Yes |
| `guestLoginAction` | Login as hardcoded demo account | No |
| `createProblemAction` | Create a new problem | Yes |
| `editProblemAction` | Edit problem details | Yes (owner) |
| `deleteProblemAction` | Soft-delete problem | Yes (owner) |
| `toggleProblemVisibilityAction` | Toggle public/private | Yes (owner) |
| `editSolutionAction` | Edit solution + re-evaluate | Yes (owner) |
| `deleteSolutionAction` | Soft-delete solution | Yes (owner) |

---

## 11. AUTHENTICATION & AUTHORIZATION

### Provider

**Supabase Auth** — email/password only. No OAuth providers (Google, GitHub, etc.) configured in the repository.

### Login/Signup Flow

1. User submits form → `loginAction` / `signupAction` server action.
2. `supabase.auth.signInWithPassword()` / `supabase.auth.signUp()`.
3. On success: `redirect('/dashboard')`.
4. Supabase Auth sets session cookie via `@supabase/ssr`.

### Sessions

- Managed by `@supabase/ssr` package.
- Session cookies are httpOnly, refreshed on every request by the middleware (`updateSession`).
- `createClient()` (server) and `createClient()` (client) are separate functions.

### Middleware

`src/middleware.ts` matches all routes except static files and calls `updateSession()` which refreshes the Supabase session cookie.

### Guest Users

Two distinct guest mechanisms:
1. **True guests:** No Supabase account. Use a `guest_session_id` UUID cookie for problem/solution ownership. Rate limited to 3 evaluations/24h.
2. **Demo guest login (`guestLoginAction`):** Signs in with a **hardcoded shared demo account** (email and password visible in source code at `src/app/auth-actions.ts` lines 13–14). This gives full dashboard access. ⚠️ **Security risk** if repository is public.

### Ownership Checks

- **Problems:** `problem.userId === user.id` (server-side in server actions and API routes).
- **Solutions:** `solution.userId === user.id`.
- **Guest solutions:** `solution.guestSessionId === guestSessionId` (cookie value).
- **Workspaces:** `workspace.ownerId === user.id` for creation/management; membership check for chat access.
- **Comments:** Author can delete; problem owner can also delete any comment.

### Row Level Security (RLS)

All tables have RLS enabled. Key policies:
- Users: read/update own row only.
- Problems/Solutions: auth user sees own rows; `user_id IS NULL` rows are accessible by everyone (potential over-permissiveness — see Section 15).
- Evaluations: visible if associated solution is visible.
- Community upvotes/ratings/comments: authenticated users can read all; manage their own.
- Workspace: owner and members only.

### Workspace Roles

Three roles: `'owner'`, `'editor'`, `'viewer'`. However, the **role is stored but not actively enforced beyond member vs. non-member** — all members can currently send messages and trigger @ai. The `editor` vs. `viewer` distinction has no functional enforcement in the current codebase.

---

## 12. RATE LIMITING & COST CONTROL

### Implementation

**Upstash Redis + @upstash/ratelimit** via sliding-window algorithm.

| Tier | Limit | Window | Key |
|---|---|---|---|
| Guest | 3 requests | 24 hours | `guest:{session_id}:{ip}` |
| Authenticated user | 10 requests | 1 hour | `{user_id}` |

### Coverage

Rate limiting is applied to:
- `POST /api/evaluate`
- `POST /api/simulate`

**Not rate limited:**
- `/api/deep-report`
- `/api/devil-advocate`
- `/api/generate-solution`
- `/api/merge-solutions`
- `/api/workspace/[id]/messages` (including @ai calls)

This is a significant cost control gap — a logged-in user can trigger unlimited deep reports, devil's advocate reports, simulations, and workspace AI calls.

### Fail-Open Behaviour

If Upstash Redis is not configured (missing env vars), rate limiting is **disabled silently** with a console warning. This is by design for local development but creates a risk if env vars are missing in production.

### AI Timeout Controls

- Core evaluation: 25-second AbortController timeout per model call.
- All other AI features: **No explicit timeout** — relies on platform default (Render/Node.js may impose 30-60 second request limits).

### Retry Limits

- Core evaluation: 2 retries per model (3 total attempts per model).
- All other features: No retry logic.

### Content Hash Caching

Both `/api/evaluate` and `/api/deep-report` implement SHA-256 content hashing to avoid calling the AI for identical problem+solution pairs. This is the primary cost optimisation mechanism.

---

## 13. COMMUNITY / "GITHUB FOR IDEAS" LAYER

### ALREADY IMPLEMENTED

| Feature | Implementation Evidence |
|---|---|
| Public problems | `problems.is_public`, toggle via `toggleProblemVisibilityAction` |
| Community board | `/community` page with Latest/Top sorting |
| Problem upvotes | `problem_upvotes` table, `POST /api/upvote`, `UpvoteButton` component |
| Solution ratings (1–5 stars) | `solution_ratings` table, `POST /api/rate-solution`, `CommunityScoreWidget` component |
| Comments on problems | `problem_comments` table, `GET/POST/DELETE /api/comments`, `CommentSection` component |
| Collaboration workspaces | `workspaces`, `workspace_members` tables; invite code system; workspace chat page |
| Team realtime chat | `workspace_messages` table, Supabase Realtime subscription in `WorkspaceChat` |
| AI inside workspace | `@ai` trigger in messages, Gemini + Mesh fallback |
| Workspace invite system | Invite code generation, `POST /api/workspace/join` |

### PARTIALLY IMPLEMENTED

| Feature | Status |
|---|---|
| Author display | Author name/email appears on community board, but no dedicated profile page exists |
| Workspace roles | `owner/editor/viewer` stored in DB but only owner vs. member is enforced |
| Guest community viewing | Community page allows unauthenticated read, but many interactions require auth |
| File attachments | `attachments` table and RLS defined; no upload endpoint or UI |

### NOT YET IMPLEMENTED

| Feature |
|---|
| User public profile pages |
| Following other users |
| Notification system |
| Solution forking / remixing |
| Problem/solution versioning |
| Contribution history / activity feed |
| Trending ideas algorithm |
| Discovery / recommendation feed |
| Team management beyond workspace |
| Reputation / karma system |
| Tags-based browsing / filtering on community board |
| Search across problems |

---

## 14. COLLABORATION ARCHITECTURE

### Workspace Creation

- Authenticated problem owner triggers `POST /api/workspace` with `{ problemId, name }`.
- Server generates an 8-character random hex invite code.
- Creates `workspaces` row and `workspace_members` row (owner with role `'owner'`).
- One workspace per problem enforced in API (returns 409 if already exists).

### Membership

- Joining: `POST /api/workspace/join` with invite code → validates code → inserts `workspace_members` row with role `'viewer'`.
- Membership check: `getMemberRole(workspaceId, userId)` → returns null if not a member.

### Roles

| Role | Stored | Enforced |
|---|---|---|
| owner | Yes | Workspace creation/management |
| editor | Yes | No differentiated behaviour from viewer |
| viewer | Yes | No differentiated behaviour from editor |

### Realtime Chat

- `WorkspaceChat` client component subscribes to Supabase Realtime `postgres_changes` on `workspace_messages` table filtered by `workspace_id`.
- On INSERT event: new message appended to local state with duplicate deduplication.
- Optimistic messages shown immediately; reconciled with real ID when Realtime event or HTTP response arrives.

### AI Integration in Chat

Triggered when a message starts with `@ai`:
1. Extracts question text.
2. Fetches workspace's problem title + description.
3. Fetches top 3 solutions by score.
4. Constructs context prompt.
5. Tries Gemini 2.0 Flash via SDK.
6. Falls back through Mesh API models.
7. Inserts AI response as a `workspace_messages` row with `type='ai'`.
8. Realtime propagates to all connected clients.

### Polling Mechanism

The workspace chat page uses Supabase Realtime for live message delivery. There is no HTTP polling — pure push via WebSocket.

### Database Tables

`workspaces`, `workspace_members`, `workspace_messages` (see Section 9).

---

## 15. SECURITY AUDIT SUMMARY

### CRITICAL

| Issue | Description |
|---|---|
| **Hardcoded demo credentials in source code** | `guestLoginAction` in `src/app/auth-actions.ts` (lines 13–14) contains a hardcoded email and password for the demo account. If the repository is or becomes public, anyone can authenticate as this account and access the full dashboard. |

### HIGH

| Issue | Description |
|---|---|
| **Unprotected AI endpoints** | `/api/deep-report`, `/api/devil-advocate`, `/api/generate-solution`, `/api/merge-solutions`, and `/api/workspace/[id]/messages` (when `@ai` triggered) have **no rate limiting**. An authenticated user can generate unlimited AI calls, draining the Mesh API credit balance. |
| **RLS over-permissiveness on guest resources** | Problems and solutions with `user_id IS NULL` are accessible by all users (including other authenticated users) via direct Supabase client queries. Server-side ownership checks only protect server action and API route paths. |
| **Missing timeout on most AI calls** | Deep report, devil's advocate, simulation, workspace @ai have no explicit AbortController timeout. A slow model response could hold a server connection open indefinitely, consuming resources. |

### MEDIUM

| Issue | Description |
|---|---|
| **Workspace editor/viewer roles not enforced** | The role column is stored but has no functional differentiation; all workspace members have identical permissions. |
| **`ai_requests` userId not populated** | The audit log table has a `user_id` column but it is passed as `null` from most lib functions. Cost/usage cannot be attributed to specific users. |
| **No prompt injection protection** | User-supplied problem and solution text is interpolated directly into prompts. A malicious user could attempt to inject adversarial instructions. Mitigation: `response_format: json_object` limits damage for structured-output calls, but generate-solution and merger use plain text output. |
| **Content hash caching returns other users' results** | The `/api/evaluate` cache matches on content hash alone — if two users submit the same problem+solution text, the second user receives a clone of the first user's evaluation without triggering AI. This is intended for cost savings but could leak aggregated data (successful/failed model lists, token counts) between users. |
| **No CSRF protection beyond Next.js defaults** | Server Actions have CSRF protection built into Next.js. API routes depend on the `Authorization` cookie, which provides implicit CSRF protection as long as SameSite cookies are configured correctly by Supabase. |

### LOW

| Issue | Description |
|---|---|
| **No input sanitisation for stored text** | Problem/solution text is stored as-is. XSS risk is mitigated by React's default escaping, but stored content is not sanitised server-side. |
| **`sunrise-sunset` API route directory exists** | A `/api/sunrise-sunset` directory is present in the app but no `route.ts` file was found. If this is a stub, it should be removed. |
| **Logging errors but not surfacing them** | Many catch blocks log errors with `console.error` but return generic 500 messages. Production observability (error tracking like Sentry) is absent. |

---

## 16. DEPLOYMENT & PRODUCTION STATUS

### Deployment Platform

**Render** — Docker container. Evidenced by `Dockerfile` and commit `2f92ab3: "prepare application for Render deployment"`.

### Dockerfile

- **Base image:** `node:20-alpine`
- **Build stage:** Copies source, runs `npm ci`, then `npm run build`.
- **Run stage:** Copies built app, exposes port 3000.
- **Startup command:** `sh -c "npm run db:migrate && npm run start"` — runs Drizzle migrations on every container start before serving.

### Environment Variables Required for Production

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `MESH_API_KEY` | Mesh API bearer token |
| `GEMINI_API_KEY` | Google Gemini API key (optional; Mesh is fallback) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (optional; rate limiting disabled without it) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |
| `NEXT_PUBLIC_SITE_URL` | Production URL for OAuth callbacks |

### Production Readiness Assessment

| Area | Status |
|---|---|
| Build | ✅ Dockerfile present, build command defined |
| Migrations | ✅ Auto-run on startup |
| Core feature set | ✅ Functional |
| Rate limiting | ⚠️ Partial (only covers 2 of 8 AI endpoints) |
| Error monitoring | ❌ No Sentry/Datadog/similar integration |
| Logging | ⚠️ Only `console.log/warn/error` — no structured logs |
| Tests | ❌ No automated tests (a `test:eval` script exists but runs a manual test script) |
| Production URL | Not documented in repository |

---

## 17. HACKATHON-SPECIFIC CHANGES

### Git Timeline

| Date | Commit | Description |
|---|---|---|
| 2026-06-16 | `89c0a78` | Initial commit from Create Next App |
| 2026-07-03 | `3c6b12e` | First commit — core application |
| 2026-07-06 | `2f92ab3` | Render deployment prep, Dockerfile |
| 2026-07-06 | `57c9ae8` | ESLint fix for Next.js 16 |
| 2026-07-07 | `2957c98` | "Continue as Guest" login option |
| 2026-07-07 | `41e93c8` | Workspaces, comments, solution merging, @ai assistant |
| 2026-07-12 | `d61c21f` | **Migrate all AI calls from OpenRouter to Mesh API** |
| 2026-07-12 | `91686b1` | Light/dark mode toggle + Mesh multi-model breakdown UI |
| 2026-07-12 | `dad980e` | Pentagon radar chart (replaces circular score ring) |
| 2026-07-12 | `5a7c17b` | README updated to highlight Mesh API integration |
| 2026-07-12 | `7dcfd4c` | `aiRequests` table + migration files |

### BEFORE MESH HACKATHON (Pre `d61c21f`)

Based on commit messages:
- The application used **OpenRouter** as the AI provider.
- The function `runOpenRouterModel` in `evaluator.ts` retains its original name but now calls Mesh API. This is an unmistakable code artifact of the migration.
- Core features (evaluation, workspaces, comments, merging) were already implemented before the Mesh migration.
- The circular score ring UI was the original evaluation visualisation.

### ADDED/CHANGED FOR MESH HACKATHON

All changes on **2026-07-12** (`d61c21f` through `7dcfd4c`):
1. **Full OpenRouter → Mesh API migration** — all `fetch` calls updated from `openrouter.ai` to `api.meshapi.ai`; environment variable renamed to `MESH_API_KEY`.
2. **`aiRequests` audit table** — new schema table, migration file, and logging in all AI lib functions.
3. **Light/dark mode toggle** — `ThemeProvider`, `ThemeToggle` components.
4. **Mesh multi-model consensus breakdown UI** — shows which models succeeded/failed in `EvaluationView`.
5. **Pentagon radar chart** — replaced circular score ring with `PentagonRadarChart` component (custom SVG).
6. **README documentation update** — highlighted Mesh API as the AI backbone.

### Important: What Was NOT Changed for Hackathon

- The database schema (core tables) was designed before the hackathon.
- The evaluation logic (parallel calls, fallback, aggregation) predates the Mesh migration — the architecture is identical; only the endpoint URL changed.
- Workspaces, solution merging, comments, and community features were built in the commit on 2026-07-07, before the Mesh migration.

---

## 18. CURRENT PROJECT STRENGTHS

### 1. Production-Grade Multi-Model Consensus (Verified)
Three models called in parallel, fallback per failed slot, results aggregated with per-dimension averages, scores clamped and Zod-validated. This is not a prototype — it is a complete, working consensus pipeline with error handling and retry logic.

### 2. Comprehensive AI Feature Set (Verified)
Seven distinct AI-powered features in a single app: evaluation, deep report, devil's advocate, stress simulation, solution generation, solution merging, and workspace @ai assistant. Each backed by a different prompt strategy and output schema.

### 3. Content Hash Caching (Verified)
SHA-256 caching avoids redundant AI calls for identical content. A pragmatic cost-control mechanism that also reduces latency for repeated evaluations.

### 4. AI Request Audit Log (Verified)
The `ai_requests` table tracks every AI call with model, latency, token counts, estimated cost, and success/failure. This is the foundation for cost attribution and observability.

### 5. Structured Output with Zod Validation (Verified)
All AI responses are schema-validated with Zod before use. Malformed responses cause the model slot to fail cleanly rather than corrupting the UI.

### 6. Real-Time Collaboration (Verified)
Supabase Realtime powers the workspace chat with optimistic UI updates, duplicate deduplication, and `@ai` trigger — all implemented cleanly in a single client component.

### 7. Guest Evaluation Flow (Verified)
Full evaluation experience without requiring account creation, with rate limiting enforced via cookie+IP to prevent abuse.

### 8. Streaming AI Response (Verified)
`/api/generate-solution` implements SSE streaming from Mesh API, forwarding delta chunks token-by-token to the client — a notably advanced implementation for a hackathon project.

### 9. Soft Delete Pattern (Verified)
`deleted_at` soft-delete on problems and solutions preserves evaluation history integrity.

### 10. Domain-Specific Evaluation (Verified)
Seven domain configurations with specialised evaluation hints (saas, healthcare, fintech, etc.) and guided questionnaires per domain. Each domain has ~8–10 structured questions.

---

## 19. CURRENT LIMITATIONS & TECHNICAL DEBT

### CRITICAL

| Issue | Impact |
|---|---|
| Hardcoded demo credentials | Security breach if repository is public |
| Rate limits cover only 2 of 8 AI endpoints | Unlimited Mesh API calls possible for authenticated users — direct cost risk |

### HIGH

| Issue | Impact |
|---|---|
| No automated tests | Regressions not caught; confidence in correctness is human-only |
| No observability/error monitoring | Production failures are invisible |
| Missing timeout on most AI calls | Runaway AI calls can exhaust server resources |
| `summary` field uses only first successful model | Consensus "summary" is not truly a consensus — it's one model's opinion |
| `ai_requests.user_id` not populated | Cost cannot be attributed to users |
| No input length limits | Adversaries can send very long prompts, inflating token costs |

### MEDIUM

| Issue | Impact |
|---|---|
| Workspace editor/viewer roles unused | Role-based access control is incomplete |
| `solutions.deep_report` field is deprecated | Dead column in schema; could confuse future developers |
| Domain not preserved on solution edit re-evaluation | Re-evaluation uses no domain context even if original had one |
| No test for the `test:eval.ts` script | Utility script exists but is ad-hoc |
| Content hash cache shares across users | Evaluation telemetry (model list, token counts) leaks between users with identical content |
| Solution merger tries Gemini SDK before Mesh | If `GEMINI_API_KEY` is unset (valid scenario), Gemini fails silently and Mesh handles it. Works, but the fallback path is the primary for pure Mesh deployments. |
| Attachments schema exists without upload capability | Creates schema confusion and a dangling migration |
| No pagination on community board | As problems scale, single-query fetch will become slow |
| No search on community board | Discovery is limited to scrolling |
| `sunrise-sunset` API route directory exists with no file | Dead directory |

### LOW

| Issue | Impact |
|---|---|
| Cost estimation uses hardcoded static rates | Rates drift over time as providers change pricing |
| No OpenAI-compatible key management | Single global `MESH_API_KEY`; no per-user key or usage budgets |
| No structured logging | `console.log` only; not suitable for log aggregation tools |
| `mergedFromIds` stored as `text[]` not `uuid[]` | Type mismatch (stored as text[], referenced as uuid[]) |

---

## 20. DEPENDENCY ON MESH API

### What Idea Checker Currently Uses Mesh For

| Feature | Mesh Dependency |
|---|---|
| Core evaluation | Primary and required — 3 concurrent models |
| Deep report | Primary and required — sequential fallback |
| Devil's Advocate | Primary and only provider |
| Stress simulation | Primary and only provider |
| Pivot suggestions | Primary and only provider |
| Solution generation (streaming) | Primary and only streaming provider |
| Solution merging | Fallback (Gemini SDK is primary) |
| Workspace @ai | Fallback (Gemini SDK is primary) |

### What Would Stop Working if Mesh Disappeared

Without `MESH_API_KEY`:
- Core evaluation → **total failure** (application's primary value proposition gone)
- Deep report → **total failure**
- Devil's Advocate → **total failure**
- Stress simulation → **total failure**
- Pivot suggestions → **silent failure** (non-fatal; evaluation still works without pivots)
- Solution generation → **total failure** (no alternative implemented)
- Solution merging → **partial failure** (Gemini SDK works if `GEMINI_API_KEY` is set)
- Workspace @ai → **partial failure** (Gemini SDK works if configured)

**Net result:** The application's core value is entirely Mesh-dependent.

### Architectural Coupling Assessment

**Highly coupled:**
- All API calls use a single hardcoded base URL (`https://api.meshapi.ai/v1/chat/completions`).
- All authentication is a single bearer token in one env var.
- Model IDs are hardcoded strings matching Mesh's model catalogue.
- The OpenAI-compatible API format means **switching to another OpenAI-compatible gateway would require only updating the base URL and API key** — no client library change needed.

### Could Another Provider Replace Mesh?

Yes, with minimal code changes — because the integration uses direct `fetch()` calls to an OpenAI-compatible endpoint. Changing `https://api.meshapi.ai/v1/chat/completions` to another OpenAI-compatible provider URL + updating `MESH_API_KEY` would be sufficient. The models would need to be remapped to the new provider's catalogue.

### What Benefits Mesh Currently Provides

1. **Multi-provider access via one API key** — Llama (Meta), Gemini (Google), and Claude (Anthropic) accessed through a single endpoint and authentication.
2. **OpenAI-compatible API** — no custom SDK needed, reducing dependency surface.
3. **JSON object response format** — enforced structured outputs simplify prompt engineering.
4. **Low cost for hackathon scale** — ~₹50 funded the hackathon development and testing.

### Where Deeper Mesh Partnership Could Improve Idea Checker

**FACTS (based on current code):**
- Rate limiting is application-side (Upstash). Mesh API itself can provide request-level controls if a partnership enables usage budgets or per-key limits.
- Cost estimation is currently a local calculation with hardcoded rates. Real billing data from Mesh API could provide accurate cost attribution.
- The `ai_requests` audit table is built for observability but has no dashboard; Mesh API analytics (if available via partnership) could complement it.

**POTENTIAL (not currently implemented):**
- Dynamic model routing — instead of hardcoded model IDs, Mesh could route to the best available model for a given task type.
- Real-time token budget enforcement — Mesh could enforce per-user cost budgets without Idea Checker managing this.
- Model streaming for all AI features (currently only solution generation streams).
- Access to additional models available in Mesh's catalogue (GPT-4o, Claude Sonnet, etc.) for premium tiers.

---

## 21. PRODUCT ROADMAP EVIDENCE

### CONFIRMED / EXPLICIT ROADMAP

Evidence from `PROJECT_DESCRIPTION.md` and `WORKFLOW_AND_FEATURES.md` (files exist but code is the truth standard; documented as confirmed where code supports or explicitly describes):

- **"GitHub for Ideas" vision** — explicitly documented in `PROJECT_DESCRIPTION.md`.
- **Solution merging** — implemented and documented.
- **Workspaces** — implemented.
- **Community board** — implemented.

### POTENTIAL FUTURE OPPORTUNITIES

Inferred from schema/code artifacts:

| Opportunity | Evidence |
|---|---|
| File attachment upload | `attachments` table, RLS, and schema exist; no upload route |
| User reputation / scoring | No implementation; implied by community layer |
| Advanced workspace role enforcement | Role column exists but only member vs. non-member enforced |
| Cost/usage dashboard for users | `ai_requests` table and `estimatedCost` fields suggest this intent |
| Per-domain community feeds | Tags and domain fields in schema suggest filtering intent |
| Email notifications | No implementation; implied by workspace/community social layer |
| Evaluation comparison (A/B solutions) | Score timeline component hints at this; no comparison view |
| API access for developers | No API key management or public API; OpenAI-compatible format suggests potential |
| Premium tier (unlimited evaluations) | Rate limit tier structure (guest vs. user) implies premium tiers are planned |
| Sharing/embed evaluation results | `guest-evaluation/[solutionId]` page exists — a shareable URL for an evaluation |

---

## 22. PARTNERSHIP-READY PROJECT SUMMARY

### A. Idea Checker in One Sentence

Idea Checker is a multi-model AI consensus platform that evaluates startup ideas across five business dimensions, providing founders with structured scores, deep analysis, devil's advocate critiques, risk simulations, and collaborative validation workspaces — all powered by Mesh API.

### B. The Problem (2–3 sentences)

Most startup ideas fail not because of bad execution, but because critical assumptions were never tested. Early-stage founders lack access to rigorous, structured feedback that venture capitalists, consultants, and experienced advisors would provide. The alternatives — advisors, accelerators, peer networks — are expensive, slow, and not always accessible.

### C. Current Solution (3–5 sentences)

Idea Checker takes a problem statement and proposed solution, then orchestrates three AI models in parallel through Mesh API to independently score the idea across Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation (each 0–10). The scores are aggregated into a consensus (0–100), surfaced with per-dimension feedback, strengths, weaknesses, and an overall summary. Beyond the score, users can generate a 10-section deep report (market sizing, competitive landscape, regulatory risks, etc.), a Devil's Advocate critique, and a stress-test simulation against custom risk scenarios — each using a different AI model and prompt strategy. If a solution scores below 60, three pivot suggestions are automatically generated. The platform also supports team collaboration via invite-code workspaces with realtime chat and an @ai assistant that answers questions in the context of the team's problem and solutions.

### D. What Makes It Technically Interesting

- **Multi-model consensus with per-model tracking:** Three models run concurrently; failures trigger fallbacks; individual model responses and tokens are logged — not just the aggregated score.
- **Seven distinct AI-powered features** with different prompt strategies, structured schemas, and Zod validation — all in one Next.js application.
- **Streaming AI generation** via Mesh API SSE, forwarding token deltas to the client for the solution draft feature.
- **Content hash caching** for zero-cost repeat evaluations of identical content.
- **Full observability schema** (`ai_requests` table) capturing per-call latency, model, tokens, cost, and success/failure.

### E. Exactly How Mesh Is Currently Used

Mesh API is the primary AI provider for 6 of the 7 AI features. All calls go to `https://api.meshapi.ai/v1/chat/completions` with Bearer token authentication. Models currently used: `meta-llama/llama-3.3-70b-instruct` (dominant), `google/gemini-flash-1.5`, and `anthropic/claude-3-haiku`. Response format is `json_object` for all structured features; SSE streaming for solution generation. Every call is logged to the `ai_requests` audit table with latency, token counts, and estimated cost.

### F. Why Mesh + Idea Checker Could Make Strategic Sense

Idea Checker is a **showcase of multi-model orchestration** — exactly the capability that differentiates a mesh/gateway API from a single-model API. Every evaluation is a live demonstration of consensus across three different model providers. A partnership could:
- Use Idea Checker as a reference implementation of multi-model routing.
- Provide real billing data to replace the current hardcoded cost estimation.
- Enable model expansion (GPT-4o, Claude Sonnet) for premium evaluation tiers.
- Provide per-request budget controls to replace the current application-side rate limiting.

### G. Current Traction / Evidence Available in Repository

- Fully functional application with 7 distinct AI features.
- Complete database schema with 15 tables, migrations, and RLS.
- Git history spanning ~5 weeks from initial commit to hackathon submission.
- `aiRequests` audit table in place — shows intent to track and report usage.
- Mesh API migration commit (`d61c21f`) explicitly documents the OpenRouter → Mesh transition.

### H. Current Biggest Limitations

1. Rate limiting covers only 2 of 8 AI endpoints — cost exposure risk.
2. No automated tests — correctness relies on manual verification.
3. No observability stack — production failures are invisible.
4. Hardcoded demo credentials — security risk for public repositories.
5. No user-level cost attribution in the AI audit log.

### I. Most Credible Next 3 Product Milestones

1. **Complete rate limiting on all AI endpoints** — closes the cost exposure gap; makes the product safe for public launch.
2. **User profile pages + solution/problem history** — first step toward the GitHub-for-Ideas identity layer.
3. **File attachment upload support** — schema is ready; API route + storage (Supabase Storage) needed; unlocks richer solution proposals with supporting documents.

### J. Technical Questions Mesh May Ask

- "How do you handle model failures mid-evaluation?" → Per-slot fallback to `meta-llama/llama-3.3-70b-instruct`; if fallback fails, model is marked as failed; aggregation proceeds on successful models; total failure only if all models fail.
- "How do you control costs?" → Content hash caching + Upstash rate limiting on evaluation and simulation endpoints; deep report / devil's advocate have no rate limiting currently.
- "How do you validate AI outputs?" → Zod schemas on all structured outputs; JSON.parse with code fence stripping; numeric clamping on scores.
- "Do you use streaming?" → Yes, for `/api/generate-solution` via SSE; other features use standard request/response.
- "Which models do you use and why?" → Llama 3.3 70B (cost-effective, strong reasoning), Gemini 1.5 Flash (fast, Google ecosystem), Claude 3 Haiku (strong instruction following, low cost). Chosen for diverse model lineage to maximise consensus independence.
- "How tightly coupled are you to Mesh specifically?" → Base URL is hardcoded; however, the integration is standard OpenAI-compatible fetch calls. Switching providers requires only updating the URL and API key — no SDK dependency.

### K. Product/Business Questions Mesh May Ask

- "Who are your users?" → Early-stage founders, product managers, startup students, solo builders.
- "What's your monetisation plan?" → Not implemented; rate limit tier structure implies freemium model (guest/free user/pro).
- "What's your community size?" → Development-stage; no production user metrics available in the repository.
- "Why should Mesh partner with you rather than another project?" → Multi-model consensus is Idea Checker's entire value proposition — it only makes sense with a gateway API that provides access to multiple model providers. Single-provider apps don't demonstrate the full Mesh capability.
- "Is this production-ready?" → Core features are functional; missing observability, comprehensive rate limiting, and automated tests before a public launch.

---

## 23. IMPORTANT FILE MAP

### Core AI Logic

| File | Purpose | Why It Matters |
|---|---|---|
| `src/lib/evaluator.ts` | Multi-model consensus engine | Heart of the product; contains all Mesh API orchestration, retry logic, fallback, aggregation |
| `src/lib/deep-report-generator.ts` | 10-section deep report generation | Shows sequential model fallback pattern; full prompt and Zod schema |
| `src/lib/devil-advocate-generator.ts` | Devil's Advocate critique | Shows single-model usage pattern; complete prompt |
| `src/lib/simulation.ts` | Stress simulation | Shows risk analysis prompt and schema |
| `src/lib/solution-generator.ts` | Pivot suggestions + domain hints | Shows auto-trigger on low score |
| `src/lib/solution-merger.ts` | Solution merging | Shows Gemini SDK → Mesh fallback pattern |
| `src/lib/questionnaire-config.ts` | Domain-specific questionnaires | 656 lines of structured question definitions for 7 domains |
| `src/lib/ratelimit.ts` | Upstash Redis rate limiter | Shows two-tier rate limiting (guest vs. user) |

### API Routes

| File | Purpose | Why It Matters |
|---|---|---|
| `src/app/api/evaluate/route.ts` | Core evaluation endpoint | Rate limiting, caching, problem/solution persistence, full pipeline orchestration |
| `src/app/api/deep-report/route.ts` | Deep report endpoint | Status tracking (PENDING/RUNNING/COMPLETED/FAILED), versioning, caching |
| `src/app/api/generate-solution/route.ts` | Streaming solution generator | SSE streaming implementation via Mesh API |
| `src/app/api/workspace/[id]/messages/route.ts` | Workspace chat + @ai | Realtime message handling, Gemini + Mesh @ai trigger |
| `src/app/api/merge-solutions/route.ts` | Solution merger | Shows Gemini + Mesh hybrid AI usage |
| `src/app/api/simulate/route.ts` | Stress simulation endpoint | Guest-accessible AI endpoint with rate limiting |
| `src/app/api/devil-advocate/route.ts` | Devil's Advocate endpoint | Ownership + public-problem access logic |
| `src/app/api/comments/route.ts` | Comment CRUD | Community social layer implementation |
| `src/app/api/upvote/route.ts` | Upvote toggle | Toggle pattern with count return |
| `src/app/api/rate-solution/route.ts` | Star rating | Upsert rating with aggregate stats |

### Database

| File | Purpose | Why It Matters |
|---|---|---|
| `src/db/schema.ts` | Complete Drizzle schema | Single source of truth for all 15 tables |
| `supabase/policies_and_triggers.sql` | RLS policies + auth trigger | All security policies; auth user sync trigger |
| `drizzle.config.ts` | Drizzle ORM config | DB connection config |
| `drizzle/0000_wide_liz_osborn.sql` | Initial migration | Original schema |
| `drizzle/0007_small_vanisher.sql` | Latest migration | Most recent schema changes |

### Frontend Pages

| File | Purpose | Why It Matters |
|---|---|---|
| `src/app/page.tsx` | Landing page | Entry point |
| `src/app/(dashboard)/dashboard/page.tsx` | User dashboard | Shows all user problems |
| `src/app/(dashboard)/problems/[id]/page.tsx` | Problem detail | Most complex page; shows solutions, scores, community features |
| `src/app/(dashboard)/problems/[id]/solutions/[solutionId]/page.tsx` | Solution detail | Full evaluation UI with all analysis tabs |
| `src/app/(dashboard)/community/page.tsx` | Community board | Public problems, upvotes, sort |
| `src/app/(dashboard)/workspace/[id]/page.tsx` | Workspace chat | Realtime collaboration |

### Frontend Components

| File | Purpose | Why It Matters |
|---|---|---|
| `src/components/evaluation-view.tsx` | Evaluation results display | Core feature UI; shows score, radar chart, model breakdown |
| `src/components/pentagon-radar-chart.tsx` | Custom SVG radar chart | Hackathon-added visualisation |
| `src/components/solution-form.tsx` | Solution submission form | Quick + guided evaluation entry points |
| `src/components/deep-report-view.tsx` | Deep report rendering | 19KB component; full 10-section report UI |
| `src/components/stress-test-view.tsx` | Stress simulation UI | Risk simulation result rendering |
| `src/components/devil-advocate-view.tsx` | Devil's Advocate UI | Critique rendering |
| `src/components/workspace-chat.tsx` | Realtime chat component | Supabase Realtime subscription + optimistic UI |
| `src/components/solution-questionnaire.tsx` | Domain questionnaire | Multi-step guided evaluation form |

### Configuration

| File | Purpose | Why It Matters |
|---|---|---|
| `.env.example` | Environment variable template | Documents all required config |
| `Dockerfile` | Container build + run | Render deployment; runs migrations on start |
| `next.config.ts` | Next.js config | Minimal config |
| `src/middleware.ts` | Route middleware | Session refresh on every request |
| `src/app/auth-actions.ts` | Auth server actions | ⚠️ Contains hardcoded demo credentials (lines 13–14) |

---

*End of IDEA_CHECKER_CURRENT_CONTEXT.md*  
*Audited against actual source code. Total source files inspected: ~60+ files across all directories.*  
*Git history verified: 11 commits, 2026-06-16 to 2026-07-12.*
