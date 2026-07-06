import { z } from 'zod';

// Schema validation for individual model responses
export const evaluationResponseSchema = z.object({
  feasibility: z.number().min(0).max(10),
  effectiveness: z.number().min(0).max(10),
  scalability: z.number().min(0).max(10),
  costEfficiency: z.number().min(0).max(10),
  innovation: z.number().min(0).max(10),
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

const getSystemPrompt = (domain?: string) => {
  const domainHint = domain && DOMAIN_HINTS[domain]
    ? `\n\nDomain-Specific Evaluation Context:\n${DOMAIN_HINTS[domain]}`
    : '';

  return `You are an expert startup evaluator and business consultant. Your task is to evaluate the provided Solution against the stated Problem.
You must evaluate the solution across five key dimensions (Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation) on a 0-10 scale (where 0 is worst, 10 is best).
Provide 2-4 specific strengths, 2-4 specific weaknesses, and a concise consensus summary of the idea.${domainHint}

You must respond with a raw JSON object. Do not include any markdown wrappers, explanations, or text before/after the JSON.
Your JSON must strictly adhere to the following schema:
{
  "feasibility": number (0-10),
  "effectiveness": number (0-10),
  "scalability": number (0-10),
  "costEfficiency": number (0-10),
  "innovation": number (0-10),
  "strengths": string[],
  "weaknesses": string[],
  "summary": string
}`;
};

function parseAndCleanJson(text: string): EvaluationResponse {
  let cleaned = text.trim();
  // Strip markdown code block wrappers if they exist
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }
  
  const parsed = JSON.parse(cleaned);

  // Clamp values to [0, 10] range, ensuring we handle non-numeric or out of bounds inputs
  const clamp = (val: any) => Math.max(0, Math.min(10, Math.round(Number(val)) || 0));

  parsed.feasibility = clamp(parsed.feasibility);
  parsed.effectiveness = clamp(parsed.effectiveness);
  parsed.scalability = clamp(parsed.scalability);
  parsed.costEfficiency = clamp(parsed.costEfficiency);
  parsed.innovation = clamp(parsed.innovation);

  return evaluationResponseSchema.parse(parsed);
}

// Directly query Nvidia Nemetron via OpenRouter as a backup/fallback
async function runNemetronFallback(problem: string, solution: string, domain?: string): Promise<EvaluationResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing from environment variables');
  }

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
        { role: 'system', content: getSystemPrompt(domain) },
        { role: 'user', content: `Problem:\n${problem}\n\nSolution:\n${solution}` },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Nemetron fallback HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty message content returned from Nemetron fallback');
  }

  return parseAndCleanJson(content);
}

// Query an OpenRouter model with a timeout and retry logic
async function runOpenRouterModel(
  modelId: string,
  problem: string,
  solution: string,
  domain?: string
): Promise<EvaluationResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing from environment variables');
  }

  const maxRetries = 2;
  let delay = 1500;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://idea-checker.vercel.app', // Site URL
          'X-Title': 'Idea Checker',
        },
        body: JSON.stringify({
          model: modelId,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: getSystemPrompt(domain) },
            { role: 'user', content: `Problem:\n${problem}\n\nSolution:\n${solution}` },
          ],
        }),
        signal: controller.signal,
      });

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
        throw new Error(`OpenRouter HTTP error: ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty message content returned from OpenRouter');
      }

      return parseAndCleanJson(content);
    } catch (err: any) {
      if (attempt < maxRetries) {
        console.warn(`Model ${modelId} failed (attempt ${attempt + 1}/${maxRetries + 1}). Error: ${err.message || err}. Retrying in ${delay}ms...`);
        clearTimeout(timeoutId);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw new Error(`Model ${modelId} failed after ${maxRetries} retries`);
}

// Main evaluation orchestrator running 3 models in parallel, with Nemetron fallback
export async function evaluateSolution(
  problem: string,
  solution: string,
  domain?: string
): Promise<EvaluationResult> {
  const models = [
    { name: 'Llama 3.3 70B (OpenRouter)', id: 'meta-llama/llama-3.3-70b-instruct:free' },
    { name: 'GPT OSS 120B (OpenRouter)', id: 'openai/gpt-oss-120b:free' },
    { name: 'Nemotron 3 120B (OpenRouter)', id: 'nvidia/nemotron-3-super-120b-a12b:free' },
  ];

  const successfulModels: string[] = [];
  const failedModels: string[] = [];
  const parsedEvaluations: EvaluationResponse[] = [];

  // Run all three OpenRouter evaluations concurrently
  const openRouterPromises = models.map((m) =>
    runOpenRouterModel(m.id, problem, solution, domain)
      .then((res) => ({ model: m.name, response: res, success: true as const }))
      .catch((err) => ({ model: m.name, error: err, success: false as const }))
  );

  const results = await Promise.all(openRouterPromises);

  // Process results and run fallback for failed models
  for (const res of results) {
    if (res.success) {
      parsedEvaluations.push(res.response);
      successfulModels.push(res.model);
    } else {
      console.warn(`Model ${res.model} failed. Error:`, res.error?.message || res.error);
      // Attempt Nemetron API fallback for this specific failed slot
      try {
        console.log(`Running Nemetron fallback for failed slot: ${res.model}`);
        const nemetronResponse = await runNemetronFallback(problem, solution, domain);
        parsedEvaluations.push(nemetronResponse);
        successfulModels.push(`${res.model} -> Nemetron Fallback`);
      } catch (fallbackError: any) {
        console.error(`Nemetron fallback also failed for ${res.model}:`, fallbackError?.message || fallbackError);
        failedModels.push(res.model);
      }
    }
  }

  // If every single model (and their fallbacks) failed to return a response
  if (parsedEvaluations.length === 0) {
    throw new Error(
      'All AI evaluation models failed to respond. Please check your credentials or try again later.'
    );
  }

  // Aggregate scores by taking the average across all successful models
  const count = parsedEvaluations.length;
  
  const sum = parsedEvaluations.reduce(
    (acc, curr) => ({
      feasibility: acc.feasibility + curr.feasibility,
      effectiveness: acc.effectiveness + curr.effectiveness,
      scalability: acc.scalability + curr.scalability,
      costEfficiency: acc.costEfficiency + curr.costEfficiency,
      innovation: acc.innovation + curr.innovation,
    }),
    { feasibility: 0, effectiveness: 0, scalability: 0, costEfficiency: 0, innovation: 0 }
  );

  const feasibilityAvg = Math.round(sum.feasibility / count);
  const effectivenessAvg = Math.round(sum.effectiveness / count);
  const scalabilityAvg = Math.round(sum.scalability / count);
  const costEfficiencyAvg = Math.round(sum.costEfficiency / count);
  const innovationAvg = Math.round(sum.innovation / count);

  // Overall score is mean of the 5 average dimensions, scaled to 0-100
  const overallScore = Math.round(
    ((feasibilityAvg + effectivenessAvg + scalabilityAvg + costEfficiencyAvg + innovationAvg) / 5) * 10
  );

  // Aggregate strengths and weaknesses
  const strengthsSet = new Set<string>();
  const weaknessesSet = new Set<string>();
  const summaries: string[] = [];

  parsedEvaluations.forEach((evalItem) => {
    evalItem.strengths.forEach((s) => strengthsSet.add(s.trim()));
    evalItem.weaknesses.forEach((w) => weaknessesSet.add(w.trim()));
    summaries.push(evalItem.summary.trim());
  });

  // Take up to 4 strengths and 4 weaknesses for a clean UI presentation
  const strengths = Array.from(strengthsSet).slice(0, 4);
  const weaknesses = Array.from(weaknessesSet).slice(0, 4);

  // Combine summaries using a simple bulleted overview or selecting the first model's summary + context
  const summary = summaries[0] || 'Evaluation completed successfully.';

  return {
    feasibility: feasibilityAvg,
    effectiveness: effectivenessAvg,
    scalability: scalabilityAvg,
    costEfficiency: costEfficiencyAvg,
    innovation: innovationAvg,
    overallScore,
    feedback: {
      strengths,
      weaknesses,
      summary,
    },
    successfulModels,
    failedModels,
  };
}
