import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeaturedSolutionsProps {
  solutions: {
    id: string;
    content: string;
    problemTitle: string;
    problemId: string;
    overallScore: number | null;
    createdAt: Date;
  }[];
}

export function FeaturedSolutions({ solutions }: FeaturedSolutionsProps) {
  if (!solutions || solutions.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-bold text-white">Featured Solutions</h2>
        </div>
        <p className="text-zinc-500 italic">No featured solutions yet</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-indigo-500" />
        <h2 className="text-xl font-bold text-white">Featured Solutions</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {solutions.map((solution) => {
          let scoreColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
          if (solution.overallScore !== null) {
            if (solution.overallScore >= 70) scoreColor = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            else if (solution.overallScore >= 40) scoreColor = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            else scoreColor = 'bg-red-500/10 text-red-500 border-red-500/20';
          }

          return (
            <Link
              key={solution.id}
              href={`/problems/${solution.problemId}/solutions/${solution.id}`}
              className="group flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-indigo-500/30 transition h-full"
            >
              <div className="text-xs text-zinc-500 mb-2 line-clamp-1">
                For: <span className="text-zinc-400">{solution.problemTitle}</span>
              </div>
              <p className="text-sm text-zinc-300 line-clamp-3 mb-4 flex-grow">
                {solution.content}
              </p>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/50">
                <span className="text-xs text-zinc-500">
                  {new Date(solution.createdAt).toLocaleDateString()}
                </span>
                {solution.overallScore !== null ? (
                  <Badge variant="outline" className={`${scoreColor} text-xs px-1.5 py-0.5 h-auto`}>
                    {solution.overallScore}/100
                  </Badge>
                ) : (
                  <span className="text-xs text-zinc-500">Not evaluated</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
