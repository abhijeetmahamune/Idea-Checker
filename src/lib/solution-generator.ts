import { z } from 'zod';

// Domain-specific hints for the solution generator (exported for use in the API route)
export const DOMAIN_SYSTEM_HINTS: Record<string, string> = {
  saas: 'This is a SaaS / Software product. Focus on: technical architecture, user onboarding, integration ecosystem, and subscription model.',
  healthcare: 'This is a Healthcare / MedTech solution. Focus on: clinical workflow integration, compliance considerations, patient safety, and evidence-based approach.',
  ecommerce: 'This is an E-commerce / Marketplace solution. Focus on: supply chain, customer acquisition, unit economics, and fulfillment logistics.',
  edtech: 'This is an EdTech solution. Focus on: learning methodology, engagement mechanics, measurable outcomes, and instructor/student experience.',
  fintech: 'This is a FinTech solution. Focus on: regulatory compliance, fraud prevention, trust-building, and financial safety mechanisms.',
  hardware: 'This is a Physical Product / Hardware solution. Focus on: manufacturing approach, distribution channels, cost structure, and demand validation.',
  social: 'This is a Social / Community Platform. Focus on: network effects, content moderation, creator economy, and viral growth mechanics.',
};

// ─────────────────────────────────────────────────────────────────────────────
// PIVOT SUGGESTER
// ─────────────────────────────────────────────────────────────────────────────

export const pivotSchema = z.object({
  pivots: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      rationale: z.string(),
      estimatedScoreLift: z.string(),
    })
  ).length(3),
});

export type PivotSuggestion = {
  title: string;
  description: string;
  rationale: string;
  estimatedScoreLift: string;
};

/**
 * Generates 3 pivot directions when a solution scores below 60/100.
 * Called automatically after evaluation by the /api/evaluate route.
 * Uses Nvidia Nemetron via OpenRouter.
 */
export async function generatePivots(
  problem: string,
  solution: string,
  currentScore: number,
  domain?: string
): Promise<PivotSuggestion[]> {
  const apiKey = process.env.MESH_API_KEY;
  if (!apiKey) throw new Error('MESH_API_KEY is missing');

  const domainContext = domain && DOMAIN_SYSTEM_HINTS[domain]
    ? `\nDomain Context: ${DOMAIN_SYSTEM_HINTS[domain]}`
    : '';

  const prompt = `You are a startup pivot strategist. The following solution scored ${currentScore}/100 — too low to be viable as proposed. Your job is to suggest 3 concrete pivot directions that could dramatically improve the idea's viability.${domainContext}

Problem:
${problem}

Low-Scoring Solution:
${solution}

Generate exactly 3 pivot suggestions. Each pivot should be a genuinely different direction — not minor tweaks, but meaningful strategic pivots (e.g. change target customer, change business model, change delivery mechanism, change market focus).

Respond with a raw JSON object (no markdown, no explanations):
{
  "pivots": [
    {
      "title": "Short pivot name (e.g. 'B2B Enterprise Pivot')",
      "description": "2-3 sentence description of the pivoted approach",
      "rationale": "Why this direction could score higher — what specific weaknesses does it address?",
      "estimatedScoreLift": "e.g. '+15–25 points' — realistic estimate"
    }
  ]
}`;

  const response = await fetch('https://api.meshapi.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Mesh API HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data?.choices?.[0]?.message?.content;
  if (!responseText) throw new Error('Empty response from Nemetron');

  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(cleaned);
  const validated = pivotSchema.parse(parsed);
  return validated.pivots;
}
