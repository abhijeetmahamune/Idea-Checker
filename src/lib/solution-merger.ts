import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

const OPENROUTER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemini-2.5-flash:free',
];

async function runOpenRouterMerge(prompt: string, modelName: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

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
      messages: [
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty response from OpenRouter model');
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

  // Fallback to OpenRouter
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    for (const modelName of OPENROUTER_MODELS) {
      try {
        const text = await runOpenRouterMerge(prompt, modelName);
        if (text.length > 50) return text;
      } catch (err: any) {
        console.warn(`OpenRouter merge model ${modelName} failed:`, err?.message);
      }
    }
  } else {
    console.warn('OPENROUTER_API_KEY is not configured. Skipping OpenRouter fallback.');
  }

  throw new Error('All AI models failed to merge solutions. Please try again.');
}

