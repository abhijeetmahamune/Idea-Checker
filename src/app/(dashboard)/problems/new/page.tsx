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

export default function NewProblemPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

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
        className="inline-flex items-center text-xs text-zinc-500 hover:text-white transition-colors mb-6 gap-1"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Workspace
      </Link>

      <Card className="border-zinc-900 bg-zinc-950/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />

        <CardHeader className="space-y-1.5 pb-6 border-b border-zinc-900">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-violet-400" />
            <CardTitle className="text-xl font-bold tracking-tight">Define Problem Context</CardTitle>
          </div>
          <CardDescription className="text-zinc-500">
            Set up the target market pain point. You can run multiple solution evaluations against this context later.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-xs text-rose-400 font-medium">
                {error}
              </div>
            )}
            
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-1.5">
                Problem Name / Title
                <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Inefficiencies in local freelance designer hiring workflows"
                required
                className="bg-background/50 border-border focus-visible:ring-violet-500/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-1.5">
                Problem Description
                <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the issue in detail. Who faces this problem? What is the current standard workaround? Why is it broken? (Min 20 characters)"
                required
                rows={5}
                className="bg-background/50 border-border focus-visible:ring-violet-500/50 resize-y"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-semibold">
                Tags
              </Label>
              <Input
                id="tags"
                name="tags"
                placeholder="e.g. Freelancing, Workflow, B2B SaaS (comma-separated)"
                className="bg-background/50 border-border focus-visible:ring-violet-500/50"
              />
            </div>
          </CardContent>

          <CardFooter className="border-t border-zinc-900/60 pt-6 flex justify-between items-center bg-zinc-950/30">
            <Link href="/dashboard">
              <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-md transition-all duration-200"
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
