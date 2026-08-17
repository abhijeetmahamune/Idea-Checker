'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, BrainCircuit, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PendingEvaluationCardProps {
  problemId: string;
  solutionId: string;
  problemTitle?: string;
  problemDescription?: string;
  solutionContent: string;
  isOwner?: boolean;
}

export function PendingEvaluationCard({
  problemId,
  solutionId,
  problemTitle,
  problemDescription,
  solutionContent,
  isOwner = true,
}: PendingEvaluationCardProps) {
  const router = useRouter();
  const [evaluating, setEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleTriggerEvaluation() {
    setEvaluating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          solutionId,
          problemTitle,
          problemDescription,
          solutionContent,
          force: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate evaluation report.');
      }

      toast.success('AI Evaluation report generated successfully!');
      router.refresh();
    } catch (err: any) {
      const msg = err?.message || 'An error occurred while generating the evaluation.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <Card className="border-amber-500/30 bg-amber-950/10 dark:bg-zinc-950/80 p-8 text-center shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-violet-500 to-amber-500" />

      <CardHeader className="pb-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-2">
          {evaluating ? (
            <BrainCircuit className="h-8 w-8 text-amber-400 animate-pulse" />
          ) : (
            <Sparkles className="h-8 w-8 text-amber-400" />
          )}
        </div>
        <CardTitle className="text-xl font-bold font-display text-foreground">
          Evaluation Report Pending
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground max-w-md mx-auto">
          This solution has not been evaluated by the AI Consensus Ensemble yet, or the evaluation output is currently pending.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {errorMsg && (
          <div className="flex items-center justify-center gap-2 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg max-w-md mx-auto">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isOwner && (
          <Button
            onClick={handleTriggerEvaluation}
            disabled={evaluating}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-5 text-sm flex items-center gap-2 mx-auto shadow-md transition-all cursor-pointer"
          >
            {evaluating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Evaluating Solution with Multi-Model AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Consensus Evaluation Now
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
