import { NextRequest, NextResponse } from 'next/server';
import { DOMAIN_SYSTEM_HINTS } from '@/lib/solution-generator';

// Try these OpenRouter models in order until one works
const MODELS_TO_TRY = [
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problemTitle, problemDescription, domainHint } = body;

    if (!problemDescription && !problemTitle) {
      return NextResponse.json(
        { error: 'Problem context is required to generate a solution.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service is not configured.' },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(domainHint);

    const userPrompt = [
      problemTitle ? `Problem Title: ${problemTitle}` : '',
      problemDescription ? `Problem Description: ${problemDescription}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    // Try streaming via OpenRouter SSE
    for (const modelName of MODELS_TO_TRY) {
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
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        // Pipe OpenRouter SSE stream → extract text deltas → forward as plain text stream
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            const reader = response.body!.getReader();

            let buffer = '';

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith('data: ')) continue;
                  const payload = trimmed.slice(6);
                  if (payload === '[DONE]') continue;

                  try {
                    const json = JSON.parse(payload);
                    const delta = json?.choices?.[0]?.delta?.content;
                    if (delta) {
                      controller.enqueue(encoder.encode(delta));
                    }
                  } catch {
                    // Ignore malformed SSE chunks
                  }
                }
              }
              controller.close();
            } catch (streamErr) {
              controller.error(streamErr);
            }
          },
        });

        console.log(`✓ generate-solution using model: ${modelName}`);

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
          },
        });
      } catch (modelErr: any) {
        console.warn(`Model ${modelName} failed:`, modelErr?.message);
        // Try next model
        continue;
      }
    }

    // All streaming attempts failed — try plain non-streaming calls as last resort
    for (const modelName of MODELS_TO_TRY) {
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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data?.choices?.[0]?.message?.content;

        if (generatedText) {
          return new Response(generatedText, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        }
      } catch (err: any) {
        console.warn(`Non-streaming model ${modelName} failed:`, err?.message);
        continue;
      }
    }

    return NextResponse.json(
      { error: 'All AI models failed to generate a solution draft. Please try again.' },
      { status: 503 }
    );
  } catch (err: any) {
    console.error('Generate solution error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate solution draft.' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(domainHint?: string): string {
  const domainContext =
    domainHint && DOMAIN_SYSTEM_HINTS[domainHint]
      ? `\n\nDomain Context: ${DOMAIN_SYSTEM_HINTS[domainHint]}`
      : '';

  return `You are a startup solution architect and business strategist. Given a problem statement, generate a clear, well-structured, and realistic solution proposal that a founder could submit for AI evaluation.

Your solution should:
- Directly address the core problem
- Be specific and actionable (not vague or generic)
- Cover: what the solution is, how it works, who benefits, how it's delivered, and what makes it unique
- Be written in plain, confident prose (no bullet points, no headers)
- Be 150–250 words long — enough to be substantive but concise${domainContext}

Write ONLY the solution text. Do not include any preamble, labels, or explanations.`;
}
