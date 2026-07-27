'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PenLine, Cpu, FileSearch, Globe, Sparkles } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: PenLine,
    color: 'violet',
    title: 'Describe Your Idea',
    desc: "Tell us the problem you're solving and your proposed solution. Use guided questions or free-form input.",
  },
  {
    number: '02',
    icon: Cpu,
    color: 'indigo',
    title: 'AI Evaluates It',
    desc: '3 independent models score across Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation.',
  },
  {
    number: '03',
    icon: FileSearch,
    color: 'cyan',
    title: 'Get Deep Report',
    desc: 'Unlock a 10-section report with market sizing, competitive landscape, and go-to-market strategy.',
  },
  {
    number: '04',
    icon: Globe,
    color: 'emerald',
    title: 'Share & Get Votes',
    desc: 'Publish to the community board. Other builders upvote, comment, and suggest pivots.',
  },
];

const colorStyles: Record<string, {
  border: string;
  icon: string;
  hoverBorder: string;
  hoverShadow: string;
}> = {
  violet: {
    border: 'border-violet-500/40',
    icon: 'text-violet-500 dark:text-violet-400',
    hoverBorder: 'group-hover:border-violet-500/80',
    hoverShadow: 'group-hover:shadow-violet-500/10',
  },
  indigo: {
    border: 'border-indigo-500/40',
    icon: 'text-indigo-500 dark:text-indigo-400',
    hoverBorder: 'group-hover:border-indigo-500/80',
    hoverShadow: 'group-hover:shadow-indigo-500/10',
  },
  cyan: {
    border: 'border-cyan-500/40',
    icon: 'text-cyan-500 dark:text-cyan-400',
    hoverBorder: 'group-hover:border-cyan-500/80',
    hoverShadow: 'group-hover:shadow-cyan-500/10',
  },
  emerald: {
    border: 'border-emerald-500/40',
    icon: 'text-emerald-500 dark:text-emerald-400',
    hoverBorder: 'group-hover:border-emerald-500/80',
    hoverShadow: 'group-hover:shadow-emerald-500/10',
  },
};

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section id="how-it-works" ref={sectionRef} className="py-20 lg:py-28 border-t border-border bg-muted/20 dark:bg-zinc-950/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-4">
            <Sparkles className="h-4 w-4" />
            How It Works
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            From Idea to <span className="gradient-heading">Validated Report</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
            Four steps. Zero fluff. Get an honest AI evaluation, a deep strategic report, and real feedback from other builders.
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:block relative">
          <div className="absolute top-[2.75rem] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-violet-500/40 via-cyan-500/40 to-emerald-500/40" />
          
          <div className="grid grid-cols-4 gap-6 relative">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const styles = colorStyles[step.color];

              return (
                <div
                  key={step.title}
                  className={`group relative flex flex-col items-center transition-all duration-600 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className={`relative z-10 mx-auto w-14 h-14 rounded-full border-2 ${styles.border} bg-card dark:bg-zinc-950 flex items-center justify-center mb-4 transition-all duration-300 ${styles.hoverBorder} group-hover:shadow-lg ${styles.hoverShadow}`}>
                    <Icon className={`h-6 w-6 ${styles.icon}`} />
                  </div>
                  <div className={`text-[10px] font-black tracking-[0.2em] ${styles.icon} mb-1 text-center uppercase`}>
                    Step {step.number}
                  </div>
                  <h3 className="text-sm font-bold text-foreground text-center mb-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed max-w-[200px] mx-auto">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden relative pl-6">
          <div className="absolute left-10 top-4 bottom-12 w-[2px] bg-gradient-to-b from-violet-500/40 via-cyan-500/40 to-emerald-500/40" />
          
          <div className="space-y-8 relative pl-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const styles = colorStyles[step.color];

              return (
                <div
                  key={step.title}
                  className={`group relative transition-all duration-600 ease-out ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className={`absolute -left-16 top-1 z-10 w-12 h-12 rounded-full border-2 ${styles.border} bg-card dark:bg-zinc-950 flex items-center justify-center transition-all duration-300 ${styles.hoverBorder} group-hover:shadow-lg ${styles.hoverShadow}`}>
                    <Icon className={`h-5 w-5 ${styles.icon}`} />
                  </div>
                  
                  <div className="pt-0.5">
                    <div className={`text-[10px] font-black tracking-[0.2em] ${styles.icon} mb-1 uppercase`}>
                      Step {step.number}
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
