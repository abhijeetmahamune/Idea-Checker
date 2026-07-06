import { z } from 'zod';

// Type-safe schema for the 10-section deep report
export const deepReportSchema = z.object({
  executiveSummary: z.string(),
  problemValidation: z.object({
    score: z.number().min(0).max(10),
    analysis: z.string(),
  }),
  marketSizing: z.object({
    tam: z.string(),
    sam: z.string(),
    som: z.string(),
    analysis: z.string(),
  }),
  competitiveLandscape: z.object({
    players: z.array(z.object({ name: z.string(), threat: z.string() })),
    differentiation: z.string(),
  }),
  businessModelViability: z.object({
    revenueModel: z.string(),
    unitEconomics: z.string(),
    pricing: z.string(),
  }),
  technicalFeasibility: z.object({
    complexity: z.enum(['Low', 'Medium', 'High']),
    risks: z.array(z.string()),
    analysis: z.string(),
  }),
  goToMarket: z.object({
    channel: z.string(),
    firstHundredCustomers: z.string(),
  }),
  regulatoryRisks: z.object({
    risks: z.array(z.string()),
    severity: z.enum(['Low', 'Medium', 'High']),
  }),
  teamExecutionRisk: z.object({
    founderProfile: z.string(),
    keyHires: z.array(z.string()),
  }),
  overallVerdict: z.object({
    rating: z.enum(['Promising', 'Needs Work', 'Abandon']),
    summary: z.string(),
    topStrengths: z.array(z.string()).min(1).max(4),
    topRisks: z.array(z.string()).min(1).max(4),
  }),
});

export type DeepReport = z.infer<typeof deepReportSchema>;

// Try these Nemetron/OpenRouter models in order until one works
const MODELS = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

export async function generateDeepReport(
  problem: string,
  solution: string,
  domain?: string
): Promise<DeepReport> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const prompt = buildPrompt(problem, solution, domain);

  for (const modelName of MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://idea-checker.vercel.app',
          'X-Title': 'Idea Checker',
        },
        body: JSON.stringify({
          model: modelName,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'user', content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error('Empty content from model');

      // Strip markdown code fences if present
      const cleaned = text.startsWith('```')
        ? text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
        : text;

      const parsed = JSON.parse(cleaned);
      return deepReportSchema.parse(parsed);
    } catch (err: any) {
      console.warn(`Deep report model ${modelName} failed:`, err?.message);
      continue;
    }
  }

  throw new Error('All AI models failed to generate the deep report. Please try again.');
}

function buildPrompt(problem: string, solution: string, domain?: string): string {
  const domainContext = domain ? `\nDomain: ${domain.toUpperCase()}` : '';

  return `You are a world-class startup analyst combining the rigor of a McKinsey consultant, a seasoned venture capitalist, and a product strategist. Your job is to write a deep, structured pressure-test report for the following startup idea.${domainContext}

Problem Statement:
${problem}

Proposed Solution:
${solution}

Write a comprehensive analysis across all 10 sections. Be specific, data-grounded where possible, and brutally honest. Avoid generic advice — every point must be directly tied to this specific idea.

Respond with a single raw JSON object matching EXACTLY this schema (no markdown, no extra keys):

{
  "executiveSummary": "2-3 sentence verdict on this idea's overall viability and most important consideration",
  
  "problemValidation": {
    "score": <number 0-10 — how well-validated is the problem?>,
    "analysis": "Is this problem real, painful, and large enough? Evidence of demand? Urgency?"
  },
  
  "marketSizing": {
    "tam": "Total Addressable Market estimate with reasoning (e.g. '$4.2B — global X market')",
    "sam": "Serviceable Addressable Market with reasoning",
    "som": "Serviceable Obtainable Market in year 1-3 with reasoning",
    "analysis": "Commentary on market growth, timing, and whether it's a real opportunity"
  },
  
  "competitiveLandscape": {
    "players": [
      { "name": "Competitor name", "threat": "Why they are a real threat to this idea" }
    ],
    "differentiation": "What would make this idea genuinely defensible against these players?"
  },
  
  "businessModelViability": {
    "revenueModel": "Most viable revenue model for this idea (e.g. SaaS subscription, marketplace fee, etc.)",
    "unitEconomics": "CAC vs LTV estimate or commentary. Will this be profitable?",
    "pricing": "Recommended pricing strategy and price point range"
  },
  
  "technicalFeasibility": {
    "complexity": "Low" | "Medium" | "High",
    "risks": ["Specific technical challenge 1", "Specific technical challenge 2"],
    "analysis": "Can this realistically be built? What is the core technical risk?"
  },
  
  "goToMarket": {
    "channel": "Most effective acquisition channel for this specific idea",
    "firstHundredCustomers": "Concrete strategy to acquire the first 100 paying customers"
  },
  
  "regulatoryRisks": {
    "risks": ["Specific regulatory or legal risk 1", "Specific regulatory or legal risk 2"],
    "severity": "Low" | "Medium" | "High"
  },
  
  "teamExecutionRisk": {
    "founderProfile": "What background/skills does the founding team NEED to win this?",
    "keyHires": ["Critical first hire 1", "Critical first hire 2"]
  },
  
  "overallVerdict": {
    "rating": "Promising" | "Needs Work" | "Abandon",
    "summary": "Final 2-sentence summary of your overall recommendation",
    "topStrengths": ["Strength 1", "Strength 2", "Strength 3"],
    "topRisks": ["Risk 1", "Risk 2", "Risk 3"]
  }
}`;
}
