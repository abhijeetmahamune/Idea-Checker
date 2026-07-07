import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaceMessages, workspaceMembers, workspaces, problems, solutions, evaluations } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, asc, gt, sql } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

async function getMemberRole(workspaceId: string, userId: string) {
  const member = await db.select({ role: workspaceMembers.role })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);
  return member[0]?.role ?? null;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: workspaceId } = await params;
    const role = await getMemberRole(workspaceId, user.id);
    if (!role) return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after');

    const query = db.select().from(workspaceMessages)
      .where(
        after
          ? and(eq(workspaceMessages.workspaceId, workspaceId), gt(workspaceMessages.createdAt, new Date(after)))
          : eq(workspaceMessages.workspaceId, workspaceId)
      )
      .orderBy(asc(workspaceMessages.createdAt))
      .limit(100);

    const messages = await query;
    return NextResponse.json({ messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: workspaceId } = await params;

    // Verify membership
    const role = await getMemberRole(workspaceId, user.id);
    if (!role) return NextResponse.json({ error: 'Not a workspace member' }, { status: 403 });

    const body = await request.json();
    const { content, type = 'text', senderName } = z.object({
      content: z.string().min(1).max(2000),
      type: z.enum(['text', 'ai', 'system']).default('text'),
      senderName: z.string().default('Unknown'),
    }).parse(body);

    // Insert the user's message
    const [message] = await db.insert(workspaceMessages).values({
      workspaceId,
      userId: user.id,
      senderName,
      content,
      type,
    }).returning();

    // If message starts with @ai, generate AI response
    if (content.trim().toLowerCase().startsWith('@ai') || type === 'ai') {
      const question = content.replace(/^@ai\s*/i, '').trim();
      if (question.length > 0) {
        // Fetch workspace context: problem + solutions
        const workspace = await db.select({ problemId: workspaces.problemId })
          .from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);

        if (workspace[0]) {
          // Get problem
          const problem = await db.select({ description: problems.description, title: problems.title })
            .from(problems).where(eq(problems.id, workspace[0].problemId)).limit(1);

          // Get top solutions
          const topSolutions = await db.select({ content: solutions.content, score: evaluations.overallScore })
            .from(solutions)
            .leftJoin(evaluations, eq(evaluations.solutionId, solutions.id))
            .where(and(eq(solutions.problemId, workspace[0].problemId), sql`${solutions.deletedAt} IS NULL`))
            .orderBy(sql`${evaluations.overallScore} desc nulls last`)
            .limit(3);

          try {
            const solutionContext = topSolutions.length > 0
              ? topSolutions.map((s, i) => `Solution ${i + 1} (Score: ${s.score ?? 'N/A'}):\n${s.content}`).join('\n\n')
              : 'No solutions proposed yet.';

            const prompt = `You are an AI assistant in a team collaboration workspace for startup idea validation.

CONTEXT:
Problem: ${problem[0]?.title ?? ''}
${problem[0]?.description ?? ''}

Current Solutions Being Discussed:
${solutionContext}

TEAM QUESTION: ${question}

Provide a concise, helpful response (2-4 sentences max). Be specific to this problem and solutions.`;

            let aiResponse: string | null = null;
            const geminiApiKey = process.env.GEMINI_API_KEY;
            const openRouterApiKey = process.env.OPENROUTER_API_KEY;

            // 1. Try Gemini
            if (geminiApiKey) {
              try {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                const result = await model.generateContent(prompt);
                aiResponse = result.response.text().trim();
              } catch (err: any) {
                console.warn('Workspace AI Gemini model failed:', err?.message);
              }
            }

            // 2. Try OpenRouter Fallback
            if (!aiResponse && openRouterApiKey) {
              const openRouterModels = [
                'meta-llama/llama-3.3-70b-instruct:free',
                'nvidia/nemotron-3-super-120b-a12b:free',
                'google/gemini-2.5-flash:free',
              ];

              for (const modelName of openRouterModels) {
                try {
                  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${openRouterApiKey}`,
                      'HTTP-Referer': 'https://idea-checker.vercel.app',
                      'X-Title': 'Idea Checker',
                    },
                    body: JSON.stringify({
                      model: modelName,
                      messages: [{ role: 'user', content: prompt }],
                    }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const text = data?.choices?.[0]?.message?.content?.trim();
                    if (text) {
                      aiResponse = text;
                      break;
                    }
                  } else {
                    console.warn(`OpenRouter model ${modelName} returned status ${response.status}`);
                  }
                } catch (err: any) {
                  console.warn(`OpenRouter model ${modelName} call failed:`, err?.message);
                }
              }
            }

            if (!aiResponse) {
              throw new Error('All AI models failed to respond');
            }

            // Insert AI response as a message
            await db.insert(workspaceMessages).values({
              workspaceId,
              userId: null,
              senderName: '🤖 AI Assistant',
              content: aiResponse,
              type: 'ai',
            });
          } catch (aiErr: any) {
            console.warn('Workspace AI error:', aiErr?.message);
            // Insert fallback message
            await db.insert(workspaceMessages).values({
              workspaceId,
              userId: null,
              senderName: '🤖 AI Assistant',
              content: 'Sorry, I couldn\'t process that right now. Please try again.',
              type: 'ai',
            });
          }
        }
      }
    }

    return NextResponse.json({ message });
  } catch (err: any) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
