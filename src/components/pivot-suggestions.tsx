'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Lightbulb, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface PivotSuggestion {
  title: string;
  description: string;
  rationale: string;
  estimatedScoreLift: string;
}

interface PivotSuggestionsProps {
  pivots: PivotSuggestion[];
  currentScore: number;
  onTryPivot?: (description: string) => void;
}

const PIVOT_COLORS = [
  { border: 'border-violet-500/20', bg: 'bg-violet-500/5', badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20', dot: 'bg-violet-500' },
  { border: 'border-indigo-500/20', bg: 'bg-indigo-500/5', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20', dot: 'bg-indigo-500' },
  { border: 'border-cyan-500/20', bg: 'bg-cyan-500/5', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20', dot: 'bg-cyan-500' },
];

export function PivotSuggestions({ pivots, currentScore, onTryPivot }: PivotSuggestionsProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <div className="p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400 flex items-center gap-2">
            Pivot Suggestions
            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-[10px] font-mono">
              Score: {currentScore}/100
            </Badge>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            Your idea scored below 60. Here are 3 strategic pivots that could dramatically improve its viability. Each is a different direction — not just a tweak.
          </p>
        </div>
      </div>

      {/* Pivot Cards */}
      <div className="space-y-3">
        {pivots.map((pivot, i) => {
          const color = PIVOT_COLORS[i % PIVOT_COLORS.length];
          const isExpanded = expanded === i;

          return (
            <Card
              key={i}
              className={`border ${color.border} ${color.bg} overflow-hidden transition-all duration-300`}
            >
              <div className="p-4 space-y-3">
                {/* Pivot header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full ${color.dot} flex-shrink-0 mt-0.5`} />
                    <div>
                      <p className="text-sm font-bold text-white">{pivot.title}</p>
                      <Badge className={`${color.badge} text-[10px] font-semibold mt-0.5`}>
                        {pivot.estimatedScoreLift} potential
                      </Badge>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpanded(isExpanded ? null : i)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0 mt-0.5"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Description (always visible) */}
                <p className="text-xs text-zinc-300 leading-relaxed">{pivot.description}</p>

                {/* Expanded: Rationale */}
                {isExpanded && (
                  <div className="pt-2 border-t border-white/5 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Why This Could Work
                        </p>
                        <p className="text-xs text-zinc-300 leading-relaxed">{pivot.rationale}</p>
                      </div>
                    </div>

                    {onTryPivot && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onTryPivot(pivot.description)}
                        className="w-full h-8 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white gap-1.5"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Try This Pivot
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
