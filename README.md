# Idea Checker — MVP Production Web Application

Idea Checker helps developers, startup founders, and PMs validate whether a proposed solution actually solves a stated problem. It utilizes a multi-model consensus AI engine, stress simulators, deep McKinsey-style business analysts, and real-time team collaboration workspaces to evaluate product viability.

---

## Technical Stack
* **Framework**: Next.js 15 (App Router, Server Actions, Server & Client Components)
* **Language**: TypeScript
* **Styling**: Tailwind CSS v4, shadcn/ui components (via Sonner)
* **Auth & Realtime**: Supabase Auth & Supabase Realtime (for workspace messaging sync)
* **Database & ORM**: PostgreSQL, Drizzle ORM (using `postgres.js` adapter)
* **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
* **AI Evaluation Engines**:
  - **OpenRouter Free Models** (Llama 3.3 70B, GPT OSS 120B, Nemotron 3 120B) for multi-model consensus evaluation.
  - **Nemetron Free Model Fallback** in case of OpenRouter query failures.
  - **Direct Google Gemini API** (`gemini-2.0-flash`, `gemini-1.5-flash`) for workspace `@ai` interactions, business model reports, and solution merges.

---

## Core Features

1. **Consensus Score Evaluation**: Inputs a problem & solution to run parallel analysis across 5 key dimensions (Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation) with average scoring.
2. **AI Solution Merging**: Combines 2 to 4 solutions using Gemini AI to synthesize a single, superior proposal.
3. **Collaboration Workspaces**: Dedicated team pages where members chat in real-time, propose solutions, and ask questions to the AI assistant using `@ai`.
4. **Community Feedback**: Enables upvoting, solution star ratings (1-5), and comments on public problems.
5. **Devil's Advocate & Simulations**: Subject solutions to critique (ignored competitors, founder traps) and stress-tests under chosen scenarios.

---

## Project Structure
```
idea-checker/
├── drizzle/                    # Generated database migrations
├── scripts/
│   └── apply-migration.ts      # Custom migration runner applying schema and realtime RLS
├── supabase/
│   └── policies_and_triggers.sql # SQL script for Supabase database setup & user triggers
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login and Registration routes
│   │   ├── (dashboard)/        # Workspace, problems detail, and hub pages
│   │   │   ├── dashboard/      # User dashboard showing owned problems
│   │   │   ├── problems/       # Problem detail & solution listings
│   │   │   └── workspace/      # Team workspaces and join invite routes
│   │   ├── api/
│   │   │   ├── auth/callback/  # Auth exchange code handler
│   │   │   ├── comments/       # Public comments endpoints (GET, POST, DELETE)
│   │   │   ├── evaluate/       # Main POST endpoint triggering consensus evaluations
│   │   │   ├── merge-solutions/# Solution synthesis endpoint
│   │   │   └── workspace/      # Workspace message feeds, creation, and members endpoints
│   │   ├── guest-evaluation/   # Public view of guest-submitted evaluations
│   │   ├── globals.css         # Styling system
│   │   ├── layout.tsx          # Root theme provider and sonner toaster
│   │   └── page.tsx            # Landing page with Quick Evaluation form
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Core shadcn components
│   │   ├── comment-section.tsx # Comments listing and entry thread
│   │   ├── create-workspace-dialog.tsx # Dialog to create and get invite codes
│   │   ├── merge-solutions-dialog.tsx # Interface to select and merge solutions
│   │   ├── workspace-chat.tsx  # Real-time chat box with @ai assistant query logic
│   │   ├── navbar.tsx          # Dynamic responsive header
│   │   ├── quick-eval-form.tsx # Landing page guest form
│   │   ├── solution-form.tsx   # Workspace solution submission form
│   │   └── evaluation-view.tsx # Reusable evaluation results visualization
│   ├── db/
│   │   ├── index.ts            # Drizzle database client
│   │   ├── schema.ts           # DB schema defining tables and relationships
│   │   └── seed.ts             # Seeding file for mock data
│   ├── lib/
│   │   ├── deep-report-generator.ts
│   │   ├── devil-advocate-generator.ts
│   │   ├── evaluator.ts        # Parallel AI Evaluation & Fallback engine
│   │   ├── ratelimit.ts        # Upstash Redis rate limiting helper
│   │   ├── simulation.ts       # Stress testing engine
│   │   ├── solution-merger.ts  # Gemini AI solution merger helper
│   │   └── supabase/           # Supabase SSR server, client and middleware setup
│   └── middleware.ts           # Route guard and guest cookie manager
├── drizzle.config.ts           # Drizzle schema & output configuration
├── package.json
└── tsconfig.json
```

---

## Core Database Schema
* **`users`**: Private profile records synced automatically from Supabase Auth (`auth.users`).
* **`problems`**: Problem context records created by registered users or guest sessions.
* **`solutions`**: Proposed solution description records linked to parent problems. Features `isMerged` and `mergedFromIds` for synthesized options.
* **`evaluations`**: AI evaluation reports containing dimensional scores (Feasibility, Effectiveness, Scalability, Cost Efficiency, Innovation), overall consensus score (0–100), strengths/weaknesses list, and audit logs of executing models.
* **`problem_comments`**: Stores discussion/comments on public ideas.
* **`workspaces`**: Tracks custom team boards with unique invite codes.
* **`workspace_members`**: Workspace membership listing with roles (`owner`, `editor`, `viewer`).
* **`workspace_messages`**: Real-time team messages and `@ai` queries.

---

## Setup & Local Development Instructions

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory and copy the variables from `.env.example`:
```bash
cp .env.example .env.local
```
Fill in the credentials for Supabase, OpenRouter, Google Gemini, and Upstash Redis.

### 2. Generate and Run Database Migrations
Generate SQL migrations from the Drizzle schema and apply them to your Supabase PostgreSQL instance:
```bash
# Generate migrations
npm run db:generate

# Apply migrations to database
npm run db:migrate
```

### 3. Setup Supabase Triggers and Row Level Security
Log in to your Supabase Dashboard, navigate to the **SQL Editor**, paste the contents of [supabase/policies_and_triggers.sql](file:///c:/Abhijeet/Projects/Idea%20Checker/supabase/policies_and_triggers.sql), and run the script. This sets up the automatic user synchronization and enables Row Level Security (RLS) policies.

### 4. Apply Application-Specific Schema Updates
Run the custom migration script to create collaboration tables, setup RLS policies for real-time messages, and register publications for Supabase Realtime:
```bash
npx tsx --env-file=.env.local scripts/apply-migration.ts
```

### 5. Seed Database with Dummy Data (Optional)
Run the seed script to populate mock problems, solutions, and evaluation metrics:
```bash
npm run db:seed
```

### 6. Start Development Server
Start the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your browser.

---

## Testing the AI Evaluation Pipeline
To verify that your OpenRouter keys, timeouts, and Gemini fallbacks work correctly, run the local evaluation script:
```bash
npm run test:eval
```
This executes the parallel evaluator against a test problem/solution and outputs the consensus aggregations, scores, and active model lists directly to the console.

---

## Deployment to Vercel
1. Ensure all environment variables in `.env.local` are set up in your Vercel Project Settings.
2. In the Supabase project configuration, make sure the redirect URL for email auth matches your Vercel deployment URL (e.g., `https://your-project.vercel.app/api/auth/callback`).
3. Deploy the project using the Vercel Git integration or via CLI:
   ```bash
   vercel --prod
   ```
