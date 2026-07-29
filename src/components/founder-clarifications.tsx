'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, RefreshCw, Sparkles, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface ClarificationQuestion {
  question: string;
  dimension: string;
  reason: string;
}

interface FounderClarificationItem {
  question: string;
  answer: string;
  dimension?: string;
}

interface FounderClarificationsProps {
  questions: ClarificationQuestion[];
  problemId?: string;
  solutionId?: string;
  solutionContent: string;
  domain?: string | null;
  existingClarifications?: FounderClarificationItem[] | null;
  isOwner?: boolean;
}

const DIMENSION_BADGES: Record<string, { label: string; cls: string }> = {
  costEfficiency: { label: 'Cost Efficiency', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  feasibility: { label: 'Feasibility', cls: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' },
  effectiveness: { label: 'Effectiveness', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  scalability: { label: 'Scalability', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  innovation: { label: 'Innovation', cls: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' },
};

export function FounderClarifications({
  questions,
  problemId,
  solutionId,
  solutionContent,
  domain,
  existingClarifications,
}: FounderClarificationsProps) {
  const router = useRouter();

  const storageKey = solutionId ? `founder_clarifications_${solutionId}` : null;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Initialize answers from existingClarifications, localStorage, or empty
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    if (existingClarifications && existingClarifications.length > 0) {
      existingClarifications.forEach((c) => {
        const qIdx = questions.findIndex((q) => q.question === c.question);
        if (qIdx !== -1) {
          initial[qIdx] = c.answer;
        }
      });
    }
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore cached draft answers from localStorage if present
  useEffect(() => {
    if (!storageKey || (existingClarifications && existingClarifications.length > 0)) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setAnswers(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved clarifications from localStorage:', e);
    }
  }, [storageKey, existingClarifications]);

  // Persist draft answers to localStorage on change
  const handleAnswerChange = (index: number, text: string) => {
    const updated = { ...answers, [index]: text };
    setAnswers(updated);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save clarifications to localStorage:', e);
      }
    }
  };

  // Compute non-empty clarifications to submit
  const nonEmptyClarifications: FounderClarificationItem[] = questions
    .map((q, idx) => ({
      question: q.question,
      answer: (answers[idx] || '').trim(),
      dimension: q.dimension,
    }))
    .filter((c) => c.answer.length > 0);

  const canSubmit = nonEmptyClarifications.length > 0 && !loading;

  const handleReevaluate = async () => {
    if (!canSubmit) {
      toast.error('Please answer at least one question before re-evaluating.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemId: problemId || undefined,
          solutionId: solutionId || undefined,
          solutionContent,
          domain: domain || undefined,
          force: true, // Force fresh 3-model re-evaluation
          founderClarifications: nonEmptyClarifications,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to re-evaluate with Founder Clarifications.');
      }

      toast.success(`Re-evaluated with ${nonEmptyClarifications.length} Founder Clarifications!`);

      // Clear localStorage cache after submission
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch (e) {}
      }

      // Refresh page or navigate to new solution evaluation URL
      if (problemId && data.solutionId) {
        router.push(`/problems/${problemId}/solutions/${data.solutionId}?tab=score`);
        router.refresh();
      } else if (data.solutionId) {
        router.push(`/guest-evaluation/${data.solutionId}`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      console.error('Re-evaluation error:', err);
      setErrorMessage(err.message || 'An error occurred during re-evaluation.');
      toast.error(err.message || 'Re-evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex] || questions[0];
  const badge = DIMENSION_BADGES[currentQ.dimension] || {
    label: currentQ.dimension,
    cls: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card className="border-violet-500/25 bg-card shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full filter blur-2xl pointer-events-none" />

      {/* Re-evaluation Loading Screen Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-200">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-violet-500">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <h4 className="text-sm font-bold text-foreground">Re-evaluating Solution</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              3 AI Analysts (Skeptic, Market Realist, Opportunity Analyst) are processing your Founder Clarifications...
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-violet-600 dark:text-violet-400 font-mono bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Updating Score & History Timeline...
          </div>
        </div>
      )}

      {/* Header */}
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">Improve Evaluation Accuracy</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Answer a few targeted questions to clarify missing assumptions.
              </CardDescription>
            </div>
          </div>

          {/* Question Index Badge */}
          <span className="text-xs font-mono font-semibold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20 flex-shrink-0">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Question Step Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isAnswered = Boolean(answers[idx] && answers[idx].trim().length > 0);

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                title={`Question ${idx + 1}: ${q.question}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  isCurrent
                    ? 'w-6 bg-violet-600 dark:bg-violet-400'
                    : isAnswered
                    ? 'w-2 bg-emerald-500 hover:bg-emerald-400'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                }`}
              />
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {errorMessage && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Single Question Display Card */}
        <div className="rounded-xl border border-border/80 bg-muted/20 dark:bg-zinc-900/30 p-4 space-y-3 transition-all focus-within:border-violet-500/50">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${badge.cls}`}>
              {badge.label}
            </Badge>

            {answers[currentIndex] && answers[currentIndex].trim().length > 0 && (
              <span className="inline-flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="h-3 w-3 mr-1" /> Answered
              </span>
            )}
          </div>

          <p className="text-xs font-semibold text-foreground leading-relaxed">
            {currentQ.question}
          </p>

          {currentQ.reason && (
            <p className="text-[11px] text-muted-foreground italic leading-snug">
              <span className="font-medium text-foreground/70 font-sans">Why we&apos;re asking: </span>
              {currentQ.reason}
            </p>
          )}

          <Textarea
            value={answers[currentIndex] || ''}
            onChange={(e) => handleAnswerChange(currentIndex, e.target.value)}
            placeholder="Provide specific metrics, cost structures, target user testing, or operational details..."
            className="text-xs min-h-[85px] resize-y bg-background border-border focus-visible:ring-violet-500/40"
            disabled={loading}
          />
        </div>

        {/* Controls Bar: Navigation Arrows + Submit Button */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
          {/* Arrow Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0 || loading}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Previous question"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1 || loading}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Next question"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <span className="text-[11px] text-muted-foreground ml-1 hidden sm:inline">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>

          {/* Re-evaluate Submit Button */}
          <Button
            onClick={handleReevaluate}
            disabled={!canSubmit}
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Re-evaluating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Re-evaluate ({nonEmptyClarifications.length})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
