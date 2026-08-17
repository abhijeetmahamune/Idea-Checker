'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { History, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface ChallengeHistoryItem {
  id: string;
  version: number;
  title: string;
  createdAt: string;
  overallRiskLevel: string;
  verdict: string;
  evolutionSummary?: any;
}

interface CaseHistoryListProps {
  solutionId: string;
  activeReportId?: string;
  onSelectReport: (reportId: string) => void;
}

const RISK_BADGE_STYLE: Record<string, string> = {
  Critical: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  'High Risk': 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  'Moderate Risk': 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  'Low Risk': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
};

export function CaseHistoryList({ solutionId, activeReportId, onSelectReport }: CaseHistoryListProps) {
  const [history, setHistory] = useState<ChallengeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!solutionId) return;

    let isMounted = true;
    async function fetchHistory() {
      try {
        const res = await fetch(`/api/devil-advocate/history?solutionId=${encodeURIComponent(solutionId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.history) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error('Failed to load case history:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchHistory();
    return () => { isMounted = false; };
  }, [solutionId, activeReportId]);

  if (loading || history.length <= 1) {
    return null;
  }

  return (
    <Card className="border-zinc-800 bg-zinc-950/80 p-4 space-y-3 shadow-lg text-zinc-100">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider font-mono">
          <History className="h-3.5 w-3.5 text-rose-400" />
          CASE HISTORY · {history.length} CHALLENGES
        </h4>
        <span className="text-[10px] text-zinc-500 font-mono">Archive Record</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {history.map((item) => {
          const isActive = activeReportId ? item.id === activeReportId : item.id === history[0].id;
          const formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          const badgeStyle = RISK_BADGE_STYLE[item.overallRiskLevel] || RISK_BADGE_STYLE['High Risk'];

          return (
            <button
              key={item.id}
              onClick={() => onSelectReport(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 border-rose-500/60 text-white shadow-md shadow-rose-500/10'
                  : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <div className="flex flex-col items-start text-left gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">Challenge #{item.version}</span>
                  {isActive && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase">
                      CURRENT
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5 text-zinc-500" />
                  {formattedDate}
                </span>
              </div>
              <Badge variant="outline" className={`text-[9px] font-mono ${badgeStyle}`}>
                {item.overallRiskLevel}
              </Badge>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
