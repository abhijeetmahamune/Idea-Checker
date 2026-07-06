'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Skull,
  AlertTriangle,
  Flame,
  Target,
  Brain,
  Sparkles,
  Loader2,
  ShieldOff,
  ChevronRight,
} from 'lucide-react';

interface DevilReport {
  verdict: string;
  failureReasons: { reason: string; severity: 'Fatal' | 'Severe' | 'Moderate' }[];
  ignoredCompetitors: { name: string; why_threat: string }[];
  founderTraps: string[];
  conditionToReconsider: string;
}

interface DevilAdvocateViewProps {
  solutionId: string;
  initialReport: DevilReport | null;
  domain?: string;
}

const SEVERITY_CONFIG = {
  Fatal: {
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: Skull,
    iconClass: 'text-rose-400',
    border: 'border-l-rose-500',
  },
  Severe: {
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    icon: AlertTriangle,
    iconClass: 'text-orange-400',
    border: 'border-l-orange-500',
  },
  Moderate: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: AlertTriangle,
    iconClass: 'text-amber-400',
    border: 'border-l-amber-500',
  },
};

export function DevilAdvocateView({ solutionId, initialReport, domain }: DevilAdvocateViewProps) {
  const router = useRouter();
  const [report, setReport] = useState<DevilReport | null>(initialReport);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const handleRunDevil = async () => {
    setLoading(true);
    startTransition(async () => {
      try {
        const response = await fetch('/api/devil-advocate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ solutionId, domain }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate report.');

        setReport(data.report);
        toast.success("Devil's Advocate report generated.");
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    });
  };

  // ── Empty State ──────────────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-6 text-center p-12">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-rose-500/5 border border-rose-500/20 flex items-center justify-center">
            <Skull className="h-9 w-9 text-rose-500/60" />
          </div>
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center">
            <span className="text-white text-[10px]">😈</span>
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <h3 className="text-xl font-black text-white">Devil's Advocate Mode</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            A brutally honest VC who has seen thousands of ideas fail will tear your idea apart. Every claim is grounded in real business logic.
          </p>
          <p className="text-xs text-rose-400/70 italic">Warning: this will hurt. That's the point.</p>
        </div>

        <Button
          onClick={handleRunDevil}
          disabled={loading || isPending}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-8 py-5 text-sm flex items-center gap-2 shadow-lg shadow-rose-500/20"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Summoning the critic...
            </>
          ) : (
            <>
              <Flame className="h-4 w-4" />
              Run Devil's Advocate
            </>
          )}
        </Button>
      </div>
    );
  }

  // ── Report View ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* The Verdict */}
      <Card className="border-rose-500/30 bg-rose-950/20 shadow-xl shadow-rose-500/5 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500" />
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <span className="text-sm">😈</span>
            </div>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">The Verdict</span>
          </div>
          <blockquote className="text-lg font-bold text-white leading-snug border-l-2 border-rose-500 pl-4 italic">
            &ldquo;{report.verdict}&rdquo;
          </blockquote>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why This Will Fail */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-rose-400" />
            Why This Will Fail
          </h3>
          <div className="space-y-2.5">
            {report.failureReasons.map((item, i) => {
              const cfg = SEVERITY_CONFIG[item.severity];
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  className={`p-3.5 rounded-lg bg-zinc-950/60 border-l-2 ${cfg.border} border border-zinc-800 space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <Badge className={`${cfg.badge} text-[10px] font-bold gap-1`}>
                      <Icon className={`h-2.5 w-2.5 ${cfg.iconClass}`} />
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{item.reason}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Ignored Competitors */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-400" />
              Competitors You're Ignoring
            </h3>
            <div className="space-y-2">
              {report.ignoredCompetitors.map((comp, i) => (
                <div key={i} className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
                  <p className="text-xs font-bold text-orange-300">{comp.name}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{comp.why_threat}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Founder Traps */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              Founder Assumption Traps
            </h3>
            <div className="space-y-2">
              {report.founderTraps.map((trap, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                  <span className="text-purple-400 font-mono text-[11px] font-bold mt-0.5 flex-shrink-0">
                    0{i + 1}.
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">{trap}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Condition to Reconsider */}
      <Card className="border-emerald-500/20 bg-emerald-950/10 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 flex-shrink-0">
            <Sparkles className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              The One Thing That Would Change My Mind
            </p>
            <p className="text-sm text-zinc-200 leading-relaxed italic">
              &ldquo;{report.conditionToReconsider}&rdquo;
            </p>
          </div>
        </div>
      </Card>

      {/* Re-run button */}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleRunDevil}
          disabled={loading || isPending}
          className="text-xs border-zinc-800 text-zinc-400 hover:text-white hover:border-rose-500/40 gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5 text-rose-400" />}
          Re-run Devil's Advocate
        </Button>
      </div>
    </div>
  );
}
