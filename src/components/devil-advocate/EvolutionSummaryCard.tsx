'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, AlertCircle, XCircle, ShieldAlert, GitCompare } from 'lucide-react';
import type { EvolutionSummary } from '@/lib/devil-advocate-generator';

interface EvolutionSummaryCardProps {
  evolutionSummary: EvolutionSummary;
  version?: number;
}

export function EvolutionSummaryCard({ evolutionSummary, version }: EvolutionSummaryCardProps) {
  const { resolved = [], improved = [], unresolved = [], worsened = [], newRisks = [] } = evolutionSummary;

  const totalItems = resolved.length + improved.length + unresolved.length + worsened.length + newRisks.length;
  if (totalItems === 0) return null;

  return (
    <Card className="border-violet-500/30 bg-gradient-to-b from-violet-950/20 via-zinc-950/80 to-zinc-950 p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />

      <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-zinc-800/60">
        <CardTitle className="text-sm font-bold text-white flex items-center gap-2 font-display">
          <GitCompare className="h-4 w-4 text-violet-400" />
          CASE EVOLUTION
          {version && version > 1 && (
            <Badge variant="outline" className="border-violet-500/40 text-violet-300 bg-violet-500/10 text-[10px] font-mono ml-1">
              Challenge #{version} vs Challenge #{version - 1}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 pt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Resolved */}
          {resolved.length > 0 && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Resolved ({resolved.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {resolved.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improved */}
          {improved.length > 0 && (
            <div className="p-3 rounded-lg bg-emerald-950/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <AlertTriangle className="h-3.5 w-3.5 text-emerald-400" />
                <span>Improved ({improved.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {improved.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">↑</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unresolved */}
          {unresolved.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Unresolved ({unresolved.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {unresolved.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Worsened */}
          {worsened.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
                <span>Worsened ({worsened.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {worsened.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">↓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* New Risks */}
          {newRisks.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                <span>New Risks ({newRisks.length})</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {newRisks.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400 font-bold">🚨</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
