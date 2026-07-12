# Idea Checker — Multi-Model AI Solution Evaluator & Consensus Score

Idea Checker helps developers, startup founders, and product managers validate whether a proposed solution actually solves a stated problem. 

This project leverages the **Mesh API** to execute parallel, multi-model consensus evaluations across different AI providers (Meta, Google, Anthropic) simultaneously, providing unbiased strategic feedback, automated pivots, interactive simulations, and real-time team collaboration workspaces.

---

## 🚀 Mesh API Hackathon Integration (Multi-Model Consensus)

Idea Checker is built to showcase the true power of a unified LLM gateway. Instead of relying on a single AI provider or writing complex routing logic for multiple SDKs, we use **Mesh API** to orchestrate a parallel evaluation engine:

1. **Multi-Provider Ensemble**: Every solution is evaluated simultaneously by:
   - **Meta Llama 3.3 70B Instruct** (`meta-llama/llama-3.3-70b-instruct`)
   - **Google Gemini 1.5 Flash** (`google/gemini-flash-1.5`)
   - **Anthropic Claude 3 Haiku** (`anthropic/claude-3-haiku`)
2. **Consensus Pentagon Radar Chart**: The application aggregates individual scores across 5 core dimensions (Feasibility, Effectiveness, Scalability, Cost Efficiency, Innovation) and renders a responsive SVG radar chart mapping the alignment.
3. **Multi-Model Transparency UI**: A dedicated audit panel breaks down:
   - Individual score contributions from each model side-by-side.
   - Live latency (seconds) and token usage metrics returned by Mesh.
   - **Model Disagreement Spotlight**: Automatically flags dimensions where the models diverged by 2+ points (e.g., Llama scoring 9/10 while Claude scores 6/10), exposing differing analytical perspectives.
4. **Fallback & Reliability**: If a model fails or times out, the system automatically falls back to alternative models in the Mesh API registry, ensuring high-availability consensus reports.

---

## Technical Stack
* **Framework**: Next.js 15 (App Router, Server Actions, Server & Client Components)
* **Language**: TypeScript
* **Styling**: Tailwind CSS v4, shadcn/ui components (via Sonner)
* **Auth & Realtime**: Supabase Auth & Supabase Realtime (for workspace messaging sync)
* **Database & ORM**: PostgreSQL, Drizzle ORM (using `postgres.js` adapter)
* **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
* **AI Orchestration**: 
  - **Mesh API** (`api.meshapi.ai/v1/chat/completions`) for multi-model evaluations, streaming solution drafting, Devil's Advocate audits, scenario simulations, and deep McKinsey reports.
  - **Google Gemini API** (Direct fallback option for workspace `@ai` interactions and solution merging).

---

## Core Features

1. **Consensus Score Evaluation**: Inputs a problem & solution to run parallel analysis across 5 key dimensions with pentagon radar visualization.
2. **AI Solution Merging**: Combines 2 to 4 solutions using Gemini/Mesh to synthesize a single, superior proposal.
3. **Collaboration Workspaces**: Dedicated team pages where members chat in real-time, propose solutions, and ask questions to the AI assistant using `@ai`.
4. **Devil's Advocate & Simulations**: Subject solutions to critique (ignored competitors, founder traps) and stress-tests under chosen scenarios.
5. **McKinsey-Style Deep Reports**: Produces a full business validation report covering market sizing, competitive landscape, and regulatory/execution risks.
6. **Community Feedback**: Enables upvoting, solution star ratings (1-5), and comments on public problems.

---

## Setup & Local Development Instructions

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory and copy the variables from `.env.example`:
```bash
cp .env.example .env.local
```
Fill in the credentials for Supabase, Mesh API, Google Gemini, and Upstash Redis:
* Set `MESH_API_KEY` with your Mesh API Key.
* Set `GEMINI_API_KEY` for workspace fallback and merges.

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
To verify that your Mesh API keys, models, timeouts, and fallbacks work correctly, run the local evaluation script:
```bash
npm run test:eval
```
This executes the parallel evaluator against a test problem/solution and outputs the consensus aggregations, scores, and active model lists directly to the console.

---

## Deployment to Vercel
1. Ensure all environment variables in `.env.local` (including `MESH_API_KEY`) are set up in your Vercel Project Settings.
2. In the Supabase project configuration, make sure the redirect URL for email auth matches your Vercel deployment URL (e.g., `https://your-project.vercel.app/api/auth/callback`).
3. Deploy the project using the Vercel Git integration or via CLI:
   ```bash
   vercel --prod
   ```
