'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DOMAINS,
  getDomainById,
  assembleAnswersIntoSolution,
} from '@/lib/questionnaire-config';
import type { Domain, Question } from '@/lib/questionnaire-config';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Rocket,
  ChevronRight,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type GuidedStep =
  | { type: 'domain' }
  | { type: 'problem-title' }
  | { type: 'problem-desc' }
  | { type: 'question'; index: number };

interface GuidedEvalFormProps {
  onCancel: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Guided Evaluator — wraps questionnaire + problem fields + submission
// ─────────────────────────────────────────────────────────────────────────────
export function GuidedEvalForm({ onCancel }: GuidedEvalFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<GuidedStep>({ type: 'domain' });
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [animating, setAnimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitStep, setSubmitStep] = useState('');

  const totalSteps = selectedDomain
    ? 2 + selectedDomain.questions.length // problem-title + problem-desc + questions
    : 0;

  const currentStepIndex =
    step.type === 'domain'
      ? 0
      : step.type === 'problem-title'
      ? 1
      : step.type === 'problem-desc'
      ? 2
      : 3 + step.index;

  const progressPct =
    totalSteps > 0 ? Math.round(((currentStepIndex) / (totalSteps + 1)) * 100) : 0;

  // Loading steps for submission
  const loadingSteps = [
    { threshold: 15, text: 'Initiating secure guest environment...' },
    { threshold: 40, text: 'Running parallel evaluations via Llama 3, Gemma 2 & Qwen 2...' },
    { threshold: 70, text: 'Processing consensus scores & running Nemetron backups...' },
    { threshold: 88, text: 'Synthesizing strengths, weaknesses & feedback...' },
    { threshold: 97, text: 'Generating your Idea Checker Score...' },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (submitting) {
      interval = setInterval(() => {
        setSubmitProgress((prev) => {
          if (prev >= 98) { clearInterval(interval); return prev; }
          const inc = prev < 50 ? 2.5 : prev < 80 ? 1 : 0.4;
          const next = prev + inc;
          const s = loadingSteps.find((l) => next <= l.threshold) || loadingSteps[loadingSteps.length - 1];
          setSubmitStep(s.text);
          return next;
        });
      }, 300);
    } else {
      setSubmitProgress(0);
      setSubmitStep('');
    }
    return () => clearInterval(interval);
  }, [submitting]);

  function animateTo(next: GuidedStep) {
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 180);
  }

  function handleDomainSelect(domainId: string) {
    const domain = getDomainById(domainId);
    if (!domain) return;
    setSelectedDomain(domain);
    setAnswers({});
    animateTo({ type: 'problem-title' });
  }

  function handleBack() {
    if (step.type === 'problem-title') {
      animateTo({ type: 'domain' });
      setSelectedDomain(null);
    } else if (step.type === 'problem-desc') {
      animateTo({ type: 'problem-title' });
    } else if (step.type === 'question') {
      if (step.index === 0) animateTo({ type: 'problem-desc' });
      else animateTo({ type: 'question', index: step.index - 1 });
    }
  }

  function handleNext() {
    if (!selectedDomain) return;
    if (step.type === 'problem-title') {
      if (problemTitle.trim().length < 5) { toast.error('Title must be at least 5 characters.'); return; }
      animateTo({ type: 'problem-desc' });
    } else if (step.type === 'problem-desc') {
      if (problemDesc.trim().length < 20) { toast.error('Problem description must be at least 20 characters.'); return; }
      animateTo({ type: 'question', index: 0 });
    } else if (step.type === 'question') {
      const q = selectedDomain.questions[step.index];
      if (q.required && !answers[q.id]?.trim()) { toast.error('Please answer this question.'); return; }
      if (step.index < selectedDomain.questions.length - 1) {
        animateTo({ type: 'question', index: step.index + 1 });
      } else {
        handleSubmit();
      }
    }
  }

  async function handleSubmit() {
    if (!selectedDomain) return;
    const solutionContent = assembleAnswersIntoSolution(selectedDomain, answers);

    setSubmitting(true);
    setSubmitProgress(5);
    setSubmitStep('Initiating request...');

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemTitle,
          problemDescription: problemDesc,
          solutionContent,
          domain: selectedDomain.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Evaluation failed.');

      setSubmitProgress(100);
      setSubmitStep('Success! Redirecting to your report...');
      toast.success('Evaluation complete!');
      setTimeout(() => router.push(`/guest-evaluation/${data.solutionId}`), 900);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  }

  // ── Submission loading screen ──
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16 text-center min-h-[400px]">
        <div className="relative flex items-center justify-center">
          <div className="animate-ping absolute h-14 w-14 rounded-full bg-violet-400 opacity-10" />
          <BrainCircuit className="h-10 w-10 text-violet-400 animate-pulse relative" />
        </div>
        <div className="space-y-2 w-full max-w-xs">
          <Progress value={submitProgress} className="h-1.5 bg-zinc-900" />
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>{submitStep}</span>
            <span>{Math.round(submitProgress)}%</span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
          Running parallel evaluations — please don't close this page.
        </p>
      </div>
    );
  }

  // ── Domain selector ──
  if (step.type === 'domain') {
    return (
      <div className={`space-y-5 transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        <div className="space-y-1">
          <p className="text-base font-bold text-white">What type of idea is this?</p>
          <p className="text-xs text-zinc-500">
            We'll ask you targeted questions and build a structured evaluation from your answers.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {DOMAINS.map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainSelect(domain.id)}
              className="w-full text-left p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-violet-500/50 hover:bg-zinc-900 transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{domain.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                    {domain.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-tight truncate">{domain.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-violet-400 ml-auto flex-shrink-0 transition-colors" />
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-2"
        >
          ← Go back to Manual mode
        </button>
      </div>
    );
  }

  // ── Problem Title ──
  if (step.type === 'problem-title') {
    return (
      <StepShell
        animating={animating}
        domain={selectedDomain!}
        stepLabel="Name your idea"
        stepNum={1}
        totalSteps={totalSteps + 1}
        onBack={handleBack}
        onNext={handleNext}
        canProceed={problemTitle.trim().length >= 5}
        isLast={false}
      >
        <p className="text-sm font-semibold text-white mb-3">What's the name of your idea or startup?</p>
        <input
          type="text"
          value={problemTitle}
          onChange={(e) => setProblemTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          placeholder="e.g. AI-powered legal document simplifier"
          autoFocus
          className="w-full text-sm bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 focus:outline-none focus:ring-1 focus:ring-violet-500/60 text-white placeholder-zinc-600"
        />
      </StepShell>
    );
  }

  // ── Problem Description ──
  if (step.type === 'problem-desc') {
    return (
      <StepShell
        animating={animating}
        domain={selectedDomain!}
        stepLabel="Describe the problem"
        stepNum={2}
        totalSteps={totalSteps + 1}
        onBack={handleBack}
        onNext={handleNext}
        canProceed={problemDesc.trim().length >= 20}
        isLast={false}
      >
        <p className="text-sm font-semibold text-white mb-3">
          What problem are you solving? Who experiences it and why does it matter?
        </p>
        <textarea
          value={problemDesc}
          onChange={(e) => setProblemDesc(e.target.value)}
          placeholder="Describe the core pain point. Who suffers from it? What happens today without your solution? (min 20 characters)"
          rows={4}
          autoFocus
          className="w-full text-sm bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 focus:outline-none focus:ring-1 focus:ring-violet-500/60 resize-none text-white placeholder-zinc-600 leading-relaxed"
        />
      </StepShell>
    );
  }

  // ── Domain Questions ──
  if (step.type === 'question' && selectedDomain) {
    const q: Question = selectedDomain.questions[step.index];
    const answer = answers[q.id] ?? '';
    const canProceed = q.required ? answer.trim().length > 0 : true;
    const isLast = step.index === selectedDomain.questions.length - 1;

    return (
      <StepShell
        animating={animating}
        domain={selectedDomain}
        stepLabel={`${selectedDomain.label} — Question ${step.index + 1} of ${selectedDomain.questions.length}`}
        stepNum={3 + step.index}
        totalSteps={totalSteps + 1}
        onBack={handleBack}
        onNext={handleNext}
        canProceed={canProceed}
        isLast={isLast}
      >
        <p className="text-sm font-semibold text-white mb-3 leading-snug">{q.question}</p>

        {(q.type === 'text' || q.type === 'textarea') && (
          q.type === 'textarea' ? (
            <textarea
              value={answer}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              placeholder={q.placeholder}
              rows={3}
              autoFocus
              className="w-full text-sm bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 focus:outline-none focus:ring-1 focus:ring-violet-500/60 resize-none text-white placeholder-zinc-600 leading-relaxed"
            />
          ) : (
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && canProceed && handleNext()}
              placeholder={q.placeholder}
              autoFocus
              className="w-full text-sm bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 focus:outline-none focus:ring-1 focus:ring-violet-500/60 text-white placeholder-zinc-600"
            />
          )
        )}

        {q.type === 'options' && q.options && (
          <div className="space-y-2">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.value }))}
                className={`w-full text-left text-sm p-3.5 rounded-xl border transition-all duration-150 ${
                  answer === opt.value
                    ? 'border-violet-500/60 bg-violet-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`h-3.5 w-3.5 rounded-full border flex-shrink-0 transition-colors ${
                    answer === opt.value ? 'border-violet-400 bg-violet-500' : 'border-zinc-600'
                  }`} />
                  {opt.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {q.type === 'yesno' && (
          <div className="grid grid-cols-2 gap-3">
            {[{ label: '✅  Yes', value: 'yes' }, { label: '❌  No', value: 'no' }].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAnswers((p) => ({ ...p, [q.id]: opt.value }))}
                className={`text-sm p-3.5 rounded-xl border font-medium transition-all duration-150 ${
                  answer === opt.value
                    ? 'border-violet-500/60 bg-violet-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </StepShell>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Shell — consistent wrapper for all question steps
// ─────────────────────────────────────────────────────────────────────────────
function StepShell({
  animating,
  domain,
  stepLabel,
  stepNum,
  totalSteps,
  onBack,
  onNext,
  canProceed,
  isLast,
  children,
}: {
  animating: boolean;
  domain: Domain;
  stepLabel: string;
  stepNum: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
  isLast: boolean;
  children: React.ReactNode;
}) {
  const pct = Math.round((stepNum / totalSteps) * 100);

  return (
    <div className={`space-y-5 transition-opacity duration-180 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Domain badge + progress */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-1">
            <span>{domain.icon}</span>
            <span className="truncate max-w-[160px]">{stepLabel}</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">{stepNum}/{totalSteps}</span>
        </div>
        <div className="w-full bg-zinc-900 rounded-full h-0.5">
          <div
            className="bg-gradient-to-r from-violet-500 to-indigo-500 h-0.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Navigation */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs h-10 px-4 flex-shrink-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`flex-1 h-10 text-sm font-semibold gap-1.5 ${
            isLast
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white'
          }`}
        >
          {isLast ? (
            <><Rocket className="h-4 w-4" /> Evaluate My Idea</>
          ) : (
            <>Next <ArrowRight className="h-3.5 w-3.5" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
