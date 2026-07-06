import './env';
import { evaluateSolution } from '../lib/evaluator';

async function runTest() {
  console.log('=== Testing AI Evaluation Engine ===');
  console.log('Problem: Finding a good, fast coding assistant is hard because single AI models can be unreliable and have biases.');
  console.log('Solution: We build Antigravity, a multi-model consensus coding assistant that runs checks in parallel and merges thoughts.');

  try {
    const start = Date.now();
    const result = await evaluateSolution(
      'Finding a good, fast coding assistant is hard because single AI models can be unreliable and have biases.',
      'We build Antigravity, a multi-model consensus coding assistant that runs checks in parallel and merges thoughts.'
    );
    const duration = (Date.now() - start) / 1000;

    console.log('\n=== Evaluation Result ===');
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`Overall Score: ${result.overallScore} / 100`);
    console.log(`Feasibility: ${result.feasibility} / 10`);
    console.log(`Effectiveness: ${result.effectiveness} / 10`);
    console.log(`Scalability: ${result.scalability} / 10`);
    console.log(`Cost Efficiency: ${result.costEfficiency} / 10`);
    console.log(`Innovation: ${result.innovation} / 10`);
    
    console.log('\nFeedback Strengths:');
    result.feedback.strengths.forEach((s) => console.log(` - ${s}`));

    console.log('\nFeedback Weaknesses:');
    result.feedback.weaknesses.forEach((w) => console.log(` - ${w}`));

    console.log(`\nConsensus Summary:\n"${result.feedback.summary}"`);
    console.log('\nSuccessful Models:', result.successfulModels);
    console.log('Failed Models:', result.failedModels);
  } catch (error: any) {
    console.error('Test evaluation failed:', error?.message || error);
  }
}

runTest();
