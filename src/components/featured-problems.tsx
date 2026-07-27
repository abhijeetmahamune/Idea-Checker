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
          <Lightbulb className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h2 className="font-display text-xl font-bold text-foreground">Featured Problems</h2>
        </div>
        <p className="text-muted-foreground italic text-sm">No featured problems yet</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        <h2 className="font-display text-xl font-bold text-foreground">Featured Problems</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {problems.map((problem) => (
          <Link
            key={problem.id}
            href={`/problems/${problem.id}`}
            className="group flex flex-col bg-card/80 dark:bg-zinc-950/60 border border-border rounded-xl p-5 hover:border-violet-500/40 transition-all h-full shadow-xs hover:shadow-md"
          >
            {problem.tags && problem.tags.length > 0 && (
              <div className="flex gap-2 mb-3">
                {problem.tags.slice(0, 2).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-muted text-muted-foreground text-xs font-normal border border-border">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <h3 className="font-display font-semibold text-foreground line-clamp-1 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{problem.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-4">{problem.description}</p>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(problem.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  {problem.solutionCount} solution{problem.solutionCount !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 group-hover:underline transition-colors">
                View →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
