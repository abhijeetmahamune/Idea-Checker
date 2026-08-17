import { z } from 'zod';

// ── Schema Definition ───────────────────────────────────────────────────

const chargeSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(['Fatal', 'Severe', 'Moderate']),
  reasoning: z.string().min(1),
  evidence: z.string().min(1),
  businessImpact: z.string().min(1),
  founderAssumption: z.string().min(1),
  suggestedValidation: z.string().min(1),
  counterEvidence: z.string().min(1),
});

const competitorSchema = z.object({
  name: z.string().min(1),
  threat: z.string().min(1),
  why_threat: z.string().min(1),
  whyCustomerChooses: z.string().min(1),
  missingDifferentiation: z.string().min(1),
});

const failureReasonSchema = z.object({
  reason: z.string().min(1),
  severity: z.enum(['Fatal', 'Severe', 'Moderate']),
});

const evolutionSummarySchema = z.object({
  resolved: z.array(z.string()).default([]),
  improved: z.array(z.string()).default([]),
  unresolved: z.array(z.string()).default([]),
  worsened: z.array(z.string()).default([]),
  newRisks: z.array(z.string()).default([]),
  summaryNote: z.string().optional(),
});

const devilReportSchema = z.object({
  verdict: z.string().min(1),
  overallRiskLevel: z.enum(['Critical', 'High Risk', 'Moderate Risk', 'Low Risk']),
  charges: z.array(chargeSchema).min(3).max(5),
  founderTraps: z.array(z.string()).min(2).max(5),
  ignoredCompetitors: z.array(competitorSchema).min(1).max(4),
  conditionToReconsider: z.string().min(1),
  failureReasons: z.array(failureReasonSchema).min(1),
  evolutionSummary: evolutionSummarySchema.optional(),
});

export type DevilAdvocateReport = z.infer<typeof devilReportSchema>;
export type EvolutionSummary = z.infer<typeof evolutionSummarySchema>;

/**
 * Generates a formal, structured legal prosecution case ("Devil's Advocate") against a startup idea.
 * Supports optional previous report context for semantic evolution comparison across versions.
 * Uses Mesh API with meta-llama/llama-3.3-70b-instruct.
 */
export async function generateDevilAdvocate(
  problem: string,
  solution: string,
  domain?: string,
  previousReport?: DevilAdvocateReport | null,
  previousSolutionSnapshot?: string | null
): Promise<DevilAdvocateReport> {
  const apiKey = process.env.MESH_API_KEY;
  if (!apiKey) throw new Error('MESH_API_KEY is missing');

  const domainContext = domain
    ? `\nDomain Category: ${domain.toUpperCase()}`
    : '';

  let previousReportContext = '';
  if (previousReport) {
    const prevChargesStr = previousReport.charges && previousReport.charges.length > 0
      ? previousReport.charges.map((c, i) => `- Charge ${i + 1} (${c.severity}): "${c.title}" - ${c.reasoning}`).join('\n')
      : (previousReport.failureReasons || []).map((f, i) => `- Reason ${i + 1} (${f.severity}): ${f.reason}`).join('\n');

    previousReportContext = `

PREVIOUS PROSECUTION CASE FILE (CONTEXT FOR COMPARISON):
The founder previously ran a Devil's Advocate challenge on an earlier iteration of their solution.
- Previous Verdict: "${previousReport.verdict}"
- Previous Overall Risk Level: ${previousReport.overallRiskLevel}
- Previous Charges:
${prevChargesStr}
${previousSolutionSnapshot ? `- Previous Solution Text: "${previousSolutionSnapshot.substring(0, 400)}..."` : ''}

CRITICAL COMPARISON DIRECTIVE:
Independently evaluate the CURRENT solution. Do NOT automatically repeat previous charges if the founder has updated their solution to address them.
Perform a semantic, business-meaning comparison (not word-for-word string match) between the previous charges and your current evaluation to populate "evolutionSummary":
- "resolved": Issues from the previous report that are now substantially addressed in the current solution.
- "improved": Issues that became weaker or less severe but are not completely solved.
- "unresolved": Previous criticisms that remain substantially unchanged or unaddressed.
- "worsened": Previously identified issues that became more serious in the new version.
- "newRisks": Important concerns or vulnerabilities that were not present in the previous report.`;
  }

  const prompt = `You are a ruthless, world-class venture capital prosecutor and Devil's Advocate. Your sole objective is to present a formal, airtight legal-style case AGAINST funding or launching this startup idea.

You do NOT soften your critique. Every accusation must feel like evidence presented in court: data-grounded, logically undeniable, specific, and focused on business realities (distribution, unit economics, market dynamics, defensibility, and founder cognitive biases).${domainContext}${previousReportContext}

PROBLEM STATEMENT:
${problem}

PROPOSED SOLUTION:
${solution}

Deliver your formal Devil's Advocate prosecution case. Respond ONLY with a raw JSON object (no markdown formatting, no extra prose outside the JSON):
{
  "verdict": "One memorable, short, powerful, specific sentence summarizing why this idea fails. Make it sting.",
  "overallRiskLevel": "Critical | High Risk | Moderate Risk | Low Risk",
  "charges": [
    {
      "title": "Formal Charge Title (e.g. 'Distribution Fantasy', 'Weak Problem Validation', 'No Defensible Advantage', 'Unit Economic Collapse', 'Customer Behaviour Illusion')",
      "severity": "Fatal | Severe | Moderate",
      "reasoning": "Data-grounded explanation of why this flaw is fatal or severe.",
      "evidence": "Specific business realities, industry benchmarks, or market mechanics that prove this charge.",
      "businessImpact": "The precise financial, operational, or strategic failure this charge leads to.",
      "founderAssumption": "The specific unvalidated assumption or cognitive bias the founder is exhibiting.",
      "suggestedValidation": "A concrete, cheap, quantifiable test the founder should run to test this assumption.",
      "counterEvidence": "The exact proof or metric that would make the Advocate withdraw this specific charge."
    }
  ],
  "founderTraps": [
    "Identify a specific startup cognitive bias or trap (e.g., 'False Consensus Bias', 'Technology-First Thinking', 'Optimism Bias', 'Feature Obsession', 'Confirmation Bias') with a brief explanation of how the founder exhibits it."
  ],
  "ignoredCompetitors": [
    {
      "name": "Name of an existing player or status quo alternative",
      "threat": "Why this existing player makes the proposed solution redundant or vulnerable",
      "whyCustomerChooses": "Why customers currently choose or stick with this competitor",
      "missingDifferentiation": "Why the proposed solution's differentiation fails against them"
    }
  ],
  "conditionToReconsider": "The single most critical, measurable set of evidence (e.g. X paying customers at Y CAC within Z days) that would make you reverse your overall verdict."${previousReport ? `,
  "evolutionSummary": {
    "resolved": ["Concise description of previously criticized issue now fixed"],
    "improved": ["Concise description of issue that got better"],
    "unresolved": ["Concise description of issue still present"],
    "worsened": ["Concise description of issue that worsened"],
    "newRisks": ["Concise description of brand new risk"]
  }` : ''}
}

Rules:
- Generate 3 to 5 formal charges. At least one must be 'Fatal'.
- Charges must read like legal accusations backed by business logic.
- Avoid vague statements like 'competition is hard'. Be specific about CAC, LTV, switching costs, distribution channels, and sales motions.
- Do not repeat similar points across charges.`;

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
  if (!responseText) throw new Error('Empty response from Mesh API');

  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(cleaned);

  // Populate backward compatibility helpers if missing
  if (!parsed.failureReasons || !Array.isArray(parsed.failureReasons) || parsed.failureReasons.length === 0) {
    if (Array.isArray(parsed.charges)) {
      parsed.failureReasons = parsed.charges.map((c: any) => ({
        reason: `${c.title}: ${c.reasoning || c.evidence || ''}`,
        severity: c.severity || 'Severe',
      }));
    } else {
      parsed.failureReasons = [];
    }
  }

  if (Array.isArray(parsed.ignoredCompetitors)) {
    parsed.ignoredCompetitors = parsed.ignoredCompetitors.map((c: any) => ({
      ...c,
      why_threat: c.why_threat || c.threat || c.whyCustomerChooses || '',
    }));
  }

  const validated = devilReportSchema.parse(parsed);
  return validated;
}

