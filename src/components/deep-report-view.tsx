'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { DeepReport } from '@/lib/deep-report-generator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  FileSearch, TrendingUp, Globe, Swords, DollarSign, Cpu, Megaphone,
  ShieldAlert, Users, Award, Loader2, ChevronDown, ChevronUp, CheckCircle2,
  XCircle, AlertTriangle,
} from 'lucide-react';

// ── Section config ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'executiveSummary',       label: 'Executive Summary',         icon: FileSearch,   color: 'violet' },
  { key: 'problemValidation',      label: 'Problem Validation',        icon: CheckCircle2, color: 'emerald' },
  { key: 'marketSizing',           label: 'Market Sizing',             icon: TrendingUp,   color: 'cyan'    },
  { key: 'competitiveLandscape',   label: 'Competitive Landscape',     icon: Swords,       color: 'orange'  },
  { key: 'businessModelViability', label: 'Business Model Viability',  icon: DollarSign,   color: 'amber'   },
  { key: 'technicalFeasibility',   label: 'Technical Feasibility',     icon: Cpu,          color: 'indigo'  },
  { key: 'goToMarket',             label: 'Go-to-Market Strategy',     icon: Megaphone,    color: 'violet'  },
  { key: 'regulatoryRisks',        label: 'Regulatory & Legal Risks',  icon: ShieldAlert,  color: 'rose'    },
  { key: 'teamExecutionRisk',      label: 'Team & Execution Risk',     icon: Users,        color: 'purple'  },
  { key: 'overallVerdict',         label: 'Overall Verdict',           icon: Award,        color: 'emerald' },
] as const;

const COLOR_MAP: Record<string, { icon: string; badge: string; border: string; bg: string }> = {
  violet: { icon: 'text-violet-400', badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20', border: 'border-l-violet-500', bg: 'bg-violet-500/5' },
  emerald: { icon: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20', border: 'border-l-emerald-500', bg: 'bg-emerald-500/5' },
  cyan:    { icon: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20', border: 'border-l-cyan-500', bg: 'bg-cyan-500/5' },
  orange:  { icon: 'text-orange-400', badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20', border: 'border-l-orange-500', bg: 'bg-orange-500/5' },
  amber:   { icon: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20', border: 'border-l-amber-500', bg: 'bg-amber-500/5' },
  indigo:  { icon: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20', border: 'border-l-indigo-500', bg: 'bg-indigo-500/5' },
  rose:    { icon: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20', border: 'border-l-rose-500', bg: 'bg-rose-500/5' },
  purple:  { icon: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20', border: 'border-l-purple-500', bg: 'bg-purple-500/5' },
};

const VERDICT_CONFIG = {
  'Promising':   { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', icon: CheckCircle2, dot: 'bg-emerald-500' },
  'Needs Work':  { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',       icon: AlertTriangle, dot: 'bg-amber-500' },
  'Abandon':     { bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',          icon: XCircle,       dot: 'bg-rose-500' },
};

const COMPLEXITY_CONFIG = {
  'Low':    'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'Medium': 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'High':   'bg-rose-500/10 text-rose-300 border-rose-500/20',
};
const SEVERITY_CONFIG = COMPLEXITY_CONFIG;

// ── Props ──────────────────────────────────────────────────────────────────────
interface DeepReportViewProps {
  solutionId: string;
  initialReport: DeepReport | null;
  problemDescription: string;
  solutionContent: string;
  domain?: string;
  isOwner: boolean;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function DeepReportView({
  solutionId, initialReport, problemDescription, solutionContent, domain, isOwner,
}: DeepReportViewProps) {
  const router = useRouter();
  const [report, setReport] = useState<DeepReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['executiveSummary', 'overallVerdict']));

  const toggleSection = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deep-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solutionId, problemDescription, solutionContent, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setReport(data.report);
      setExpanded(new Set(SECTIONS.map(s => s.key)));
      toast.success('Deep Report generated!');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center gap-6 text-center p-12">
        <div className="h-20 w-20 rounded-2xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center">
          <FileSearch className="h-9 w-9 text-violet-400/70" />
        </div>
        <div className="space-y-2 max-w-md">
          <h3 className="text-xl font-black text-white">Deep Pressure-Test Report</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            A 10-section analysis covering market sizing, competitive landscape, business model viability,
            technical risks, go-to-market strategy, and a final verdict — all specific to your idea.
          </p>
          {!isOwner && (
            <p className="text-xs text-zinc-600 italic mt-2">The report hasn't been generated yet. Only the solution owner can generate it.</p>
          )}
        </div>
        {isOwner && (
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-8 py-5 text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Analysing your idea (30–60s)...</>
            ) : (
              <><FileSearch className="h-4 w-4" />Generate Deep Report</>
            )}
          </Button>
        )}
      </div>
    );
  }

  // ── Report view ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Verdict banner at top */}
      {(() => {
        const vc = VERDICT_CONFIG[report.overallVerdict.rating];
        const VIcon = vc.icon;
        return (
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${vc.bg} mb-2`}>
            <VIcon className="h-5 w-5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Overall Verdict</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${vc.bg}`}>{report.overallVerdict.rating}</span>
              </div>
              <p className="text-sm text-white leading-snug">{report.overallVerdict.summary}</p>
            </div>
          </div>
        );
      })()}

      {/* Sections */}
      {SECTIONS.filter(s => s.key !== 'overallVerdict').map(({ key, label, icon: Icon, color }) => {
        const c = COLOR_MAP[color] || COLOR_MAP.violet;
        const isOpen = expanded.has(key);

        return (
          <div key={key} className={`rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden`}>
            {/* Header */}
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-900/40 transition-colors"
              onClick={() => toggleSection(key)}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${c.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${c.icon}`} />
                </div>
                <span className="text-sm font-bold text-white">{label}</span>
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
            </button>

            {/* Content */}
            {isOpen && (
              <div className={`border-t border-zinc-800 border-l-2 ${c.border} p-4 space-y-3 animate-in fade-in duration-200`}>
                <SectionContent sectionKey={key} report={report} colors={c} />
              </div>
            )}
          </div>
        );
      })}

      {/* Re-generate */}
      {isOwner && (
        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="text-xs border-zinc-800 text-zinc-500 hover:text-white gap-1.5"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSearch className="h-3.5 w-3.5" />}
            Regenerate Report
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Section content renderer ──────────────────────────────────────────────────
function SectionContent({ sectionKey, report, colors }: { sectionKey: string; report: DeepReport; colors: typeof COLOR_MAP.violet }) {
  switch (sectionKey) {
    case 'executiveSummary':
      return <p className="text-sm text-zinc-200 leading-relaxed">{report.executiveSummary}</p>;

    case 'problemValidation': {
      const pv = report.problemValidation;
      const pct = (pv.score / 10) * 100;
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">Problem Strength</span>
              <span className={`text-sm font-black font-mono ${pv.score >= 7 ? 'text-emerald-400' : pv.score >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>{pv.score}/10</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-900">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{pv.analysis}</p>
        </div>
      );
    }

    case 'marketSizing': {
      const ms = report.marketSizing;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'TAM', value: ms.tam }, { label: 'SAM', value: ms.sam }, { label: 'SOM', value: ms.som }].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-xs font-bold text-white leading-tight">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{ms.analysis}</p>
        </div>
      );
    }

    case 'competitiveLandscape': {
      const cl = report.competitiveLandscape;
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {cl.players.map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs font-bold text-orange-300 mb-0.5">{p.name}</p>
                <p className="text-xs text-zinc-400">{p.threat}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Your Differentiation</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{cl.differentiation}</p>
          </div>
        </div>
      );
    }

    case 'businessModelViability': {
      const bm = report.businessModelViability;
      return (
        <div className="space-y-2">
          {[
            { label: 'Revenue Model', value: bm.revenueModel },
            { label: 'Unit Economics', value: bm.unitEconomics },
            { label: 'Pricing Strategy', value: bm.pricing },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">{label}</p>
              <p className="text-xs text-zinc-300 leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      );
    }

    case 'technicalFeasibility': {
      const tf = report.technicalFeasibility;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Complexity:</span>
            <Badge className={`${COMPLEXITY_CONFIG[tf.complexity]} text-xs font-bold`}>{tf.complexity}</Badge>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{tf.analysis}</p>
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Technical Risks</p>
            {tf.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="text-rose-400 flex-shrink-0 mt-0.5">•</span>{r}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'goToMarket': {
      const gtm = report.goToMarket;
      return (
        <div className="space-y-2">
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Primary Channel</p>
            <p className="text-xs text-zinc-300">{gtm.channel}</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">First 100 Customers Strategy</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{gtm.firstHundredCustomers}</p>
          </div>
        </div>
      );
    }

    case 'regulatoryRisks': {
      const rr = report.regulatoryRisks;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Severity:</span>
            <Badge className={`${SEVERITY_CONFIG[rr.severity]} text-xs font-bold`}>{rr.severity}</Badge>
          </div>
          <div className="space-y-1.5">
            {rr.risks.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />{r}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'teamExecutionRisk': {
      const ter = report.teamExecutionRisk;
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Required Founder Profile</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{ter.founderProfile}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Key First Hires</p>
            <div className="flex flex-wrap gap-2">
              {ter.keyHires.map((h, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium">{h}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'overallVerdict': {
      const ov = report.overallVerdict;
      return (
        <div className="space-y-3">
          <p className="text-sm text-zinc-200 leading-relaxed">{ov.summary}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Top Strengths</p>
              {ov.topStrengths.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-300 mb-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{s}
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2">Top Risks</p>
              {ov.topRisks.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-zinc-300 mb-1.5">
                  <XCircle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />{r}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
