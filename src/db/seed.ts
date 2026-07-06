import './env';
import { db } from './index';
import { users, problems, solutions, evaluations } from './schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('--- Starting Seed Script ---');

  const mockUserId = '11111111-1111-1111-1111-111111111111';

  try {
    // Check if database URL is configured
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }

    // 1. Create a mock user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, mockUserId))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: mockUserId,
        email: 'mock-builder@ideachecker.com',
        name: 'Mock Startup Builder',
      });
      console.log('Successfully inserted mock user.');
    } else {
      console.log('Mock user already exists in database.');
    }

    // 2. Insert a sample Problem
    const insertedProblem = await db
      .insert(problems)
      .values({
        userId: mockUserId,
        title: 'High latency in third-party API integration',
        description:
          'SaaS platforms often integrate with multiple external REST APIs (payment gateways, CRM, notifications) that have unpredictable response times, leading to slow page loads and bad user experiences.',
        tags: ['SaaS', 'Performance', 'API'],
      })
      .returning();
    
    const problemId = insertedProblem[0].id;
    console.log('Successfully inserted sample problem, ID:', problemId);

    // 3. Insert a sample Solution
    const insertedSolution = await db
      .insert(solutions)
      .values({
        problemId,
        userId: mockUserId,
        content:
          'Implement an asynchronous worker queue (using BullMQ and Redis) that processes external API integrations out-of-band. The client requests are stored in a job queue, and we return a fast 202 Accepted status. Client polls or uses a WebSocket connection to get updates when the worker finishes execution.',
      })
      .returning();
    
    const solutionId = insertedSolution[0].id;
    console.log('Successfully inserted sample solution, ID:', solutionId);

    // 4. Insert a sample Evaluation
    await db.insert(evaluations).values({
      solutionId,
      feasibility: 8,
      effectiveness: 9,
      scalability: 9,
      costEfficiency: 7,
      innovation: 8,
      overallScore: 82,
      feedback: {
        strengths: [
          'Offloads slow network transactions from the client request loop, reducing TTFB.',
          'Provides excellent scalability since Redis queues can handle thousands of jobs concurrently.',
          'Decoupled system architecture is easier to debug and scale independently.',
        ],
        weaknesses: [
          'Adds system complexity by introducing Redis and worker processes to manage.',
          'Requires handling client state synchronization via polling or WebSockets, increasing frontend work.',
        ],
        summary:
          'An asynchronous worker queue is an industry-standard solution for offloading slow API transactions. It offers excellent scalability and reliability, though it introduces operational complexity.',
      },
      successfulModels: ['Llama 3 8B (Mock)', 'Gemma 2 9B (Mock)', 'Qwen 2 7B (Mock)'],
      failedModels: [],
    });
    
    console.log('Successfully inserted sample evaluation report.');
    console.log('--- Database Seeding Complete ---');
  } catch (error: any) {
    console.error('Error during seeding:', error?.message || error);
  }
}

seed().then(() => process.exit(0));
