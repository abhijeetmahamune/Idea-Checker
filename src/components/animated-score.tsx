'use client';

import { useCountUp } from '@/lib/use-count-up';
import { Progress } from '@/components/ui/progress';
import { Zap, CheckCircle2, Scale, DollarSign, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Allowed icon names passed as plain strings across the RSC boundary
export type DimIconName = 'Zap' | 'CheckCircle2' | 'Scale' | 'DollarSign' | 'Lightbulb';

const ICON_MAP: Record<DimIconName, LucideIcon> = {
  Zap,
  CheckCircle2,
  Scale,
  DollarSign,
  Lightbulb,
};

// ── Animated dimension bar (HTML, not SVG) ────────────────────────────────────
interface AnimatedDimBarProps {
  name: string;
  score: number;
  icon: DimIconName;
  color: string;
  desc: string;
  delay?: number;
}

export function AnimatedDimBar({ name, score, icon, color, desc, delay = 0 }: AnimatedDimBarProps) {
  const animated = useCountUp(score, 1000);
  const Icon = ICON_MAP[icon];

  return (
    <div
      className="space-y-1.5 animate-fade-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-foreground flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {name}
        </span>
        <span className="font-mono font-bold text-foreground">{animated} / 10</span>
      </div>
      <Progress value={animated * 10} className="h-2 bg-muted" indicatorClassName={color} />
      <p className="text-[11px] text-muted-foreground italic leading-tight">{desc}</p>
    </div>
  );
}
