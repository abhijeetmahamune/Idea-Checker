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
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-violet-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.problems}</div>
          <div className="text-xs text-zinc-400">Problems</div>
        </div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <Zap className="h-4 w-4 text-indigo-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.solutions}</div>
          <div className="text-xs text-zinc-400">Solutions</div>
        </div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <BarChart3 className="h-4 w-4 text-cyan-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.evaluations}</div>
          <div className="text-xs text-zinc-400">Evaluations</div>
        </div>
      </div>
      
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{stats.workspaces}</div>
          <div className="text-xs text-zinc-400">Workspaces</div>
        </div>
      </div>
    </div>
  );
}
