import { z } from 'zod';

// Validation schema for stress testing simulation response
export const simulationResponseSchema = z.object({
  resilienceScore: z.number().min(0).max(100),
  analysis: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  weaknesses: z.array(z.string().min(1)),
  recommendations: z.array(z.string().min(1)),
});

export type SimulationResponse = z.infer<typeof simulationResponseSchema>;

const getSimulationSystemPrompt = () => `You are an expert risk analyst and business continuity strategist. 
Your task is to run a "Stress Simulation" / "Pressure Test" on a proposed Solution against a stated Problem, under a specific hypothetical Risk Scenario.

Evaluate how resilient the solution is to this risk.
You must provide:
1. A Resilience Score (0-100), where 0 is complete system/business collapse and 100 is total immunity/adaptability.
2. A written analysis explaining exactly how the scenario impacts the feasibility, effectiveness, and scalability of the solution.
3. 2-3 specific strengths or mitigating factors the solution naturally possesses under this scenario.
4. 2-3 specific vulnerabilities or weaknesses the solution exposes under this scenario.
5. 2-3 actionable, strategic recommendations to adapt and reinforce the solution against this scenario.

You must respond with a raw JSON object. Do not include markdown code block wrappers or explanations before/after the JSON.
Your JSON must strictly adhere to the following schema:
{
  "resilienceScore": number (0-100),
  "analysis": string,
  "strengths": string[],
  "weaknesses": string[],
  "recommendations": string[]
}`;

export async function runStressSimulation(
  problem: string,
  solution: string,
  scenario: string
): Promise<SimulationResponse> {
  const apiKey = process.env.MESH_API_KEY;
  if (!apiKey) {
    throw new Error('MESH_API_KEY is missing from environment variables');
  }

  const prompt = `
  Problem Context:
  ${problem}

  Proposed Solution:
  ${solution}

  Hypothetical Risk Scenario to Test:
  "${scenario}"

  Please analyze the solution under this scenario.
  `;

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
        { role: 'system', content: getSimulationSystemPrompt() },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Mesh API HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const responseText = data?.choices?.[0]?.message?.content;
  if (!responseText) {
    throw new Error('Empty message content returned from Mesh API');
  }

  // Clean markdown wrappers if any leaked
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  }

  const parsed = JSON.parse(cleaned);

  // Validate schema and clamp resilience score
  parsed.resilienceScore = Math.max(0, Math.min(100, Math.round(Number(parsed.resilienceScore)) || 0));

  return simulationResponseSchema.parse(parsed);
}
