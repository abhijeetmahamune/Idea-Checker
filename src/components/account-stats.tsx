import { Lightbulb, Zap, BarChart3, Users } from 'lucide-react';

interface AccountStatsProps {
  stats: {
    problems: number;
    solutions: number;
    evaluations: number;
    workspaces: number;
  };
}

export function AccountStats({ stats }: AccountStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-card/80 dark:bg-zinc-950/60 border border-border rounded-xl p-4 flex flex-col gap-2 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-foreground">{stats.problems}</div>
          <div className="text-xs text-muted-foreground">Problems</div>
        </div>
      </div>
      
      <div className="bg-card/80 dark:bg-zinc-950/60 border border-border rounded-xl p-4 flex flex-col gap-2 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-indigo-500/15 flex items-center justify-center">
          <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-foreground">{stats.solutions}</div>
          <div className="text-xs text-muted-foreground">Solutions</div>
        </div>
      </div>
      
      <div className="bg-card/80 dark:bg-zinc-950/60 border border-border rounded-xl p-4 flex flex-col gap-2 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-cyan-500/15 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-foreground">{stats.evaluations}</div>
          <div className="text-xs text-muted-foreground">Evaluations</div>
        </div>
      </div>
      
      <div className="bg-card/80 dark:bg-zinc-950/60 border border-border rounded-xl p-4 flex flex-col gap-2 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-foreground">{stats.workspaces}</div>
          <div className="text-xs text-muted-foreground">Workspaces</div>
        </div>
      </div>
    </div>
  );
}
