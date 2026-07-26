import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeaturedProblemsProps {
  problems: {
    id: string;
    title: string;
    description: string;
    tags: string[] | null;
    solutionCount: number;
    createdAt: Date;
  }[];
}

export function FeaturedProblems({ problems }: FeaturedProblemsProps) {
  if (!problems || problems.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-violet-500" />
          <h2 className="text-xl font-bold text-white">Featured Problems</h2>
        </div>
        <p className="text-zinc-500 italic">No featured problems yet</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-violet-500" />
        <h2 className="text-xl font-bold text-white">Featured Problems</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {problems.map((problem) => (
          <Link
            key={problem.id}
            href={`/problems/${problem.id}`}
            className="group flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-violet-500/30 transition h-full"
          >
            {problem.tags && problem.tags.length > 0 && (
              <div className="flex gap-2 mb-3">
                {problem.tags.slice(0, 2).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700 text-xs font-normal border-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <h3 className="font-semibold text-white line-clamp-1 mb-2">{problem.title}</h3>
            <p className="text-sm text-zinc-400 line-clamp-2 flex-grow mb-4">{problem.description}</p>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/50">
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500">
                  {new Date(problem.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-zinc-400">
                  {problem.solutionCount} solution{problem.solutionCount !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
                View →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
