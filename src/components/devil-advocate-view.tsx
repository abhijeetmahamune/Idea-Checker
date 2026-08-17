'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Skull,
  AlertTriangle,
  Flame,
  Target,
  Brain,
  Sparkles,
  ShieldOff,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import type { DevilReport, Charge } from '@/lib/mock-devil-report';
import { CaseHistoryList } from '@/components/devil-advocate/CaseHistoryList';
import { EvolutionSummaryCard } from '@/components/devil-advocate/EvolutionSummaryCard';
import { ChallengeTheAdvocate } from '@/components/devil-advocate/ChallengeTheAdvocate';

interface DevilAdvocateViewProps {
  solutionId: string;
  initialReport: DevilReport | null;
  domain?: string;
  initialReportId?: string;
  initialEvolutionSummary?: any;
}

const SEVERITY_CONFIG = {
  Fatal: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
    icon: Skull,
    iconClass: 'text-rose-400',
    border: 'border-l-rose-500',
  },
  Severe: {
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
    icon: AlertTriangle,
    iconClass: 'text-orange-400',
    border: 'border-l-orange-500',
  },
  Moderate: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
    border: 'border-l-amber-500',
  },
};

export function DevilAdvocateView({
  solutionId,
  initialReport,
  domain,
  initialReportId,
  initialEvolutionSummary,
}: DevilAdvocateViewProps) {
  const [report, setReport] = useState<DevilReport | null>(initialReport);
  const [activeReportId, setActiveReportId] = useState<string | undefined>(initialReportId);
  const [activeVersion, setActiveVersion] = useState<number | undefined>(undefined);
  const [evolutionSummary, setEvolutionSummary] = useState<any>(
    initialEvolutionSummary ?? (initialReport as any)?.evolutionSummary ?? null
  );
  const [loadingReport, setLoadingReport] = useState(false);
  const [expandedChargeIndex, setExpandedChargeIndex] = useState<number | null>(0); // First charge expanded by default

  // Link for reviewing current case in full cinematic panel
  const reviewUrl = `/devil-advocate-cinematic?solutionId=${encodeURIComponent(solutionId)}${
    activeReportId ? `&reportId=${encodeURIComponent(activeReportId)}` : ''
  }${domain ? `&domain=${encodeURIComponent(domain)}` : ''}`;

  // Link for triggering Challenge Again (forces new report generation)
  const challengeAgainUrl = `/devil-advocate-cinematic?solutionId=${encodeURIComponent(solutionId)}&forceNew=true${
    domain ? `&domain=${encodeURIComponent(domain)}` : ''
  }`;

  // Handler for selecting historical report version
  async function handleSelectReport(reportId: string) {
    if (reportId === activeReportId && report) return;

    setLoadingReport(true);
    try {
      const res = await fetch(
        `/api/devil-advocate/exists?solutionId=${encodeURIComponent(solutionId)}&reportId=${encodeURIComponent(reportId)}`
      );
      if (!res.ok) return;

      const data = await res.json();
      if (data.exists && data.report) {
        setReport(data.report as DevilReport);
        setActiveReportId(data.reportId);
        setActiveVersion(data.version);
        setEvolutionSummary(data.evolutionSummary ?? (data.report as any)?.evolutionSummary ?? null);
      }
    } catch (err) {
      console.error('Failed to load selected report version:', err);
    } finally {
      setLoadingReport(false);
    }
  }

  // ── No Report Exists: Case Chamber Entrance ──────────────────────────────
  if (!report) {
    return (
      <div className="dark [color-scheme:dark]">
        <Card className="border-rose-500/30 bg-zinc-950 p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden text-zinc-100">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-orange-500" />
          <div className="max-w-xl mx-auto space-y-6">
            <div className="relative inline-block">
              <div className="h-20 w-20 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                <Skull className="h-10 w-10 text-rose-500" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-rose-600 flex items-center justify-center shadow-md">
                <span className="text-white text-xs">😈</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase tracking-widest">
                <span>Devil&apos;s Advocate</span>
              </div>
              <blockquote className="text-xl sm:text-2xl font-serif italic text-white leading-snug">
                &ldquo;Every great idea should survive its harshest critic.&rdquo;
              </blockquote>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
                Put your solution on trial before the market does. An unflinching VC prosecutor will stress-test every assumption.
              </p>
            </div>

            <div className="pt-2">
              <Link href={reviewUrl}>
                <Button className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-6 text-sm flex items-center gap-2 mx-auto shadow-xl shadow-rose-500/25 transition-all hover:scale-105 cursor-pointer">
                  <Flame className="h-4 w-4" />
                  Enter the Chamber
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Extract charges list safely (charges array or legacy failureReasons fallback)
  const chargesList: Charge[] = (report.charges && report.charges.length > 0)
    ? report.charges
    : (report.failureReasons || []).map((item: any, i: number) => ({
        title: `Charge #${i + 1}`,
        severity: item.severity || 'Severe',
        reasoning: item.reason || '',
        evidence: '',
        businessImpact: '',
        founderAssumption: '',
        suggestedValidation: '',
        counterEvidence: '',
      }));

  // ── Main Devil's Advocate Case File Surface (Dedicated Dark Theme) ─────
  return (
    <div className="dark [color-scheme:dark] bg-zinc-950 text-zinc-100 rounded-xl p-4 sm:p-6 lg:p-8 border border-zinc-800/90 shadow-2xl space-y-8 font-sans">
      
      {/* ── 1. PROSECUTION VERDICT (Primary Statement) ──────────────────── */}
      <Card className="border-rose-500/40 bg-zinc-900/90 p-6 sm:p-8 relative overflow-hidden shadow-2xl text-zinc-100">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-orange-500 to-rose-600" />
        <div className="flex flex-col gap-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">😈</span>
              <span className="text-xs font-bold text-rose-400 font-mono uppercase tracking-widest">
                PROSECUTION VERDICT {activeVersion ? `· CHALLENGE #${activeVersion}` : ''}
              </span>
            </div>
            {report.overallRiskLevel && (
              <Badge variant="outline" className="border-rose-500/50 text-rose-300 bg-rose-500/10 text-xs font-mono font-bold px-3 py-1 uppercase tracking-wider">
                {report.overallRiskLevel}
              </Badge>
            )}
          </div>

          {/* Large readable verdict statement */}
          <blockquote className="text-lg sm:text-xl font-bold text-white italic border-l-4 border-rose-500 pl-4 py-1 leading-relaxed">
            &ldquo;{report.verdict}&rdquo;
          </blockquote>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={reviewUrl}>
              <Button className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-5 text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer">
                <Flame className="h-4 w-4" />
                Review the Case
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={challengeAgainUrl}>
              <Button variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:border-rose-500/40 px-5 py-5 text-xs flex items-center gap-2 transition-all cursor-pointer">
                <RefreshCw className="h-3.5 w-3.5 text-rose-400" />
                Challenge Again
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* ── 2. CASE HISTORY ARCHIVE ─────────────────────────────────────── */}
      <CaseHistoryList
        solutionId={solutionId}
        activeReportId={activeReportId}
        onSelectReport={handleSelectReport}
      />

      {/* Evolution Summary Card (if comparison to prior version exists) */}
      {evolutionSummary && (
        <EvolutionSummaryCard
          evolutionSummary={evolutionSummary}
          version={activeVersion}
        />
      )}

      {/* ── 3. PROSECUTION CHARGES ──────────────────────────────────────── */}
      <div className={`space-y-4 ${loadingReport ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <ShieldOff className="h-4 w-4 text-rose-400" />
              PROSECUTION CHARGES ({chargesList.length})
            </h3>
            <p className="text-xs text-zinc-400">Formal legal claims and vulnerability assessments against your idea.</p>
          </div>
        </div>

        <div className="space-y-3">
          {chargesList.map((charge, i) => {
            const severity = charge.severity || 'Severe';
            const cfg = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.Severe;
            const Icon = cfg.icon;
            const chargeNumber = String(i + 1).padStart(2, '0');
            const isExpanded = expandedChargeIndex === i;

            return (
              <Card
                key={i}
                className={`bg-zinc-900/70 border ${isExpanded ? 'border-rose-500/40 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'} ${cfg.border} border-l-4 transition-all overflow-hidden text-zinc-100`}
              >
                {/* Charge Header Row (Clickable to toggle expansion) */}
                <button
                  type="button"
                  onClick={() => setExpandedChargeIndex(isExpanded ? null : i)}
                  className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="font-mono text-sm font-bold text-zinc-500 mt-0.5">
                      {chargeNumber}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-white">{charge.title}</h4>
                        <Badge className={`${cfg.badge} text-[10px] font-bold font-mono uppercase gap-1`}>
                          <Icon className={`h-2.5 w-2.5 ${cfg.iconClass}`} />
                          {severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                        {charge.reasoning}
                      </p>
                    </div>
                  </div>
                  <div className="p-1 rounded bg-zinc-800/60 text-zinc-400 hover:text-white flex-shrink-0 mt-0.5">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {/* Expanded Detailed Breakdown (Milestone 5 Structure) */}
                {isExpanded && (
                  <div className="px-4 pb-5 sm:px-5 border-t border-zinc-800/80 pt-4 space-y-4 bg-zinc-950/40 text-xs">
                    {charge.evidence && (
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-rose-400" />
                          EVIDENCE & MARKET REALITY
                        </span>
                        <p className="text-zinc-300 leading-relaxed bg-zinc-900/90 p-3 rounded border border-zinc-800/80">
                          {charge.evidence}
                        </p>
                      </div>
                    )}

                    {charge.businessImpact && (
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Skull className="h-3 w-3 text-orange-400" />
                          BUSINESS & FINANCIAL IMPACT
                        </span>
                        <p className="text-zinc-300 leading-relaxed bg-zinc-900/90 p-3 rounded border border-zinc-800/80">
                          {charge.businessImpact}
                        </p>
                      </div>
                    )}

                    {charge.founderAssumption && (
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Brain className="h-3 w-3 text-purple-400" />
                          UNVALIDATED FOUNDER ASSUMPTION
                        </span>
                        <p className="text-zinc-300 leading-relaxed bg-zinc-900/90 p-3 rounded border border-zinc-800/80">
                          {charge.founderAssumption}
                        </p>
                      </div>
                    )}

                    {(charge.suggestedValidation || charge.counterEvidence) && (
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          PROOF REQUIRED FOR WITHDRAWAL
                        </span>
                        <p className="text-emerald-200/90 leading-relaxed bg-emerald-950/20 p-3 rounded border border-emerald-500/20 italic">
                          {charge.suggestedValidation || charge.counterEvidence}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── 4. SUPPORTING ANALYSIS (Competitors & Founder Traps) ───────── */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${loadingReport ? 'opacity-50 pointer-events-none transition-opacity' : ''}`}>
        
        {/* Ignored Competitors */}
        <div className="space-y-3">
          <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Target className="h-4 w-4 text-orange-400" />
              COMPETITORS YOU&apos;RE IGNORING
            </h3>
            <p className="text-xs text-zinc-400">Threats with existing distribution moats in your ICP.</p>
          </div>
          <div className="space-y-2.5">
            {(report.ignoredCompetitors || []).map((comp, i) => (
              <Card key={i} className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800/90 space-y-2 text-zinc-100">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-orange-300 font-mono">{comp.name}</p>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{comp.threat || comp.why_threat}</p>
                {comp.whyCustomerChooses && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed pt-1 border-t border-zinc-800/60">
                    <strong className="text-zinc-300 font-mono text-[10px] uppercase">Why customers choose them:</strong> {comp.whyCustomerChooses}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Founder Assumption Traps */}
        <div className="space-y-3">
          <div className="border-b border-zinc-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono uppercase tracking-wider">
              <Brain className="h-4 w-4 text-purple-400" />
              FOUNDER ASSUMPTION TRAPS
            </h3>
            <p className="text-xs text-zinc-400">Cognitive biases identified in your core assumptions.</p>
          </div>
          <div className="space-y-2">
            {(report.founderTraps || []).map((trap, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/70 border border-zinc-800/90 text-xs">
                <span className="text-purple-400 font-mono text-xs font-bold flex-shrink-0 mt-0.5">
                  0{i + 1}.
                </span>
                <p className="text-zinc-300 leading-relaxed">{trap}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. WHAT WOULD CHANGE MY MIND? (Acquittal Condition) ──────────── */}
      {report.conditionToReconsider && (
        <Card className="border-emerald-500/30 bg-emerald-950/20 p-5 sm:p-6 relative overflow-hidden shadow-xl text-zinc-100">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  WHAT WOULD CHANGE MY MIND?
                </h4>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10 text-[9px] font-mono uppercase">
                  Acquittal Target
                </Badge>
              </div>
              <p className="text-sm text-emerald-100 leading-relaxed italic border-l-2 border-emerald-500/60 pl-3 py-0.5">
                &ldquo;{report.conditionToReconsider}&rdquo;
              </p>
              <p className="text-[11px] text-zinc-400 pt-1">
                The Advocate has specified exact measurable target evidence that would invalidate the prosecution case.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── 6. CHALLENGE THE ADVOCATE (Interactive Debate) ──────────────── */}
      <div className="pt-2">
        <ChallengeTheAdvocate solutionId={solutionId} />
      </div>

    </div>
  );
}
