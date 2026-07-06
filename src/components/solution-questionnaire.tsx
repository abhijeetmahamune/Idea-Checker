'use client';

import { useState } from 'react';
import { DOMAINS, getDomainById, assembleAnswersIntoSolution } from '@/lib/questionnaire-config';
import type { Domain, Question } from '@/lib/questionnaire-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface SolutionQuestionnaireProps {
  onComplete: (assembledText: string, domainId: string) => void;
  onCancel: () => void;
}

export function SolutionQuestionnaire({ onComplete, onCancel }: SolutionQuestionnaireProps) {
  // step -1 = domain selector, 0..N = question steps
  const [step, setStep] = useState<number>(-1);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [animating, setAnimating] = useState(false);

  const totalQuestions = selectedDomain?.questions.length ?? 0;
  const progress = step < 0 ? 0 : Math.round(((step) / totalQuestions) * 100);

  function handleDomainSelect(domainId: string) {
    const domain = getDomainById(domainId);
    if (!domain) return;
    setSelectedDomain(domain);
    setAnswers({});
    animateToStep(0);
  }

  function animateToStep(nextStep: number) {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 200);
  }

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (!selectedDomain) return;
    const currentQuestion = selectedDomain.questions[step];

    // Validate required fields
    if (currentQuestion.required && !answers[currentQuestion.id]?.trim()) {
      return; // button is disabled, this is belt-and-suspenders
    }

    if (step < totalQuestions - 1) {
      animateToStep(step + 1);
    } else {
      // Final step — assemble and complete
      const assembled = assembleAnswersIntoSolution(selectedDomain, answers);
      onComplete(assembled, selectedDomain.id);
    }
  }

  function handleBack() {
    if (step === 0) {
      animateToStep(-1);
      setSelectedDomain(null);
    } else {
      animateToStep(step - 1);
    }
  }

  const currentQuestion: Question | null = selectedDomain ? selectedDomain.questions[step] : null;
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] ?? '') : '';
  const isLastStep = step === totalQuestions - 1;
  const canProceed = currentQuestion?.required ? currentAnswer.trim().length > 0 : true;

  // ── Domain Selector ──────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <div className={`space-y-5 transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">Select your problem domain</p>
          <p className="text-xs text-zinc-500">
            We'll ask you tailored questions and build your solution from your answers.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {DOMAINS.map((domain) => (
            <button
              key={domain.id}
              onClick={() => handleDomainSelect(domain.id)}
              className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-violet-500/40 hover:bg-zinc-900 transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{domain.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                    {domain.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-tight">{domain.description}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-violet-400 ml-auto transition-colors" />
              </div>
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full text-zinc-500 hover:text-white text-xs h-8"
        >
          ← Back to manual entry
        </Button>
      </div>
    );
  }

  // ── Question Step ────────────────────────────────────────────────────────
  if (!currentQuestion || !selectedDomain) return null;

  return (
    <div className={`space-y-5 transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>
      {/* Header: domain badge + progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px] font-semibold gap-1">
            <span>{selectedDomain.icon}</span>
            {selectedDomain.label}
          </Badge>
          <span className="text-[10px] text-zinc-500 font-mono">
            {step + 1} / {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-zinc-900 rounded-full h-1">
          <div
            className="bg-violet-500 h-1 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-white leading-snug">
          {currentQuestion.question}
        </p>

        {/* ── Text / Textarea input ── */}
        {(currentQuestion.type === 'text' || currentQuestion.type === 'textarea') && (
          currentQuestion.type === 'textarea' ? (
            <textarea
              value={currentAnswer}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              rows={3}
              className="w-full text-sm bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none text-white placeholder-zinc-600 leading-relaxed"
            />
          ) : (
            <input
              type="text"
              value={currentAnswer}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.placeholder}
              className="w-full text-sm bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-violet-500/50 text-white placeholder-zinc-600"
            />
          )
        )}

        {/* ── Options input ── */}
        {currentQuestion.type === 'options' && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                className={`w-full text-left text-sm p-3 rounded-lg border transition-all duration-150 ${
                  currentAnswer === opt.value
                    ? 'border-violet-500/60 bg-violet-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3.5 w-3.5 rounded-full border flex-shrink-0 transition-colors ${
                      currentAnswer === opt.value
                        ? 'border-violet-400 bg-violet-500'
                        : 'border-zinc-600'
                    }`}
                  />
                  {opt.label}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Yes / No input ── */}
        {currentQuestion.type === 'yesno' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '✅ Yes', value: 'yes' },
              { label: '❌ No', value: 'no' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                className={`text-sm p-3 rounded-lg border font-medium transition-all duration-150 ${
                  currentAnswer === opt.value
                    ? 'border-violet-500/60 bg-violet-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 text-xs h-9 px-4"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex-1 text-xs h-9 font-semibold flex items-center justify-center gap-1.5 ${
            isLastStep
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white'
          }`}
        >
          {isLastStep ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Build My Solution
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
