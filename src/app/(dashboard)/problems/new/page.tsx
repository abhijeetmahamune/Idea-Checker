'use client';

import { useState, useTransition } from 'react';
import { createProblemAction } from '@/app/problem-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PROBLEM_STAGES,
  SEEKING_OPTIONS,
  MAX_SEEKING_SELECTIONS,
  type ProblemStage,
  type SeekingOption,
} from '@/lib/problem-constants';

export default function NewProblemPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<ProblemStage>('EXPLORING');
  const [selectedSeeking, setSelectedSeeking] = useState<SeekingOption[]>([]);

  const toggleSeeking = (value: SeekingOption) => {
    setSelectedSeeking((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= MAX_SEEKING_SELECTIONS) {
        toast.warning(`You can select up to ${MAX_SEEKING_SELECTIONS} things you're currently seeking.`);
        return prev;
      }
      return [...prev, value];
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    // Append controlled fields
    formData.set('stage', selectedStage);
    formData.set('seeking', selectedSeeking.join(','));

    startTransition(async () => {
      const result = await createProblemAction(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success('Problem context created!');
      }
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-2xl">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-6 gap-1"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Workspace
      </Link>

      <Card className="border-border/80 dark:border-zinc-900 bg-card/80 dark:bg-zinc-950/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />

        <CardHeader className="space-y-1.5 pb-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <CardTitle className="font-display text-xl font-bold tracking-tight text-foreground">Define Problem Context</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Set up the target market pain point. You can run multiple solution evaluations against this context later.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-xs text-destructive font-medium">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                Problem Name / Title
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Inefficiencies in local freelance designer hiring workflows"
                required
                className="bg-background border-border text-foreground focus-visible:ring-violet-500/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                Problem Description
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the issue in detail. Who faces this problem? What is the current standard workaround? Why is it broken? (Min 20 characters)"
                required
                rows={5}
                className="bg-background border-border text-foreground focus-visible:ring-violet-500/50 resize-y"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-semibold text-foreground">
                Tags
              </Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g. Freelancing, Workflow, B2B SaaS (comma-separated)"
                className="bg-background border-border text-foreground focus-visible:ring-violet-500/50"
              />
            </div>

            {/* Stage selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Problem Stage
                <span className="text-[10px] font-normal text-muted-foreground">(where is this problem in its journey?)</span>
              </Label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select problem stage">
                {PROBLEM_STAGES.map((s) => {
                  const isActive = selectedStage === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSelectedStage(s.value as ProblemStage)}
                      aria-pressed={isActive}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer',
                        isActive
                          ? cn('border', s.bgClass, s.colorClass)
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span aria-hidden="true">{s.emoji}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seeking multi-select */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Currently Seeking
                <span className="text-[10px] font-normal text-muted-foreground">(optional — up to {MAX_SEEKING_SELECTIONS})</span>
              </Label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select what you are seeking">
                {SEEKING_OPTIONS.map((o) => {
                  const isSelected = selectedSeeking.includes(o.value as SeekingOption);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleSeeking(o.value as SeekingOption)}
                      aria-pressed={isSelected}
                      title={o.description}
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer',
                        isSelected
                          ? 'border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span aria-hidden="true">{o.emoji}</span>
                      {o.label}
                    </button>
                  );
                })}
              </div>
              {selectedSeeking.length === MAX_SEEKING_SELECTIONS && (
                <p className="text-[10px] text-muted-foreground">
                  Maximum of {MAX_SEEKING_SELECTIONS} selections reached.
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="border-t border-border pt-6 flex justify-between items-center bg-muted/30 dark:bg-zinc-950/30">
            <Link href="/dashboard">
              <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground cursor-pointer">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-md transition-all duration-200 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Context'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
