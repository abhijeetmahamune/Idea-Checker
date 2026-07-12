import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

const MESH_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemini-flash-1.5',
  'anthropic/claude-3-haiku',
];

async function runMeshMerge(prompt: string, modelName: string): Promise<string> {
  const apiKey = process.env.MESH_API_KEY;
  if (!apiKey) throw new Error('MESH_API_KEY is not configured');

  const response = await fetch('https://api.meshapi.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Mesh API HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from Mesh API model');
  return text;
}

/**
 * Uses Gemini (or falls back to OpenRouter models) to intelligently synthesise a merged solution from multiple source solutions.
 * Takes the best elements from each and creates a coherent, improved combined proposal.
 */
export async function mergeSolutions(
  problemDescription: string,
  solutions: { id: string; content: string }[]
): Promise<string> {
  const solutionsList = solutions
    .map((s, i) => `Solution ${i + 1}:\n${s.content}`)
    .join('\n\n---\n\n');

  const prompt = `You are a startup strategist and product architect. You have been given ${solutions.length} different solution proposals for the same problem. Your job is to synthesise a single, superior solution by combining the best elements, insights, and approaches from each proposal.

PROBLEM:
${problemDescription}

SOLUTION PROPOSALS:
${solutionsList}

INSTRUCTIONS:
- Identify the strongest ideas, unique insights, and complementary elements across all proposals
- Combine them into one coherent, well-structured solution
- The merged solution should be more comprehensive than any individual proposal
- Resolve any contradictions by choosing the better approach
- Write in a clear, professional tone as if this is a final proposal
- Do NOT just concatenate them — genuinely synthesise and improve
- Length: 200-400 words

Write only the merged solution text, no preamble or explanation:`;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        if (text.length > 50) return text;
      } catch (err: any) {
        console.warn(`Merge model ${modelName} failed:`, err?.message);
      }
    }
  } else {
    console.warn('GEMINI_API_KEY is not configured. Skipping Gemini models.');
  }

  // Fallback to Mesh API
  const meshApiKey = process.env.MESH_API_KEY;
  if (meshApiKey) {
    for (const modelName of MESH_MODELS) {
      try {
        const text = await runMeshMerge(prompt, modelName);
        if (text.length > 50) return text;
      } catch (err: any) {
        console.warn(`Mesh API merge model ${modelName} failed:`, err?.message);
      }
    }
  } else {
    console.warn('MESH_API_KEY is not configured. Skipping Mesh API fallback.');
  }

  throw new Error('All AI models failed to merge solutions. Please try again.');
}

