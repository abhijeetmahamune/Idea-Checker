'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BrainCircuit, Rocket, Plus, Sparkles, PenLine, ListChecks, Loader2 } from 'lucide-react';
import { SolutionQuestionnaire } from '@/components/solution-questionnaire';

interface SolutionFormProps {
  problemId: string;
  problemDescription?: string;
  problemTitle?: string;
}

type Mode = 'manual' | 'guided';

export function SolutionForm({ problemId, problemDescription, problemTitle }: SolutionFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('manual');
  const [content, setContent] = useState('');
  const [domain, setDomain] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const loadingSteps = [
    { threshold: 10, text: 'Preparing workspace...' },
    { threshold: 35, text: 'Querying free models (Llama 3, Gemma 2, Qwen 2)...' },
    { threshold: 65, text: 'Aggregating dimension scores & executing backups...' },
    { threshold: 85, text: 'Analyzing strengths & weaknesses feedback...' },
    { threshold: 95, text: 'Finalizing Consensus score...' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            clearInterval(interval);
            return prev;
          }
          const increment = prev < 55 ? 2.5 : prev < 80 ? 1 : 0.4;
          const nextVal = prev + increment;
          const currentStep =
            loadingSteps.find((step) => nextVal <= step.threshold) ||
            loadingSteps[loadingSteps.length - 1];
          setLoadingStep(currentStep.text);
          return nextVal;
        });
      }, 350);
    } else {
      setProgress(0);
      setLoadingStep('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  // ── AI Solution Generator ──────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!problemDescription && !problemTitle) {
      toast.error('Problem context is required to generate a solution.');
      return;
    }

    setGenerating(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/generate-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle,
          problemDescription,
          domainHint: domain,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Try to parse JSON error from server
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const errData = await response.json();
          throw new Error(errData.error || `Server error: ${response.status}`);
        }
        throw new Error(`Generate failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body received from AI service.');
      }

      // Stream the response text into the textarea
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent(accumulated);
      }

      if (!accumulated.trim()) {
        throw new Error('AI returned an empty response. Please try again.');
      }

      toast.success('Solution draft generated! Feel free to edit it.');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Generate error:', err);
        toast.error(err.message || 'Failed to generate solution.');
      }
    } finally {
      setGenerating(false);
      abortRef.current = null;
    }
  };

  // ── Questionnaire completion ───────────────────────────────────────────
  const handleQuestionnaireComplete = (assembled: string, domainId: string) => {
    setContent(assembled);
    setDomain(domainId);
    setMode('manual'); // switch to manual so the user can review/edit
    toast.success('Solution built from your answers! Review and submit when ready.');
  };

  // ── Submission ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.length < 30) {
      toast.error('Solution description must be at least 30 characters long.');
      return;
    }

    setLoading(true);
    setProgress(5);
    setLoadingStep('Initiating evaluate sequence...');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          solutionContent: content,
          domain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit solution.');
      }

      setProgress(100);
      setLoadingStep('Success! Generating report details...');
      toast.success('Solution evaluated successfully!');

      setTimeout(() => {
        setContent('');
        setDomain(undefined);
        setLoading(false);
        router.push(`/problems/${problemId}/solutions/${data.solutionId}`);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred during submission.');
      setLoading(false);
    }
  };

  return (
    <Card className="border-zinc-900 bg-zinc-950/80 shadow-xl relative overflow-hidden">
      <CardHeader className="pb-4 border-b border-zinc-900">
        <CardTitle className="text-lg font-bold flex items-center gap-1.5">
          <Plus className="h-5 w-5 text-violet-400" />
          Propose Solution
        </CardTitle>
        <CardDescription className="text-zinc-500">
          Submit a new proposal to evaluate it against this problem context.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-5">
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 text-center">
            <BrainCircuit className="h-8 w-8 text-violet-400 animate-pulse" />
            <div className="space-y-2 w-full max-w-sm">
              <Progress value={progress} className="h-1.5 bg-zinc-900" />
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>{loadingStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-md transition-all duration-150 ${
                  mode === 'manual'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                Write Manually
              </button>
              <button
                type="button"
                onClick={() => setMode('guided')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-md transition-all duration-150 ${
                  mode === 'guided'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <ListChecks className="h-3.5 w-3.5" />
                Answer Questions
              </button>
            </div>

            {/* Guided Mode: Questionnaire */}
            {mode === 'guided' ? (
              <SolutionQuestionnaire
                onComplete={handleQuestionnaireComplete}
                onCancel={() => setMode('manual')}
              />
            ) : (
              /* Manual Mode: Textarea + Generate */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content" className="text-sm font-semibold flex items-center gap-1">
                      Solution Description
                      <span className="text-rose-500">*</span>
                    </Label>

                    {/* AI Generate button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={generating || (!problemDescription && !problemTitle)}
                      className="h-7 px-2.5 text-[11px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 gap-1 font-semibold border border-violet-500/20 hover:border-violet-500/40 transition-all"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </div>

                  <Textarea
                    id="content"
                    placeholder="Detail your solution approach. How does this resolve the problem pain point? What are the logistics and features? (Min 30 characters)"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={5}
                    className="bg-background/50 border-border focus-visible:ring-violet-500/50 resize-y"
                  />

                  {content.length > 0 && (
                    <p className="text-[10px] text-zinc-500 font-mono text-right">
                      {content.length} chars
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all flex items-center justify-center gap-2 group"
                >
                  <Rocket className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  Evaluate Proposal
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
