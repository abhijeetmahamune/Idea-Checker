'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { editSolutionAction } from '@/app/solution-actions';
import { toast } from 'sonner';
import { Edit, Loader2, BrainCircuit } from 'lucide-react';

interface EditSolutionDialogProps {
  solution: {
    id: string;
    content: string;
  };
}

export function EditSolutionDialog({ solution }: EditSolutionDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(solution.content);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');
  const [isPending, startTransition] = useTransition();

  const loadingSteps = [
    { threshold: 10, text: 'Preparing workspace...' },
    { threshold: 35, text: 'Running parallel evaluations via Llama, Gemma, and Qwen...' },
    { threshold: 65, text: 'Compiling consensus ratings & executing backups...' },
    { threshold: 85, text: 'Re-analyzing strengths & weaknesses feedback...' },
    { threshold: 95, text: 'Finalizing new Consensus report...' },
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
          
          const currentStep = loadingSteps.find(step => nextVal <= step.threshold) || loadingSteps[loadingSteps.length - 1];
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (content.length < 30) {
      toast.error('Solution description must be at least 30 characters long.');
      return;
    }

    setLoading(true);
    setProgress(5);
    setLoadingStep('Initiating evaluate sequence...');

    const formData = new FormData();
    formData.append('id', solution.id);
    formData.append('content', content);

    startTransition(async () => {
      const result = await editSolutionAction(formData);
      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      } else {
        setProgress(100);
        setLoadingStep('Success! Refreshing evaluation report...');
        toast.success('Solution updated and re-evaluated!');
        
        setTimeout(() => {
          setLoading(false);
          setOpen(false);
        }, 1000);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!loading) setOpen(val);
    }}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="h-7 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-1 text-[11px] px-2.5">
          <Edit className="h-3 w-3" />
          Edit
        </Button>
      } />
      <DialogContent className="border-zinc-900 bg-zinc-950 text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Solution & Re-Evaluate</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Updating your solution will run it through the parallel AI consensus engine again.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
            <BrainCircuit className="h-10 w-10 text-violet-400 animate-pulse" />
            <div className="space-y-2 w-full max-w-sm">
              <Progress value={progress} className="h-1.5 bg-zinc-900" />
              <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                <span>{loadingStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="content" className="text-sm font-semibold">
                Solution Description <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="bg-background/50 border-border focus-visible:ring-violet-500/50 resize-y"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-900">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-1.5"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  'Re-Evaluate'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
