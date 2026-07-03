# Idea Checker — MVP Production Web Application

Idea Checker helps developers, startup founders, and PMs validate whether a proposed solution actually solves a stated problem, utilizing three parallel AI models from OpenRouter to produce an objective consensus rating, with a direct Google Gemini API fallback.

---

## Technical Stack
* **Framework**: Next.js 15 (App Router, Server Actions)
* **Language**: TypeScript
* **Styling**: Tailwind CSS v4, shadcn/ui components (via Sonner)
* **Auth + Database**: Supabase Auth & PostgreSQL
* **ORM**: Drizzle ORM (using `postgres.js` adapter)
* **Rate Limiting**: Upstash Redis (`@upstash/ratelimit`)
* **AI Evaluation Engine**: OpenRouter Free Models & Direct Google Gemini API Fallback

---

## Project Structure
```
idea-checker/
├── drizzle/                    # Generated database migrations
├── supabase/
│   └── policies_and_triggers.sql # SQL script for Supabase database setup
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login and Registration routes
│   │   ├── (dashboard)/        # Main user workspace pages (layout-wrapped)
│   │   │   ├── dashboard/      # Workspace displaying problem contexts
│   │   │   └── problems/       # Problem detail & solution listings
│   │   ├── api/
│   │   │   ├── auth/callback/  # Auth exchange code handler
│   │   │   └── evaluate/       # Main POST endpoint triggering evaluations
│   │   ├── guest-evaluation/   # Public view of guest-submitted evaluations
│   │   ├── globals.css         # Styling system
│   │   ├── layout.tsx          # Root theme provider and sonner toaster
│   │   └── page.tsx            # Landing page with Quick Evaluation form
│   ├── components/             # UI Components
│   │   ├── ui/                 # Core shadcn components
│   │   ├── navbar.tsx          # Dynamic responsive header
│   │   ├── quick-eval-form.tsx # Landing page guest form with progress loaders
│   │   ├── solution-form.tsx   # Workspace solution submission form
│   │   └── evaluation-view.tsx # Reusable evaluation results visualization
│   ├── db/
│   │   ├── index.ts            # Drizzle database client
│   │   ├── schema.ts           # DB schema defining tables and relationships
│   │   └── seed.ts             # Seeding file for mock data
│   ├── lib/
│   │   ├── evaluator.ts        # Parallel AI Evaluation & Fallback engine
│   │   ├── ratelimit.ts        # Upstash Redis rate limiting helper
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
* **`solutions`**: Proposed solution description records linked to parent problems.
* **`evaluations`**: AI evaluation reports containing dimensions scores (Feasibility, Effectiveness, Scalability, Cost Efficiency, Innovation), overall consensus score (0–100), strengths/weaknesses list, and audit logs of executing models.

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

### 4. Seed Database with Dummy Data (Optional)
Run the seed script to populate mock problems, solutions, and evaluation metrics:
```bash
npm run db:seed
```

### 5. Start Development Server
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
"# Idea-Checker" 
