import { z } from 'zod';
import { db } from '@/db';
import { aiRequests } from '@/db/schema';

// Schema validation for individual model responses with confidence & reasoning
export const evaluationResponseSchema = z.object({
  feasibility: z.number().min(0).max(10),
  effectiveness: z.number().min(0).max(10),
  scalability: z.number().min(0).max(10),
  costEfficiency: z.number().min(0).max(10),
  innovation: z.number().min(0).max(10),
  confidence: z.number().min(0).max(1).default(0.7),
  reasoning: z.string().optional(),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  summary: z.string().min(1),
});

export type EvaluationResponse = z.infer<typeof evaluationResponseSchema>;

export interface EvaluationResult {
  feasibility: number;
  effectiveness: number;
  scalability: number;
  costEfficiency: number;
  innovation: number;
  overallScore: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };
  successfulModels: string[];
  failedModels: string[];
  rawResponses: Array<{
    model: string;
    role?: string;
    response: EvaluationResponse;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
  }>;
  consensusResult: {
    modelsCount: number;
    feasibilityAvg: number;
    effectivenessAvg: number;
    scalabilityAvg: number;
    costEfficiencyAvg: number;
    innovationAvg: number;
  };

  // Evaluation Engine Consensus Upgrade Attributes
  contestedDimensions: string[];
  dimensionSpread: Record<string, number>;
  bottleneck: { dimension: string; score: number };
  consensusSummary: string;
  trustLevel: 'high' | 'medium' | 'low';
  trustLabel: string;
  rankedStrengths: Array<{ text: string; mentionedBy: number }>;
  rankedWeaknesses: Array<{ text: string; mentionedBy: number }>;
  domain?: string | null;

  // Founder Clarifications attributes
  clarificationQuestions?: Array<{ question: string; dimension: string; reason: string }>;
  founderClarifications?: Array<{ question: string; answer: string; dimension?: string }>;
  evaluationType?: 'initial' | 'standard_reevaluation' | 'clarification_reevaluation';

  generationTimeMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: string;
}

// Per-domain extra evaluation instructions injected into the system prompt
const DOMAIN_HINTS: Record<string, string> = {
  saas:
    'Pay special attention to: API ecosystem integrations, churn risk and retention mechanics, feature parity with incumbents, subscription unit economics, and developer adoption curve.',
  healthcare:
    'Pay special attention to: regulatory approval pathways (FDA/CE marking), HIPAA/patient data privacy compliance, clinical workflow integration friction, evidence-based efficacy requirements, reimbursement model viability, and patient safety risks.',
  ecommerce:
    'Pay special attention to: unit economics (CAC vs LTV ratio), logistics and fulfillment complexity, supplier or buyer chicken-and-egg bootstrapping, platform fee structure impact on margins, and return rate risk.',
  edtech:
    'Pay special attention to: proven learning outcome methodology, student engagement and course completion rates, accreditation or certification credibility, teacher and institution adoption hurdles, and learner retention mechanics.',
  fintech:
    'Pay special attention to: financial regulation compliance (RBI, FCA, SEC depending on market), fraud and AML risk, licensing requirements, customer financial safety and trust, and unit economics of float or transaction fees.',
  hardware:
    'Pay special attention to: manufacturing and tooling cost, minimum order quantity (MOQ) risk, supply chain fragility, required safety certifications (FCC/CE/UL), warranty and return economics, and demand validation before capital commitment.',
  social:
    'Pay special attention to: network effects and the cold-start problem, content moderation strategy and costs, creator monetization model viability, virality and organic growth loops, and the threat of incumbents (Meta, Reddit, Discord) replicating the core feature.',
};

// Role-differentiated instructions for consensus ensemble
const ROLE_INSTRUCTIONS: Record<string, { roleName: string; stance: string }> = {
  skeptic: {
    roleName: 'Skeptic Analyst',
    stance: `ROLE & PERSPECTIVE: Skeptic Analyst.
Your mandate is to actively hunt for failure modes, execution bottlenecks, hidden risks, operational friction, and unaddressed edge cases. Weight risk and complexity over upside. Be rigorous, critical, and objective.`,
  },
  market_realist: {
    roleName: 'Market Realist Analyst',
    stance: `ROLE & PERSPECTIVE: Market Realist Analyst.
Your mandate is to evaluate real-world market execution, cost-efficiency, CAC vs LTV unit economics, supplier/buyer logistics, regulatory hurdles, and operational constraints under realistic market conditions. Maintain a neutral, pragmatic tone.`,
  },
  opportunity_analyst: {
    roleName: 'Opportunity Analyst',
    stance: `ROLE & PERSPECTIVE: Opportunity Analyst.
Your mandate is to evaluate upside potential, competitive differentiation, defensibility/moats, scalability dynamics, and market expansion opportunity. Focus on strategic advantages and growth potential.`,
  },
};

const getRoleSystemPrompt = (
  roleKey: 'skeptic' | 'market_realist' | 'opportunity_analyst',
  domain?: string,
  founderClarifications?: Array<{ question: string; answer: string; dimension?: string }>
) => {
  const roleConfig = ROLE_INSTRUCTIONS[roleKey] || ROLE_INSTRUCTIONS.market_realist;
  const domainHint = domain && DOMAIN_HINTS[domain]
    ? `\n\nDomain-Specific Evaluation Context:\n${DOMAIN_HINTS[domain]}`
    : '';

  const validClarifications = (founderClarifications || []).filter(
    (c) => c.answer && typeof c.answer === 'string' && c.answer.trim().length > 0
  );

  const clarificationsContext = validClarifications.length > 0
    ? `\n\nFOUNDER CLARIFICATIONS (Self-reported claims supplied by the founder):
${validClarifications.map((c, i) => `Q${i + 1}: ${c.question}\nA${i + 1}: ${c.answer}`).join('\n\n')}

INSTRUCTIONS FOR FOUNDER CLARIFICATIONS:
When Founder Clarifications are provided, incorporate them as additional context when evaluating the solution.
Founder Clarifications are self-reported claims supplied by the founder. They are NOT independently verified evidence.
A clarification should affect a dimension score only when it materially resolves an uncertainty, weakness, or missing piece of information relevant to that dimension.
Do NOT automatically increase scores because clarifications were provided.
If a clarification provides a credible mechanism or information that resolves a previous concern, the relevant score may increase.
If the clarification does not adequately resolve the concern, keep the score approximately unchanged.
If a clarification reveals a new weakness, contradiction, unrealistic assumption, operational risk, or negative information, lower the relevant score when justified.
Evaluate the complete proposal using:
1. Original Problem
2. Original Solution
3. Founder Clarifications
Do not treat founder claims as independently validated customer or market evidence.`
    : '';

  return `You are an expert startup evaluator acting as the ${roleConfig.roleName}.
${roleConfig.stance}

You must evaluate the provided Solution against the stated Problem across five key dimensions (Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation) on a 0-10 scale (0 = worst, 10 = best).
Self-report your confidence level in your evaluation (0.0 to 1.0) based on how clear and well-specified the idea is.
Provide 1-2 sentence rationale ("reasoning") for your score set, 2-4 specific strengths, 2-4 specific weaknesses, and a concise summary of the idea from your specific analytical stance.${domainHint}${clarificationsContext}

You must respond with a raw JSON object. Do not include markdown code block wrappers or extra text.
JSON Schema:
{
  "feasibility": number (0-10),
  "effectiveness": number (0-10),
  "scalability": number (0-10),
  "costEfficiency": number (0-10),
  "innovation": number (0-10),
  "confidence": number (0.0 - 1.0),
  "reasoning": string,
  "strengths": string[],
  "weaknesses": string[],
  "summary": string
}`;
};

function parseAndCleanJson(text: string): EvaluationResponse {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(cleaned);

  const clampScore = (val: any) => Math.max(0, Math.min(10, Math.round(Number(val)) || 0));
  const clampConfidence = (val: any) => {
    const num = Number(val);
    if (isNaN(num) || num <= 0) return 0.7;
    return Math.max(0.1, Math.min(1.0, num));
  };

  parsed.feasibility = clampScore(parsed.feasibility);
  parsed.effectiveness = clampScore(parsed.effectiveness);
  parsed.scalability = clampScore(parsed.scalability);
  parsed.costEfficiency = clampScore(parsed.costEfficiency);
  parsed.innovation = clampScore(parsed.innovation);
  parsed.confidence = clampConfidence(parsed.confidence);

  if (typeof parsed.reasoning !== 'string' || !parsed.reasoning.trim()) {
    parsed.reasoning = parsed.summary || 'Evaluated based on role perspective.';
  }

  return evaluationResponseSchema.parse(parsed);
}

// Estimate Mesh API cost based on model pricing rates (per 1M tokens)
function estimateMeshCost(model: string, promptTokens: number, completionTokens: number): number {
  let inputRate = 0.0;
  let outputRate = 0.0;

  if (model.includes('llama-3.3-70b')) {
    inputRate = 0.70;
    outputRate = 0.90;
  } else if (model.includes('gemini-2.5-flash') || model.includes('gemini-flash')) {
    inputRate = 0.075;
    outputRate = 0.30;
  } else if (model.includes('claude-haiku') || model.includes('claude-3-haiku')) {
    inputRate = 0.25;
    outputRate = 1.25;
  } else if (model.includes('nemotron')) {
    inputRate = 0.50;
    outputRate = 0.50;
  }

  return (promptTokens * inputRate + completionTokens * outputRate) / 1_000_000;
}

export interface ModelCallResult {
  evaluation: EvaluationResponse;
  modelId: string;
  role: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latencyMs: number;
}

// Query a Mesh API model with a timeout, role system prompt, and retries
async function runRoleModel(
  modelId: string,
  roleKey: 'skeptic' | 'market_realist' | 'opportunity_analyst',
  roleName: string,
  problem: string,
  solution: string,
  domain?: string,
  founderClarifications?: Array<{ question: string; answer: string; dimension?: string }>
): Promise<ModelCallResult> {
  const apiKey = process.env.MESH_API_KEY;
  if (!apiKey) {
    throw new Error('MESH_API_KEY is missing from environment variables');
  }

  const maxRetries = 2;
  let delay = 1500;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch('https://api.meshapi.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: getRoleSystemPrompt(roleKey, domain, founderClarifications) },
            { role: 'user', content: `Problem:\n${problem}\n\nSolution:\n${solution}` },
          ],
        }),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startTime;

      if (response.status === 429) {
        if (attempt < maxRetries) {
          console.warn(`Model ${modelId} rate limited (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries + 1})`);
          clearTimeout(timeoutId);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
      }

      if (!response.ok) {
        throw new Error(`Mesh API HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty message content returned from Mesh API');
      }

      const usage = data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const promptTokens = usage.prompt_tokens || 0;
      const completionTokens = usage.completion_tokens || 0;
      const totalTokens = usage.total_tokens || 0;
      const cost = estimateMeshCost(modelId, promptTokens, completionTokens);

      try {
        await db.insert(aiRequests).values({
          endpoint: 'https://api.meshapi.ai/v1/chat/completions',
          model: `${modelId} (${roleName})`,
          promptVersion: 'evaluator-v2-consensus',
          latency: latencyMs,
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCost: cost.toFixed(6),
          success: true,
        });
      } catch (logErr) {
        console.error('Failed to log AI request:', logErr);
      }

      return {
        evaluation: parseAndCleanJson(content),
        modelId,
        role: roleName,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      if (attempt < maxRetries) {
        console.warn(`Model ${modelId} failed (attempt ${attempt + 1}/${maxRetries + 1}). Error: ${err.message || err}. Retrying in ${delay}ms...`);
        clearTimeout(timeoutId);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      try {
        await db.insert(aiRequests).values({
          endpoint: 'https://api.meshapi.ai/v1/chat/completions',
          model: `${modelId} (${roleName})`,
          promptVersion: 'evaluator-v2-consensus',
          latency: latencyMs,
          success: false,
          errorMessage: err.message || String(err),
        });
      } catch (logErr) {
        console.error('Failed to log AI request:', logErr);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error(`Model ${modelId} failed after ${maxRetries} retries`);
}

// Query a fallback model via Mesh API
async function runNemetronFallback(
  roleName: string,
  problem: string,
  solution: string,
  domain?: string,
  founderClarifications?: Array<{ question: string; answer: string; dimension?: string }>
): Promise<ModelCallResult> {
  const apiKey = process.env.MESH_API_KEY;
  if (!apiKey) {
    throw new Error('MESH_API_KEY is missing from environment variables');
  }

  const modelId = 'meta-llama/llama-3.3-70b-instruct';
  const startTime = Date.now();

  try {
    const response = await fetch('https://api.meshapi.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: getRoleSystemPrompt('market_realist', domain, founderClarifications) },
          { role: 'user', content: `Problem:\n${problem}\n\nSolution:\n${solution}` },
        ],
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`Mesh API fallback HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty message content returned from Mesh API fallback');
    }

    const usage = data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;
    const cost = estimateMeshCost(modelId, promptTokens, completionTokens);

    try {
      await db.insert(aiRequests).values({
        endpoint: 'https://api.meshapi.ai/v1/chat/completions',
        model: `${modelId} (Fallback for ${roleName})`,
        promptVersion: 'evaluator-v2-fallback',
        latency: latencyMs,
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCost: cost.toFixed(6),
        success: true,
      });
    } catch (logErr) {
      console.error('Failed to log AI request:', logErr);
    }

    return {
      evaluation: parseAndCleanJson(content),
      modelId: `${modelId} (Fallback)`,
      role: `${roleName} (Fallback)`,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    try {
      await db.insert(aiRequests).values({
        endpoint: 'https://api.meshapi.ai/v1/chat/completions',
        model: `${modelId} (Fallback for ${roleName})`,
        promptVersion: 'evaluator-v2-fallback',
        latency: latencyMs,
        success: false,
        errorMessage: err.message || String(err),
      });
    } catch (logErr) {
      console.error('Failed to log AI request:', logErr);
    }
    throw err;
  }
}

// ── Disagreement Detection (Standard Deviation) ──────────────────────────────
function computeDisagreement(evals: EvaluationResponse[]) {
  const dims = ['feasibility', 'effectiveness', 'scalability', 'costEfficiency', 'innovation'] as const;
  const contested: string[] = [];
  const spread: Record<string, number> = {};

  if (evals.length === 0) return { spread: {}, contested: [] };

  for (const dim of dims) {
    const vals = evals.map((e) => e[dim]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const stddev = Math.sqrt(variance);
    spread[dim] = Number(stddev.toFixed(2));
    if (stddev >= 2.0) {
      contested.push(dim);
    }
  }
  return { spread, contested };
}

// ── Confidence-Weighted Score Aggregation ───────────────────────────────────
function weightedAvg(
  evals: EvaluationResponse[],
  dim: 'feasibility' | 'effectiveness' | 'scalability' | 'costEfficiency' | 'innovation'
): number {
  if (evals.length === 0) return 0;
  const totalWeight = evals.reduce((a, e) => a + (e.confidence || 0.7), 0) || evals.length;
  const weighted = evals.reduce((a, e) => a + e[dim] * (e.confidence || 0.7), 0);
  return Math.round(weighted / totalWeight);
}

// ── Strengths & Weaknesses Signal Ranking ────────────────────────────────────
function rankBySignal(itemLists: string[][]): { text: string; mentionedBy: number }[] {
  const counts = new Map<string, { originalText: string; count: number }>();

  itemLists.forEach((list) => {
    const uniqueInList = new Set<string>();
    list.forEach((item) => {
      const trimmed = item.trim();
      if (trimmed) uniqueInList.add(trimmed);
    });

    uniqueInList.forEach((item) => {
      const key = item.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 5).join(' ');
      if (counts.has(key)) {
        const existing = counts.get(key)!;
        existing.count += 1;
      } else {
        counts.set(key, { originalText: item, count: 1 });
      }
    });
  });

  return Array.from(counts.values())
    .map((entry) => ({ text: entry.originalText, mentionedBy: entry.count }))
    .sort((a, b) => b.mentionedBy - a.mentionedBy)
    .slice(0, 5);
}

// ── Honest Trust Label Calculation ───────────────────────────────────────────
function computeTrustLabel(successfulModels: string[], failedModels: string[]) {
  const usedFallback = successfulModels.some((m) => m.toLowerCase().includes('fallback'));
  const successCount = successfulModels.length;

  if (failedModels.length === 0 && !usedFallback && successCount >= 3) {
    return { trustLevel: 'high' as const, trustLabel: 'High trust · 3/3 independent models' };
  }
  if (failedModels.length === 0 && usedFallback && successCount >= 3) {
    return { trustLevel: 'medium' as const, trustLabel: 'Moderate trust · fallback model used for 1 slot' };
  }
  if (successCount === 2) {
    return { trustLevel: 'medium' as const, trustLabel: 'Moderate trust · 2/3 models responded' };
  }
  return { trustLevel: 'low' as const, trustLabel: `Partial consensus · ${successCount}/3 models responded` };
}

// ── Fallback Clarification Question Generator ────────────────────────────────
function generateFallbackQuestions(
  problem: string,
  solution: string,
  bottleneck: { dimension: string; score: number },
  weaknesses: string[]
): Array<{ question: string; dimension: string; reason: string }> {
  const questions: Array<{ question: string; dimension: string; reason: string }> = [];

  if (bottleneck.dimension === 'costEfficiency') {
    questions.push({
      question: 'What is your estimated per-unit operational or API cost required to serve one active user or transaction?',
      dimension: 'costEfficiency',
      reason: 'Cost Efficiency was identified as the primary bottleneck due to unverified marginal costs.',
    });
  } else if (bottleneck.dimension === 'feasibility') {
    questions.push({
      question: 'What technical prototype, working demo, or operational milestone has been completed so far?',
      dimension: 'feasibility',
      reason: 'Feasibility was identified as the lowest-scoring dimension requiring technical proof.',
    });
  } else if (bottleneck.dimension === 'scalability') {
    questions.push({
      question: 'How will your operational model and architecture handle a 10x surge in active concurrent users without proportional headcount growth?',
      dimension: 'scalability',
      reason: 'Scalability limits were highlighted by analysts as a primary constraint.',
    });
  } else if (bottleneck.dimension === 'effectiveness') {
    questions.push({
      question: 'What specific metrics or pilot results demonstrate that target users prefer this over existing alternatives?',
      dimension: 'effectiveness',
      reason: 'Effectiveness scores depend on evidence of problem-solution fit.',
    });
  } else {
    questions.push({
      question: 'What unique technological mechanism or proprietary workflow prevents incumbents from replicating this solution within 6 months?',
      dimension: 'innovation',
      reason: 'Innovation and defensibility require clearer differentiation context.',
    });
  }

  if (weaknesses.length > 0) {
    questions.push({
      question: `How specifically do you plan to mitigate the operational risk: "${weaknesses[0]}"?`,
      dimension: bottleneck.dimension,
      reason: 'Analysts flagged this concern across evaluations.',
    });
  }

  if (weaknesses.length > 1) {
    questions.push({
      question: `What fallback plan exists if: "${weaknesses[1]}"?`,
      dimension: 'feasibility',
      reason: 'Analysts highlighted this operational uncertainty.',
    });
  }

  questions.push({
    question: 'Have you tested this solution with actual target users? If yes, what were the primary key learnings or feedback points?',
    dimension: 'effectiveness',
    reason: 'Direct user feedback context helps validate real-world impact.',
  });

  return questions.slice(0, 4);
}

// ── 4th Mesh Synthesis Pass Call (Summary + 3-5 Clarification Questions) ──────
async function synthesizeConsensus(
  evaluations: EvaluationResponse[],
  contested: string[],
  problem: string,
  solution: string,
  bottleneck: { dimension: string; score: number },
  weaknesses: string[]
): Promise<{ consensusSummary: string; clarificationQuestions: Array<{ question: string; dimension: string; reason: string }> }> {
  const apiKey = process.env.MESH_API_KEY;
  const fallbackQuestions = generateFallbackQuestions(problem, solution, bottleneck, weaknesses);
  const fallbackSummary = evaluations[0]?.summary || 'Evaluation completed successfully.';

  if (!apiKey || evaluations.length === 0) {
    return { consensusSummary: fallbackSummary, clarificationQuestions: fallbackQuestions };
  }

  const modelId = 'anthropic/claude-3-haiku';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s non-fatal timeout

  try {
    const prompt = `Three independent analysts evaluated this solution with different lenses (Skeptic, Market Realist, Opportunity Analyst).

Analyst Summaries:
${evaluations.map((e, i) => `Analyst ${i + 1}: ${e.summary}`).join('\n')}

Analyst Weaknesses:
${evaluations.map((e, i) => `Analyst ${i + 1} Weaknesses: ${e.weaknesses.join('; ')}`).join('\n')}

Lowest-Scoring Bottleneck Dimension: ${bottleneck.dimension} (${bottleneck.score}/10)
Contested dimensions (analysts disagreed by 2+ points): ${contested.length > 0 ? contested.join(', ') : 'None'}

Problem Context:
${problem}

Proposed Solution:
${solution}

CRITICAL GUIDELINES FOR CLARIFICATION QUESTIONS:
- Each clarification question must directly correspond to its assigned evaluation dimension.
- Before assigning a dimension, verify that the information requested would materially help determine that dimension's score.
- Feasibility questions should address technical or operational viability.
- Effectiveness questions should address whether the solution actually solves the stated problem and produces the intended outcome.
- Scalability questions should address growth bottlenecks, infrastructure, operational scaling, or dependence on human labor.
- Cost Efficiency questions should address development cost, operating cost, marginal cost, unit economics, resource efficiency, or economic sustainability.
- Innovation questions should address differentiation, novelty of the mechanism, defensibility, or meaningful improvement over existing alternatives.
- Do not classify general customer acquisition, marketing, or adoption questions as Cost Efficiency unless the question specifically concerns acquisition economics such as CAC, payback period, or acquisition cost relative to customer value.

Respond strictly with a raw JSON object adhering to this schema:
{
  "summary": "A 2-3 sentence consensus summary that reflects key points of agreement AND explicitly notes where the analysts disagreed and why that matters for the founder.",
  "clarificationQuestions": [
    {
      "question": "Specific question targeting missing context, cost details, user feedback, or execution mechanics (3-5 questions max). Do NOT ask generic questions like 'Can you provide more information?'.",
      "dimension": "feasibility | effectiveness | scalability | costEfficiency | innovation",
      "reason": "1-sentence explanation of why analysts need this clarification."
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
        model: modelId,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Synthesis call HTTP error:', response.status);
      return { consensusSummary: fallbackSummary, clarificationQuestions: fallbackQuestions };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (content) {
      let cleaned = content;
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      }
      const parsed = JSON.parse(cleaned);
      const summaryText = typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : fallbackSummary;

      let questions: Array<{ question: string; dimension: string; reason: string }> = [];
      if (Array.isArray(parsed.clarificationQuestions) && parsed.clarificationQuestions.length > 0) {
        questions = parsed.clarificationQuestions
          .filter((q: any) => q && typeof q.question === 'string' && q.question.trim())
          .map((q: any) => ({
            question: q.question.trim(),
            dimension: ['feasibility', 'effectiveness', 'scalability', 'costEfficiency', 'innovation'].includes(q.dimension)
              ? q.dimension
              : bottleneck.dimension,
            reason: typeof q.reason === 'string' && q.reason.trim() ? q.reason.trim() : `Focusing on ${q.dimension || bottleneck.dimension}`,
          }))
          .slice(0, 5);
      }

      if (questions.length < 3) {
        questions = fallbackQuestions;
      }

      return { consensusSummary: summaryText, clarificationQuestions: questions };
    }
  } catch (err: any) {
    console.warn('Synthesis call failed or timed out (non-fatal fallback):', err?.message || err);
  } finally {
    clearTimeout(timeoutId);
  }

  return { consensusSummary: fallbackSummary, clarificationQuestions: fallbackQuestions };
}

// ── Main Consensus Orchestrator ──────────────────────────────────────────────
export async function evaluateSolution(
  problem: string,
  solution: string,
  domain?: string,
  founderClarifications?: Array<{ question: string; answer: string; dimension?: string }>
): Promise<EvaluationResult> {
  const models = [
    {
      name: 'Llama 3.3 70B (Skeptic)',
      id: 'meta-llama/llama-3.3-70b-instruct',
      roleKey: 'skeptic' as const,
      roleName: 'Skeptic Analyst',
    },
    {
      name: 'Gemini 2.5 Flash Lite (Market Realist)',
      id: 'google/gemini-2.5-flash-lite-preview-09-2025',
      roleKey: 'market_realist' as const,
      roleName: 'Market Realist Analyst',
    },
    {
      name: 'Claude 3 Haiku (Opportunity Analyst)',
      id: 'anthropic/claude-3-haiku',
      roleKey: 'opportunity_analyst' as const,
      roleName: 'Opportunity Analyst',
    },
  ];

  const validClarifications = (founderClarifications || []).filter(
    (c) => c.answer && typeof c.answer === 'string' && c.answer.trim().length > 0
  );
  const evaluationType = validClarifications.length > 0 ? 'clarification_reevaluation' : 'initial';

  const successfulModels: string[] = [];
  const failedModels: string[] = [];
  const parsedEvaluations: EvaluationResponse[] = [];

  const startTime = Date.now();

  const openRouterPromises = models.map((m) =>
    runRoleModel(m.id, m.roleKey, m.roleName, problem, solution, domain, validClarifications)
      .then((res) => ({ model: m.name, role: m.roleName, response: res, success: true as const }))
      .catch((err) => ({ model: m.name, role: m.roleName, error: err, success: false as const }))
  );

  const results = await Promise.all(openRouterPromises);

  const rawResponses: any[] = [];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTotalTokens = 0;
  let totalCost = 0;

  for (const res of results) {
    if (res.success) {
      parsedEvaluations.push(res.response.evaluation);
      successfulModels.push(res.response.modelId);
      rawResponses.push({
        model: res.response.modelId,
        role: res.role,
        response: res.response.evaluation,
        promptTokens: res.response.promptTokens,
        completionTokens: res.response.completionTokens,
        latencyMs: res.response.latencyMs,
      });
      totalPromptTokens += res.response.promptTokens;
      totalCompletionTokens += res.response.completionTokens;
      totalTotalTokens += res.response.totalTokens;
      totalCost += res.response.cost;
    } else {
      console.warn(`Model ${res.model} failed. Error:`, res.error?.message || res.error);
      try {
        console.log(`Running Nemetron fallback for failed slot: ${res.model}`);
        const fallbackResponse = await runNemetronFallback(res.role, problem, solution, domain, validClarifications);
        parsedEvaluations.push(fallbackResponse.evaluation);
        successfulModels.push(`${res.model} -> Fallback`);
        rawResponses.push({
          model: `${res.model} -> Fallback`,
          role: `${res.role} (Fallback)`,
          response: fallbackResponse.evaluation,
          promptTokens: fallbackResponse.promptTokens,
          completionTokens: fallbackResponse.completionTokens,
          latencyMs: fallbackResponse.latencyMs,
        });
        totalPromptTokens += fallbackResponse.promptTokens;
        totalCompletionTokens += fallbackResponse.completionTokens;
        totalTotalTokens += fallbackResponse.totalTokens;
        totalCost += fallbackResponse.cost;
      } catch (fallbackError: any) {
        console.error(`Fallback failed for ${res.model}:`, fallbackError?.message || fallbackError);
        failedModels.push(res.model);
      }
    }
  }

  if (parsedEvaluations.length === 0) {
    throw new Error(
      'All AI evaluation models failed to respond. Please check your credentials or try again later.'
    );
  }

  // 1. Confidence-Weighted Aggregation
  const feasibilityAvg = weightedAvg(parsedEvaluations, 'feasibility');
  const effectivenessAvg = weightedAvg(parsedEvaluations, 'effectiveness');
  const scalabilityAvg = weightedAvg(parsedEvaluations, 'scalability');
  const costEfficiencyAvg = weightedAvg(parsedEvaluations, 'costEfficiency');
  const innovationAvg = weightedAvg(parsedEvaluations, 'innovation');

  // Overall score is mean of 5 weighted average dimensions, scaled to 0-100
  const overallScore = Math.round(
    ((feasibilityAvg + effectivenessAvg + scalabilityAvg + costEfficiencyAvg + innovationAvg) / 5) * 10
  );

  // 2. Disagreement Detection
  const { spread: dimensionSpread, contested: contestedDimensions } = computeDisagreement(parsedEvaluations);

  // 3. Bottleneck Detection (lowest dimension)
  const dims: Array<'feasibility' | 'effectiveness' | 'scalability' | 'costEfficiency' | 'innovation'> = [
    'feasibility',
    'effectiveness',
    'scalability',
    'costEfficiency',
    'innovation',
  ];
  const scoresMap = {
    feasibility: feasibilityAvg,
    effectiveness: effectivenessAvg,
    scalability: scalabilityAvg,
    costEfficiency: costEfficiencyAvg,
    innovation: innovationAvg,
  };
  const bottleneckDim = dims.reduce((min, d) => (scoresMap[d] < scoresMap[min] ? d : min), dims[0]);
  const bottleneck = { dimension: bottleneckDim, score: scoresMap[bottleneckDim] };

  // 4. Honest Trust Badge
  const { trustLevel, trustLabel } = computeTrustLabel(successfulModels, failedModels);

  // 5. Signal-Ranked Strengths & Weaknesses
  const allStrengths = parsedEvaluations.map((e) => e.strengths);
  const allWeaknesses = parsedEvaluations.map((e) => e.weaknesses);
  const rankedStrengths = rankBySignal(allStrengths);
  const rankedWeaknesses = rankBySignal(allWeaknesses);

  // 6. Non-fatal 4th Synthesis Call (Consensus Summary + 3-5 Clarification Questions)
  const topWeaknessesList = rankedWeaknesses.map((w) => w.text);
  const { consensusSummary, clarificationQuestions } = await synthesizeConsensus(
    parsedEvaluations,
    contestedDimensions,
    problem,
    solution,
    bottleneck,
    topWeaknessesList
  );

  // Legacy feedback compatibility
  const feedback = {
    strengths: rankedStrengths.map((s) => s.text),
    weaknesses: rankedWeaknesses.map((w) => w.text),
    summary: consensusSummary,
  };

  return {
    feasibility: feasibilityAvg,
    effectiveness: effectivenessAvg,
    scalability: scalabilityAvg,
    costEfficiency: costEfficiencyAvg,
    innovation: innovationAvg,
    overallScore,
    feedback,
    successfulModels,
    failedModels,

    // Consensus Engine attributes
    contestedDimensions,
    dimensionSpread,
    bottleneck,
    consensusSummary,
    trustLevel,
    trustLabel,
    rankedStrengths,
    rankedWeaknesses,
    domain: domain ?? null,

    // Founder Clarifications attributes
    clarificationQuestions,
    founderClarifications: validClarifications.length > 0 ? validClarifications : undefined,
    evaluationType,

    rawResponses,
    consensusResult: {
      modelsCount: parsedEvaluations.length,
      feasibilityAvg,
      effectivenessAvg,
      scalabilityAvg,
      costEfficiencyAvg,
      innovationAvg,
    },
    generationTimeMs: Date.now() - startTime,
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
    totalTokens: totalTotalTokens,
    estimatedCost: totalCost.toFixed(6),
  };
}
