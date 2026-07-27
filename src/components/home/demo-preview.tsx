'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export function DemoPreview() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scores = [
    { name: 'Innovation', score: 92, color: 'from-violet-500 to-indigo-500' },
    { name: 'Feasibility', score: 85, color: 'from-indigo-500 to-blue-500' },
    { name: 'Effectiveness', score: 90, color: 'from-cyan-500 to-teal-500' },
    { name: 'Scalability', score: 78, color: 'from-emerald-500 to-green-500' },
    { name: 'Cost Efficiency', score: 72, color: 'from-amber-500 to-yellow-500' }
  ];

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 text-xs font-semibold uppercase tracking-wider mb-4">
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            See What You <span className="gradient-heading">Get</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Here's a real preview of your AI evaluation report — powered by multi-model consensus.
          </p>
        </div>

        <div 
          ref={sectionRef}
          className="max-w-3xl mx-auto rounded-2xl border border-border/60 dark:border-zinc-800 bg-card/80 dark:bg-zinc-950/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-violet-500/5 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-violet-500/8 rounded-full filter blur-[80px] pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-foreground">AI-Powered Resume Screening Platform</h3>
              <p className="text-xs text-muted-foreground mt-1">SaaS · HR Tech · B2B</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2 text-center">
                <span className="text-3xl font-black text-foreground">87</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mt-2">STRONG IDEA</span>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {scores.map((item, index) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{item.name}</span>
                  <span className="text-foreground font-bold">{item.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted dark:bg-zinc-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out`}
                    style={{ 
                      width: isVisible ? `${item.score}%` : '0%',
                      transitionDelay: `${index * 150}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6 pt-5 border-t border-border/50 relative z-10">
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 dark:bg-zinc-800/60 rounded-full px-3 py-1 border border-border/40">
              3 AI Models Agreed
            </span>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 dark:bg-zinc-800/60 rounded-full px-3 py-1 border border-border/40">
              Deep Report Available
            </span>
            <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 dark:bg-zinc-800/60 rounded-full px-3 py-1 border border-border/40">
              Pivot Suggestions Ready
            </span>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/"
            className="text-sm font-semibold text-violet-500 dark:text-violet-400 hover:text-violet-400 dark:hover:text-violet-300 transition-colors"
          >
            Try It Free — No Sign-Up Required →
          </Link>
        </div>
      </div>
    </section>
  );
}
