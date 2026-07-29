import './env';
import { evaluateSolution } from '../lib/evaluator';

async function runTest() {
  console.log('=== Testing Upgraded Consensus AI Evaluation Engine + Founder Clarifications ===');
  const problem = 'Finding a good, fast coding assistant is hard because single AI models can be unreliable and have biases.';
  const solution = 'We build Antigravity, a multi-model consensus coding assistant that runs checks in parallel and merges thoughts.';

  try {
    console.log('\n--- 1. First Evaluation ---');
    const start1 = Date.now();
    const result1 = await evaluateSolution(problem, solution, 'saas');
    const duration1 = (Date.now() - start1) / 1000;

    console.log(`Duration: ${duration1.toFixed(2)}s`);
    console.log(`Initial Overall Score: ${result1.overallScore} / 100`);
    console.log(`Bottleneck Identified: ${result1.bottleneck.dimension} (${result1.bottleneck.score}/10)`);
    console.log(`Evaluation Type: ${result1.evaluationType}`);

    console.log('\nSynthesized Clarification Questions (3-5 generated):');
    (result1.clarificationQuestions || []).forEach((q, i) => {
      console.log(` ${i + 1}. [${q.dimension.toUpperCase()}] ${q.question}`);
      console.log(`    Why: ${q.reason}`);
    });

    console.log('\n--- 2. Re-Evaluation with Founder Clarifications ---');
    const founderClarifications = (result1.clarificationQuestions || []).slice(0, 2).map((q) => ({
      question: q.question,
      answer: `For ${q.dimension}: We benchmarked caching and batching requests using open-source smaller models, reducing per-eval inference cost to $0.0004 per call.`,
      dimension: q.dimension,
    }));

    const start2 = Date.now();
    const result2 = await evaluateSolution(problem, solution, 'saas', founderClarifications);
    const duration2 = (Date.now() - start2) / 1000;

    console.log(`Duration: ${duration2.toFixed(2)}s`);
    console.log(`Updated Overall Score: ${result2.overallScore} / 100 (Initial was ${result1.overallScore})`);
    console.log(`Evaluation Type: ${result2.evaluationType}`);
    console.log(`Founder Clarifications Included: ${result2.founderClarifications?.length ?? 0}`);
    console.log(`Updated Consensus Summary:\n"${result2.consensusSummary}"`);

  } catch (error: any) {
    console.error('Test evaluation failed:', error?.message || error);
  }
}

runTest();
