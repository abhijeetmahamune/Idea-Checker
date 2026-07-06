import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Lightbulb, TrendingUp, DollarSign, Zap, Scale, HeartCrack, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PivotSuggestions } from '@/components/pivot-suggestions';

interface EvaluationViewProps {
  problem: {
    title: string;
    description: string;
    tags?: string[] | null;
  };
  solution: {
    content: string;
    createdAt: Date;
  };
  evaluation: {
    feasibility: number;
    effectiveness: number;
    scalability: number;
    costEfficiency: number;
    innovation: number;
    overallScore: number;
    feedback: {
      strengths: string[];
      weaknesses: string[];
      summary: string;
    };
    successfulModels: string[];
    failedModels: string[];
    createdAt: Date;
  };
  showRegisterCta?: boolean;
  pivotSuggestions?: {
    title: string;
    description: string;
    rationale: string;
    estimatedScoreLift: string;
  }[] | null;
}

export function EvaluationView({ problem, solution, evaluation, showRegisterCta = false, pivotSuggestions }: EvaluationViewProps) {
  // Score color determinations
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  const getScoreBgGlow = (score: number) => {
    if (score >= 80) return 'shadow-emerald-500/10 border-emerald-500/20';
    if (score >= 60) return 'shadow-amber-500/10 border-amber-500/20';
    return 'shadow-rose-500/10 border-rose-500/20';
  };

  const dimensions = [
    { name: 'Feasibility', score: evaluation.feasibility, icon: Zap, color: 'bg-indigo-500', desc: 'Is it technically and operationally viable to build?' },
    { name: 'Effectiveness', score: evaluation.effectiveness, icon: CheckCircle2, color: 'bg-emerald-500', desc: 'How well does this solve the identified problem?' },
    { name: 'Scalability', score: evaluation.scalability, icon: Scale, color: 'bg-blue-500', desc: 'Can this scale to millions of users or high volume?' },
    { name: 'Cost Efficiency', score: evaluation.costEfficiency, icon: DollarSign, color: 'bg-amber-500', desc: 'Is it cost-effective to develop and run?' },
    { name: 'Innovation', score: evaluation.innovation, icon: Lightbulb, color: 'bg-violet-500', desc: 'How creative or competitively differentiated is it?' },
  ];

  // Consensus Trust Index
  const totalModels = evaluation.successfulModels.length + evaluation.failedModels.length;
  const successCount = evaluation.successfulModels.length;
  let trustLabel = 'Low';
  let trustColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  
  if (successCount >= 3) {
    trustLabel = 'High Trust Consensus';
    trustColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (successCount === 2) {
    trustLabel = 'Medium Trust Consensus';
    trustColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">
      {/* Header Banner: Score + Title */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Score Card (Radial Gauge effect) */}
        <Card className={`md:col-span-4 flex flex-col justify-center items-center text-center p-6 border ${getScoreBgGlow(evaluation.overallScore)} bg-zinc-950 shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
          
          <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-zinc-800">
            {/* Dynamic visual ring background */}
            <div className={`absolute inset-0.5 rounded-full border-4 border-t-transparent border-r-transparent animate-spin-slow ${
              evaluation.overallScore >= 80 ? 'border-l-emerald-500/40 border-b-emerald-500/40' :
              evaluation.overallScore >= 60 ? 'border-l-amber-500/40 border-b-amber-500/40' :
              'border-l-rose-500/40 border-b-rose-500/40'
            }`} />
            
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black tracking-tight">{evaluation.overallScore}</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">IC Score</span>
            </div>
          </div>

          <div className="mt-5 space-y-1.5 w-full">
            <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${trustColor}`}>
              {trustLabel} ({successCount}/{totalModels} models)
            </div>
            <p className="text-xs text-zinc-500 leading-tight">
              Calculated from average ratings of successfully aggregated AI models.
            </p>
          </div>
        </Card>

        {/* Problem & Solution Context Card */}
        <Card className="md:col-span-8 border-border bg-zinc-950 p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {problem.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{problem.title}</h1>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-zinc-400 block text-xs uppercase tracking-wider">Problem Context:</span>
                <p className="text-zinc-300 line-clamp-3 leading-relaxed mt-0.5">{problem.description}</p>
              </div>
              <div className="border-t border-zinc-900 my-2" />
              <div>
                <span className="font-semibold text-zinc-400 block text-xs uppercase tracking-wider">Proposed Solution:</span>
                <p className="text-zinc-300 line-clamp-3 leading-relaxed mt-0.5">{solution.content}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-xs text-zinc-500 font-mono">
            <span>Checked: {new Date(evaluation.createdAt).toLocaleDateString()}</span>
            <span>ID: {solution.createdAt ? 'Registered' : 'Guest Evaluation'}</span>
          </div>
        </Card>
      </div>

      {/* Grid: 5 Dimensions Breakdown & Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Dimensions Progress */}
        <Card className="lg:col-span-5 border-border bg-zinc-950 shadow-xl p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-zinc-900">
            <CardTitle className="text-lg font-bold">Dimension Breakdown</CardTitle>
            <CardDescription className="text-zinc-500">Scored individually out of 10</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-5">
            {dimensions.map((dim, index) => {
              const Icon = dim.icon;
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-zinc-200 flex items-center gap-2">
                      <Icon className="h-4 w-4 text-zinc-400" />
                      {dim.name}
                    </span>
                    <span className="font-mono font-bold text-white">{dim.score} / 10</span>
                  </div>
                  <Progress value={dim.score * 10} className="h-2 bg-zinc-900" indicatorClassName={dim.color} />
                  <p className="text-[11px] text-zinc-500 italic leading-tight">{dim.desc}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses Feedback */}
        <div className="lg:col-span-7 space-y-6">
          {/* Consensus Summary Block */}
          <Card className="border-border bg-zinc-950 shadow-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <BrainCircuitIcon className="h-4 w-4 text-violet-400" />
              Consensus Summary
            </h3>
            <blockquote className="border-l-2 border-violet-500 pl-4 py-1 italic text-zinc-300 text-sm leading-relaxed">
              &ldquo;{evaluation.feedback.summary}&rdquo;
            </blockquote>
          </Card>

          {/* Strengths / Weaknesses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card className="border-emerald-500/10 bg-zinc-950/60 p-5 shadow-lg">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Key Strengths
              </h3>
              <ul className="space-y-2.5">
                {evaluation.feedback.strengths.map((str, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
                {evaluation.feedback.strengths.length === 0 && (
                  <li className="text-xs text-zinc-500 italic">No significant strengths highlighted.</li>
                )}
              </ul>
            </Card>

            {/* Weaknesses */}
            <Card className="border-rose-500/10 bg-zinc-950/60 p-5 shadow-lg">
              <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-2">
                <HeartCrack className="h-4 w-4" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2.5">
                {evaluation.feedback.weaknesses.map((weak, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-rose-500 mt-0.5">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
                {evaluation.feedback.weaknesses.length === 0 && (
                  <li className="text-xs text-zinc-500 italic">No critical weaknesses identified.</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Model Auditability Panel */}
      <Card className="border-border bg-zinc-950/40 p-4 text-xs text-zinc-500 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div>
            <span className="font-semibold block text-zinc-400 uppercase tracking-wider text-[10px] mb-1">Evaluating Models (Audit logs):</span>
            <div className="flex flex-wrap gap-1.5">
              {evaluation.successfulModels.map((m, i) => (
                <Badge key={i} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                  ✓ {m}
                </Badge>
              ))}
            </div>
          </div>
          {evaluation.failedModels.length > 0 && (
            <div>
              <span className="font-semibold block text-rose-400 uppercase tracking-wider text-[10px] mb-1">Failed/Timed-Out Models:</span>
              <div className="flex flex-wrap gap-1.5">
                {evaluation.failedModels.map((m, i) => (
                  <Badge key={i} className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                    ✗ {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Register CTA (Shown to guests) */}
      {showRegisterCta && (
        <Card className="border-violet-500/20 bg-gradient-to-r from-violet-950/20 via-indigo-950/20 to-zinc-950 p-8 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
          <h2 className="text-xl font-bold text-white mb-2">Save your ideas and compare evaluations</h2>
          <p className="text-zinc-400 text-sm max-w-xl mx-auto mb-6">
            Register a free account to unlock your personal dashboard, track multiple solutions side-by-side, view histories, and invite collaborative inputs.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-md">
                Create Free Account
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Pivot Suggestions (shown when score < 60 and pivots are available) */}
      {pivotSuggestions && pivotSuggestions.length > 0 && evaluation.overallScore < 60 && (
        <PivotSuggestions
          pivots={pivotSuggestions}
          currentScore={evaluation.overallScore}
        />
      )}
    </div>
  );
}

// Minimal icons local definitions to avoid import failures
function BrainCircuitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5V3M12 21v-2M19 12h2M3 12h2M19.778 4.222l-1.414 1.414M5.636 18.364l-1.414 1.414M18.364 18.364l1.414 1.414M4.222 4.222l1.414 1.414" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}
