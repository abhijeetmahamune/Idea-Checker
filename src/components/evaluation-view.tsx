import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Lightbulb, DollarSign,
  Zap, Scale, HeartCrack, ChevronRight, Cpu, BarChart3, Activity,
  AlertTriangle, Flame, ShieldAlert, Compass
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PivotSuggestions } from '@/components/pivot-suggestions';
import { ExpandableText } from '@/components/expandable-text';
import { AnimatedDimBar, type DimIconName } from '@/components/animated-score';
import { PentagonRadarChart } from '@/components/pentagon-radar-chart';
import { ScoreCoachingCard } from '@/components/score-coaching-card';
import { EditSolutionDialog } from '@/components/edit-solution-dialog';
import { FounderClarifications } from '@/components/founder-clarifications';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawModelResponse {
  model: string;
  role?: string;
  response: {
    feasibility: number;
    effectiveness: number;
    scalability: number;
    costEfficiency: number;
    innovation: number;
    confidence?: number;
    reasoning?: string;
    strengths: string[];
    weaknesses: string[];
    summary: string;
  };
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
}

interface EvaluationViewProps {
  problem: {
    id?: string;
    title: string;
    description: string;
    tags?: string[] | null;
  };
  solution: {
    id?: string;
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
    rawResponses?: RawModelResponse[] | null;

    // Extended consensus engine fields
    contestedDimensions?: string[] | null;
    dimensionSpread?: Record<string, number> | null;
    bottleneck?: { dimension: string; score: number } | null;
    consensusSummary?: string | null;
    trustLevel?: 'high' | 'medium' | 'low' | string | null;
    trustLabel?: string | null;
    rankedStrengths?: Array<{ text: string; mentionedBy: number }> | null;
    rankedWeaknesses?: Array<{ text: string; mentionedBy: number }> | null;
    domain?: string | null;

    clarificationQuestions?: Array<{ question: string; dimension: string; reason: string }> | null;
    founderClarifications?: Array<{ question: string; answer: string; dimension?: string }> | null;
    evaluationType?: string | null;
  };
  showRegisterCta?: boolean;
  pivotSuggestions?: {
    title: string;
    description: string;
    rationale: string;
    estimatedScoreLift: string;
  }[] | null;
  isOwner?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getModelMeta(modelId: string, roleName?: string) {
  const id = modelId.toLowerCase();
  const role = roleName ? ` (${roleName})` : '';

  if (id.includes('llama'))
    return {
      label: `Llama 3.3 70B${role}`,
      provider: 'Meta · Skeptic Lens',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      dot: 'bg-blue-500',
    };
  if (id.includes('gemini') || id.includes('flash'))
    return {
      label: `Gemini 2.5 Flash${role}`,
      provider: 'Google · Market Realist Lens',
      color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      dot: 'bg-amber-500',
    };
  if (id.includes('claude') || id.includes('haiku'))
    return {
      label: `Claude 3 Haiku${role}`,
      provider: 'Anthropic · Opportunity Analyst Lens',
      color: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
      dot: 'bg-violet-500',
    };
  return {
    label: `${modelId}${role}`,
    provider: 'Mesh AI Analyst',
    color: 'bg-muted text-muted-foreground border-border',
    dot: 'bg-muted-foreground',
  };
}

const DIMENSION_KEYS = ['feasibility', 'effectiveness', 'scalability', 'costEfficiency', 'innovation'] as const;
type DimKey = typeof DIMENSION_KEYS[number];

const DIMENSION_LABELS: Record<DimKey, string> = {
  feasibility: 'Feasibility',
  effectiveness: 'Effectiveness',
  scalability: 'Scalability',
  costEfficiency: 'Cost Efficiency',
  innovation: 'Innovation',
};

const DOMAIN_LABELS: Record<string, string> = {
  saas: 'SaaS & B2B Software',
  healthcare: 'Healthcare & Biotech',
  ecommerce: 'E-Commerce & Marketplaces',
  edtech: 'EdTech & Learning',
  fintech: 'FinTech & Payments',
  hardware: 'Hardware & IoT',
  social: 'Social & Consumer Apps',
};

// ── Main Component ─────────────────────────────────────────────────────────────

export function EvaluationView({
  problem,
  solution,
  evaluation,
  showRegisterCta = false,
  pivotSuggestions,
  isOwner,
}: EvaluationViewProps) {
  const getScoreCardGlow = (score: number) =>
    score >= 80
      ? 'border-emerald-500/30 shadow-emerald-500/10'
      : score >= 60
      ? 'border-amber-500/30 shadow-amber-500/10'
      : 'border-rose-500/30 shadow-rose-500/10';

  const rawResponses = evaluation.rawResponses ?? [];
  const totalModels = evaluation.successfulModels.length + evaluation.failedModels.length;
  const successCount = evaluation.successfulModels.length;

  // Honest trust label calculation
  const trustLevel =
    evaluation.trustLevel ||
    (successCount >= 3 && !evaluation.successfulModels.some((m) => m.toLowerCase().includes('fallback'))
      ? 'high'
      : successCount >= 2
      ? 'medium'
      : 'low');

  const trustLabelText =
    evaluation.trustLabel ||
    (trustLevel === 'high'
      ? 'High trust · 3/3 independent models'
      : trustLevel === 'medium'
      ? 'Moderate trust · 2/3 models responded'
      : `Partial consensus · ${successCount}/3 models`);

  const trustClass =
    trustLevel === 'high'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
      : trustLevel === 'medium'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';

  // Dimension mapping
  const dimensions: { key: DimKey; name: string; score: number; icon: DimIconName; color: string; desc: string }[] = [
    { key: 'feasibility', name: 'Feasibility', score: evaluation.feasibility, icon: 'Zap', color: 'bg-indigo-500', desc: 'Is it technically and operationally viable?' },
    { key: 'effectiveness', name: 'Effectiveness', score: evaluation.effectiveness, icon: 'CheckCircle2', color: 'bg-emerald-500', desc: 'How well does it solve the core problem?' },
    { key: 'scalability', name: 'Scalability', score: evaluation.scalability, icon: 'Scale', color: 'bg-blue-500', desc: 'Can it scale to millions of users?' },
    { key: 'costEfficiency', name: 'Cost Efficiency', score: evaluation.costEfficiency, icon: 'DollarSign', color: 'bg-amber-500', desc: 'Is it cost-effective to build and run?' },
    { key: 'innovation', name: 'Innovation', score: evaluation.innovation, icon: 'Lightbulb', color: 'bg-violet-500', desc: 'How creative and differentiated is it?' },
  ];

  // Bottleneck detection
  const rawBottleneckKey =
    (evaluation.bottleneck?.dimension as DimKey) ||
    dimensions.reduce((min, d) => (d.score < min.score ? d : min), dimensions[0]).key;
  const bottleneckName = DIMENSION_LABELS[rawBottleneckKey] || 'Cost Efficiency';
  const bottleneckScore = evaluation.bottleneck?.score ?? dimensions.find((d) => d.key === rawBottleneckKey)?.score ?? evaluation.costEfficiency;

  // Disagreement detection
  const contestedKeys =
    evaluation.contestedDimensions ||
    (rawResponses.length >= 2
      ? DIMENSION_KEYS.filter((key) => {
          const scores = rawResponses.map((r) => r.response[key]);
          const spread = Math.max(...scores) - Math.min(...scores);
          return spread >= 3;
        })
      : []);

  // Ranked Strengths & Weaknesses
  const rankedStrengths =
    evaluation.rankedStrengths ||
    evaluation.feedback.strengths.map((str) => ({ text: str, mentionedBy: 1 }));
  const rankedWeaknesses =
    evaluation.rankedWeaknesses ||
    evaluation.feedback.weaknesses.map((weak) => ({ text: weak, mentionedBy: 1 }));

  // Consensus Summary (synthesized or fallback)
  const displaySummary = evaluation.consensusSummary || evaluation.feedback.summary;

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">

      {/* ── Row 1: Pentagon Radar + Context Card ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">

        {/* Pentagon Radar Chart Card */}
        <Card className={`md:col-span-5 flex flex-col justify-between items-center text-center p-5 border bg-card shadow-xl relative overflow-hidden ${getScoreCardGlow(evaluation.overallScore)}`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full filter blur-3xl pointer-events-none" />

          {/* Chart area */}
          <div className="w-full flex-1 min-h-[220px] flex items-center justify-center">
            <PentagonRadarChart
              feasibility={evaluation.feasibility}
              effectiveness={evaluation.effectiveness}
              scalability={evaluation.scalability}
              costEfficiency={evaluation.costEfficiency}
              innovation={evaluation.innovation}
              overallScore={evaluation.overallScore}
            />
          </div>

          {/* Trust badge + Mesh badge */}
          <div className="flex flex-col items-center gap-2 mt-2 w-full">
            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${trustClass}`}>
              {trustLabelText}
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 px-3 py-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              <MeshIcon className="h-3 w-3" />
              Role-Differentiated Consensus Engine
            </div>
          </div>
        </Card>

        {/* Problem & Solution Context Card */}
        <Card className="md:col-span-7 border-border bg-card p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {problem.tags?.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                ))}
                {evaluation.domain && (
                  <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5">
                    <Compass className="h-2.5 w-2.5 mr-1" />
                    {DOMAIN_LABELS[evaluation.domain] || evaluation.domain} Lens
                  </Badge>
                )}
                {evaluation.founderClarifications && evaluation.founderClarifications.length > 0 && (
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                    Evaluated with {evaluation.founderClarifications.length} Founder Clarifications
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{problem.title}</h1>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider">Problem Context:</span>
                <ExpandableText content={problem.description} label="problem context" />
              </div>
              <div className="border-t border-border my-2" />
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-muted-foreground block text-xs uppercase tracking-wider">Proposed Solution:</span>
                  {isOwner && solution.id && (
                    <EditSolutionDialog solution={{ id: solution.id, content: solution.content }} />
                  )}
                </div>
                <ExpandableText content={solution.content} label="solution" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground font-mono">
            <span>Checked: {new Date(evaluation.createdAt).toLocaleDateString()}</span>
            <span>{solution.createdAt ? 'Registered Solution' : 'Guest Evaluation'}</span>
          </div>
        </Card>
      </div>

      {/* ── Bottleneck Callout Banner ── */}
      <Card className="border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-rose-500/15 p-2 text-rose-600 dark:text-rose-400 flex-shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Primary Bottleneck Identified</span>
              <span className="text-xs font-bold text-foreground font-mono">Score: {bottleneckScore}/10</span>
            </div>
            <p className="text-xs text-foreground/80 mt-0.5 leading-relaxed">
              <strong className="text-foreground font-semibold">{bottleneckName}</strong> is the lowest-scoring dimension and poses the greatest risk to this idea&apos;s viability. Focus your next iteration on strengthening this area.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Consensus vs. Disagreement Banner (If models contested dimensions) ── */}
      {contestedKeys.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-500/15 p-2 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Analyst Disagreement Spotlight
              </h4>
              <p className="text-xs text-foreground/80 leading-relaxed">
                The 3 analysts disagreed significantly on{' '}
                <span className="font-semibold text-foreground">
                  {contestedKeys.map((k) => DIMENSION_LABELS[k as DimKey] || k).join(', ')}
                </span>
                . Disagreement highlights critical trade-offs — inspect individual analyst perspectives in the Multi-Model Breakdown below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Row 2: Dimension Bars + Synthesized Consensus & Ranked Feedback ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Dimension Breakdown */}
        <Card className="lg:col-span-5 border-border bg-card shadow-xl p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-border">
            <CardTitle className="text-lg font-bold">Dimension Breakdown</CardTitle>
            <CardDescription>Confidence-weighted score out of 10</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-5">
            {dimensions.map((dim, index) => {
              const isContested = contestedKeys.includes(dim.key);
              const scoresForDim = rawResponses.map((r) => r.response[dim.key]).filter((s) => typeof s === 'number');
              const minScore = scoresForDim.length > 0 ? Math.min(...scoresForDim) : dim.score;
              const maxScore = scoresForDim.length > 0 ? Math.max(...scoresForDim) : dim.score;

              return (
                <div key={dim.key} className="space-y-1">
                  <AnimatedDimBar
                    name={dim.name}
                    score={dim.score}
                    icon={dim.icon}
                    color={dim.color}
                    desc={dim.desc}
                    delay={index * 80}
                  />
                  {isContested && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 pl-7">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Contested · range {minScore}–{maxScore}/10 across analysts</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Right: Synthesized Summary & Ranked Strengths/Weaknesses */}
        <div className="lg:col-span-7 space-y-6">

          {/* Synthesized Consensus Summary */}
          <Card className="border-border bg-card shadow-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full filter blur-2xl pointer-events-none" />
            <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
              <BrainCircuitIcon className="h-4 w-4 text-violet-500" />
              Synthesized Consensus Summary
            </h3>
            <blockquote className="border-l-2 border-violet-500 pl-4 py-1.5 italic text-foreground/85 text-sm leading-relaxed">
              &ldquo;{displaySummary}&rdquo;
            </blockquote>
          </Card>

          {/* Ranked Strengths / Weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Key Strengths (Mention-Count Ranked) */}
            <Card className="border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Key Strengths
              </h3>
              <ul className="space-y-3">
                {rankedStrengths.map((item, i) => {
                  const mentionBadge =
                    item.mentionedBy >= 3
                      ? { label: 'Flagged by 3/3 analysts', cls: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' }
                      : item.mentionedBy === 2
                      ? { label: 'Flagged by 2/3 analysts', cls: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25' }
                      : { label: 'Flagged by 1 analyst', cls: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' };

                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${mentionBadge.cls}`}>
                            {mentionBadge.label}
                          </span>
                        </div>
                        <span>{item.text}</span>
                      </div>
                    </li>
                  );
                })}
                {rankedStrengths.length === 0 && (
                  <li className="text-xs text-muted-foreground italic">No significant strengths highlighted.</li>
                )}
              </ul>
            </Card>

            {/* Areas for Improvement (Mention-Count Ranked) */}
            <Card className="border-rose-500/20 bg-rose-500/5 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                <HeartCrack className="h-4 w-4" />
                Areas for Improvement
              </h3>
              <ul className="space-y-3">
                {rankedWeaknesses.map((item, i) => {
                  const mentionBadge =
                    item.mentionedBy >= 3
                      ? { label: 'Flagged by 3/3 analysts (High Signal)', cls: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30' }
                      : item.mentionedBy === 2
                      ? { label: 'Flagged by 2/3 analysts', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25' }
                      : { label: 'Flagged by 1 analyst', cls: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' };

                  return (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                      <span className="text-rose-500 mt-0.5 flex-shrink-0">•</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${mentionBadge.cls}`}>
                            {mentionBadge.label}
                          </span>
                        </div>
                        <span>{item.text}</span>
                      </div>
                    </li>
                  );
                })}
                {rankedWeaknesses.length === 0 && (
                  <li className="text-xs text-muted-foreground italic">No critical weaknesses identified.</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Score Coaching Card ── */}
      <ScoreCoachingCard
        feasibility={evaluation.feasibility}
        effectiveness={evaluation.effectiveness}
        scalability={evaluation.scalability}
        costEfficiency={evaluation.costEfficiency}
        innovation={evaluation.innovation}
        overallScore={evaluation.overallScore}
      />

      {/* ── Multi-Model Role Breakdown ── */}
      {rawResponses.length > 0 && (
        <Card className="border-violet-500/20 bg-card shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 p-1.5 text-white shadow-sm">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Role-Differentiated Multi-Model Breakdown</h3>
                <p className="text-xs text-muted-foreground">3 independent analytical perspectives (Skeptic, Market Realist, Opportunity Analyst)</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/8 px-3 py-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              <MeshIcon className="h-3 w-3" />
              Mesh API
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rawResponses.map((raw, i) => {
                const meta = getModelMeta(raw.model, raw.role);
                const avg = Math.round(
                  ((raw.response.feasibility +
                    raw.response.effectiveness +
                    raw.response.scalability +
                    raw.response.costEfficiency +
                    raw.response.innovation) /
                    5) *
                    10
                );
                return (
                  <div key={i} className={`rounded-xl border p-4 space-y-3 ${meta.color}`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{meta.label}</p>
                        <p className="text-[10px] opacity-80">{meta.provider}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <span className="text-lg font-black">{avg}</span>
                        <span className="text-[10px] opacity-60">/100</span>
                      </div>
                    </div>

                    {/* Reasoning snippet */}
                    {raw.response.reasoning && (
                      <p className="text-[11px] italic opacity-85 leading-snug border-l-2 border-current pl-2 py-0.5">
                        &ldquo;{raw.response.reasoning}&rdquo;
                      </p>
                    )}

                    <div className="grid grid-cols-5 gap-1 text-center pt-1 border-t border-current/10">
                      {DIMENSION_KEYS.map((key) => (
                        <div key={key} className="space-y-0.5">
                          <div className="text-xs font-bold">{raw.response[key]}</div>
                          <div className="text-[8px] opacity-60 leading-tight">{DIMENSION_LABELS[key].slice(0, 4)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] opacity-60 pt-1">
                      <div className="flex items-center gap-1">
                        <Activity className="h-2.5 w-2.5" />
                        {raw.latencyMs ? `${(raw.latencyMs / 1000).toFixed(1)}s` : '—'}
                      </div>
                      {typeof raw.response.confidence === 'number' && (
                        <span>Conf: {Math.round(raw.response.confidence * 100)}%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* ── Register CTA (guests) ── */}
      {showRegisterCta && (
        <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-transparent p-8 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
          <h2 className="text-xl font-bold text-foreground mb-2">Save your ideas and compare evaluations</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-6">
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

      {/* ── Pivot Suggestions ── */}
      {pivotSuggestions && pivotSuggestions.length > 0 && evaluation.overallScore < 60 && (
        <PivotSuggestions pivots={pivotSuggestions} currentScore={evaluation.overallScore} />
      )}
    </div>
  );
}

// ── Inline SVG icons ───────────────────────────────────────────────────────────

function BrainCircuitIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5V3M12 21v-2M19 12h2M3 12h2M19.778 4.222l-1.414 1.414M5.636 18.364l-1.414 1.414M18.364 18.364l1.414 1.414M4.222 4.222l1.414 1.414" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MeshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="5" r="2" />
      <circle cx="19" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
      <line x1="7" y1="12" x2="10" y2="12" />
      <line x1="14" y1="12" x2="17" y2="12" />
      <line x1="12" y1="7" x2="12" y2="10" />
      <line x1="12" y1="14" x2="12" y2="17" />
    </svg>
  );
}
