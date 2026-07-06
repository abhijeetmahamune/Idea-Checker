'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, BrainCircuit, Rocket, CheckCircle2, AlertCircle } from 'lucide-react';

export function QuickEvalForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [tags, setTags] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');

  const loadingSteps = [
    { threshold: 10, text: 'Initiating secure guest environment...' },
    { threshold: 35, text: 'Running parallel evaluations via Llama 3, Gemma 2 & Qwen 2...' },
    { threshold: 65, text: 'Processing consensus scores & running Nemetron backups...' },
    { threshold: 85, text: 'Synthesizing strengths, weaknesses & written consensus feedback...' },
    { threshold: 95, text: 'Generating your final Idea Checker Score (IC Score)...' },
  ];

  // Animate progress loader during evaluation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) {
            clearInterval(interval);
            return prev;
          }
          const increment = prev < 50 ? 3 : prev < 80 ? 1.5 : 0.5;
          const nextVal = prev + increment;
          
          // Update corresponding step text
          const currentStep = loadingSteps.find(step => nextVal <= step.threshold) || loadingSteps[loadingSteps.length - 1];
          setLoadingStep(currentStep.text);

          return nextVal;
        });
      }, 300);
    } else {
      setProgress(0);
      setLoadingStep('');
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.length < 5) {
      toast.error('Title must be at least 5 characters long.');
      return;
    }
    if (description.length < 20) {
      toast.error('Problem description must be at least 20 characters long.');
      return;
    }
    if (solution.length < 30) {
      toast.error('Solution description must be at least 30 characters long.');
      return;
    }

    setLoading(true);
    setProgress(5);
    setLoadingStep('Initiating request...');

    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemTitle: title,
          problemDescription: description,
          solutionContent: solution,
          tags: parsedTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate your idea.');
      }

      setProgress(100);
      setLoadingStep('Success! Redirecting to your report...');
      toast.success('Evaluation completed successfully!');
      
      // Redirect to guest evaluation page
      setTimeout(() => {
        router.push(`/guest-evaluation/${data.solutionId}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred during evaluation.');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-border bg-card/40 backdrop-blur-md shadow-2xl shadow-violet-950/20 relative overflow-hidden">
      {/* Visual background gradient accents inside card */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/5 rounded-full filter blur-3xl pointer-events-none" />

      <CardHeader className="space-y-1.5 pb-6 border-b border-border/50">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <CardTitle className="text-xl font-bold tracking-tight">Quick Idea Evaluator</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          No sign up required. Submit your problem and solution to get an objective consensus score from 3 parallel AI models.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative flex items-center justify-center">
              <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-violet-400 opacity-20" />
              <BrainCircuit className="h-10 w-10 text-violet-400 animate-pulse relative" />
            </div>
            
            <div className="space-y-2 w-full max-w-md">
              <Progress value={progress} className="h-2 bg-secondary" />
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>{loadingStep}</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground max-w-sm">
              Please don&apos;t close this page. Parallel evaluations take about 5–15 seconds to fetch and aggregate.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-1.5">
                1. Idea Name / Title
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g. AI-powered local organic grocery delivery tracker"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-background/50 border-border focus-visible:ring-violet-500/50"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold flex items-center gap-1.5">
                2. What is the Problem?
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the problem you are trying to solve. Who experiences it? Why is it a pain point? (Min 20 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="bg-background/50 border-border focus-visible:ring-violet-500/50 resize-y"
              />
            </div>

            {/* Solution */}
            <div className="space-y-2">
              <Label htmlFor="solution" className="text-sm font-semibold flex items-center gap-1.5">
                3. What is your proposed Solution?
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="solution"
                placeholder="Describe your solution in detail. How does it address the problem above? What are the key features? (Min 30 characters)"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                required
                rows={4}
                className="bg-background/50 border-border focus-visible:ring-violet-500/50 resize-y"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags" className="text-sm font-semibold flex items-center gap-1.5">
                Tags (Optional)
              </Label>
              <Input
                id="tags"
                placeholder="e.g. SaaS, AI, Health, E-commerce (comma-separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-background/50 border-border focus-visible:ring-violet-500/50"
              />
            </div>

            {/* Action Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-6 shadow-lg shadow-violet-600/10 hover:shadow-violet-600/25 transition-all duration-200 text-base flex items-center justify-center gap-2 group"
            >
              <Rocket className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              Evaluate My Solution (Free)
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
