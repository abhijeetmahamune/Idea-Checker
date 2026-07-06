import { z } from 'zod';

const devilReportSchema = z.object({
  verdict: z.string().min(1),
  failureReasons: z.array(
    z.object({
      reason: z.string(),
      severity: z.enum(['Fatal', 'Severe', 'Moderate']),
    })
  ).min(3).max(6),
  ignoredCompetitors: z.array(
    z.object({
      name: z.string(),
      why_threat: z.string(),
    })
  ).min(1).max(3),
  founderTraps: z.array(z.string()).min(2).max(4),
  conditionToReconsider: z.string().min(1),
});

export type DevilAdvocateReport = z.infer<typeof devilReportSchema>;

/**
 * Generates a brutal, skeptical "Devil's Advocate" critique of a startup idea.
 * Uses Nvidia Nemetron via OpenRouter.
 */
export async function generateDevilAdvocate(
  problem: string,
  solution: string,
  domain?: string
): Promise<DevilAdvocateReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is missing');

  const domainContext = domain
    ? `\nDomain: ${domain.toUpperCase()}`
    : '';

  const prompt = `You are a brutally honest, deeply skeptical venture capitalist who has seen thousands of startup pitches fail. Your job is NOT to encourage — it is to find every reason this idea will fail, grounded in business logic, market realities, and founder psychology.

Be harsh. Be specific. Be unflinching. Do not soften your critique.${domainContext}

Problem Statement:
${problem}

Proposed Solution:
${solution}

Deliver your Devil's Advocate critique. Respond with a raw JSON object (no markdown, no explanations):
{
  "verdict": "One brutal, memorable sentence summarizing your overall verdict. Make it sting.",
  "failureReasons": [
    {
      "reason": "Specific, data-grounded reason this will fail",
      "severity": "Fatal | Severe | Moderate"
    }
  ],
  "ignoredCompetitors": [
    {
      "name": "Name of an existing player doing something similar",
      "why_threat": "Why this existing player makes the proposed solution redundant or impossible"
    }
  ],
  "founderTraps": [
    "An unvalidated assumption or cognitive bias the founder is exhibiting"
  ],
  "conditionToReconsider": "The ONE specific thing — with evidence — that would make you reconsider your verdict. Be exact."
}

Rules:
- failureReasons: provide 4-5 reasons, at least one must be 'Fatal'
- ignoredCompetitors: provide 2-3 real or plausible competitors
- founderTraps: provide 2-3 psychological or business assumption traps
- Do not be vague. Every claim must be grounded in a real business dynamic.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://idea-checker.vercel.app',
      'X-Title': 'Idea Checker',
    },
    body: JSON.stringify({
      model: 'nvidia/nemotron-3-super-120b-a12b:free',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Nemetron HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data?.choices?.[0]?.message?.content;
  if (!responseText) throw new Error('Empty response from Nemetron');

  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(cleaned);
  return devilReportSchema.parse(parsed);
}
