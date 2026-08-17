import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { solutions, problems, devilAdvocateReports } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const chatRequestSchema = z.object({
  solutionId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { solutionId, reportId, message, history = [] } = chatRequestSchema.parse(body);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Fetch solution & parent problem
    const solutionResult = await db
      .select({ solution: solutions, problem: problems })
      .from(solutions)
      .innerJoin(problems, eq(solutions.problemId, problems.id))
      .where(eq(solutions.id, solutionId))
      .limit(1);

    if (solutionResult.length === 0) {
      return NextResponse.json({ error: 'Solution not found.' }, { status: 404 });
    }

    const { solution, problem } = solutionResult[0];

    // Fetch specified or latest Devil's Advocate report for grounding
    const devilReports = reportId
      ? await db
          .select()
          .from(devilAdvocateReports)
          .where(and(eq(devilAdvocateReports.id, reportId), eq(devilAdvocateReports.solutionId, solutionId)))
          .limit(1)
      : await db
          .select()
          .from(devilAdvocateReports)
          .where(eq(devilAdvocateReports.solutionId, solutionId))
          .orderBy(desc(devilAdvocateReports.createdAt))
          .limit(1);

    if (devilReports.length === 0) {
      return NextResponse.json({ error: 'No Devil\'s Advocate report found for this solution.' }, { status: 404 });
    }

    const report = devilReports[0].report;
    const apiKey = process.env.MESH_API_KEY;
    if (!apiKey) throw new Error('MESH_API_KEY is missing');

    const systemPrompt = `You are the Lead VC Prosecutor and Devil's Advocate on an elite investment committee. You previously conducted a thorough prosecution of this founder's startup proposal and rendered a formal Devil's Advocate report.

YOUR PERSONALITY & VOICE:
- Highly intelligent, calm, direct, articulate, and professional.
- Never sarcastic, never insulting, never theatrical, never robotic.
- Speak like an experienced VC partner defending a well-reasoned investment prosecution case.
- Win debates purely through business logic, unit economics, market dynamics, CAC/LTV calculations, distribution mechanics, and verifiable evidence.

YOUR CASE FILE MEMORY & CONSISTENCY:
- You remember every charge, risk level, competitor threat, and founder trap in your generated report.
- You MUST NEVER contradict your previously generated report or your previous statements in the chat history unless the founder presents verifiable evidence that explicitly resolves a charge.
- You never change your stance simply because the founder expresses disagreement, enthusiasm, or frustration.

CONVERSATION & DEBATE RULES:
1. WHEN THE FOUNDER DISAGREES OR CHALLENGES A CHARGE:
   - Do NOT quote or copy-paste the report text.
   - Explain the underlying business mechanics, financial risk, or market realities behind the charge.
   - Point out the specific unvalidated assumption the founder is relying on.
   - If the founder provides logical, data-backed counter-arguments or traction metrics: acknowledge it professionally and state EXPLICITLY which specific charge is weakened or modified.

2. WHEN THE FOUNDER ASKS HOW TO FIX, IMPROVE, OR VALIDATE ("How can I fix this?", "What evidence do you need?", "How should I validate this?"):
   - Temporarily pause attacking and become a constructive, objective advisor.
   - Provide concrete, quantifiable experiments, metric targets (e.g. CAC thresholds, cohort retention rates, sales payback periods), and operational steps grounded in the report's "suggestedValidation" and "counterEvidence" fields.
   - Outline exactly what evidence would cause you to formally withdraw that accusation.

3. CONFIDENCE CALIBRATION & FOLLOW-UP QUESTIONS:
   - For high-confidence industry realities (e.g. CAC inflation, competitor distribution moats, regulatory compliance), speak with firm, uncompromising clarity.
   - When key founder details (pricing model, acquisition channel, sales motion, payback period) are missing or unclear, state your initial concern clearly and ask ONE concise, focused follow-up question to probe the missing data.

4. STRICT NEGATIVE CONSTRAINTS:
   - NEVER hallucinate fake competitors or invent false statistics.
   - NEVER contradict the report without clear justification.
   - NEVER become artificially encouraging simply to be agreeable.

PROBLEM STATEMENT:
${problem.description}

PROPOSED SOLUTION:
${solution.content}

GENERATED DEVIL'S ADVOCATE CASE FILE:
${JSON.stringify(report, null, 2)}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.meshapi.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct',
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mesh API HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Empty response from Mesh API');

    return NextResponse.json({ success: true, reply });
  } catch (err: any) {
    console.error('Devil Advocate Chat API error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues.map((e) => e.message).join(' ') },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err?.message || 'The Advocate has no further comments at the moment.' },
      { status: 500 }
    );
  }
}
