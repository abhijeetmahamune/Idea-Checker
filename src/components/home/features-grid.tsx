'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Target, FileSearch, ShieldAlert, Flame, Merge, Zap } from 'lucide-react';

const features = [
  {
    icon: Cpu,
    color: 'violet',
    title: 'Multi-Model Consensus',
    desc: 'Three independent AI models evaluate your idea in parallel. Results are averaged to eliminate single-model bias and hallucinations.'
  },
  {
    icon: Target,
    color: 'indigo',
    title: '5-Dimension Scoring',
    desc: 'Feasibility, Effectiveness, Scalability, Cost Efficiency, and Innovation — each scored and visualized on a radar chart.'
  },
  {
    icon: FileSearch,
    color: 'cyan',
    title: '10-Section Deep Report',
    desc: 'McKinsey-style business validation report with TAM/SAM/SOM, competitive analysis, unit economics, and go-to-market strategy.'
  },
  {
    icon: ShieldAlert,
    color: 'amber',
    title: "Devil's Advocate",
    desc: 'A brutal, skeptical VC persona tears your idea apart. If it survives, it\'s worth building.'
  },
  {
    icon: Flame,
    color: 'rose',
    title: 'Stress Simulator',
    desc: 'Pressure-test your idea under extreme market scenarios — recession, competitor surge, regulatory crackdown, and more.'
  },
  {
    icon: Merge,
    color: 'emerald',
    title: 'Solution Merger',
    desc: 'Submit 2-4 solution variants and let AI synthesize the best parts into one superior, unified proposal.'
  }
];

const colorStyles: Record<string, {
  bg: string;
  border: string;
  hoverBorder: string;
  shadow: string;
  glow: string;
  icon: string;
  titleHover: string;
}> = {
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    hoverBorder: 'hover:border-violet-500/40',
    shadow: 'hover:shadow-violet-500/5',
    glow: 'bg-violet-500/5',
    icon: 'text-violet-500 dark:text-violet-400',
    titleHover: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
  },
  indigo: {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    hoverBorder: 'hover:border-indigo-500/40',
    shadow: 'hover:shadow-indigo-500/5',
    glow: 'bg-indigo-500/5',
    icon: 'text-indigo-500 dark:text-indigo-400',
    titleHover: 'group-hover:text-indigo-500 dark:group-hover:text-indigo-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    hoverBorder: 'hover:border-cyan-500/40',
    shadow: 'hover:shadow-cyan-500/5',
    glow: 'bg-cyan-500/5',
    icon: 'text-cyan-500 dark:text-cyan-400',
    titleHover: 'group-hover:text-cyan-500 dark:group-hover:text-cyan-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    hoverBorder: 'hover:border-amber-500/40',
    shadow: 'hover:shadow-amber-500/5',
    glow: 'bg-amber-500/5',
    icon: 'text-amber-500 dark:text-amber-400',
    titleHover: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    hoverBorder: 'hover:border-rose-500/40',
    shadow: 'hover:shadow-rose-500/5',
    glow: 'bg-rose-500/5',
    icon: 'text-rose-500 dark:text-rose-400',
    titleHover: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    hoverBorder: 'hover:border-emerald-500/40',
    shadow: 'hover:shadow-emerald-500/5',
    glow: 'bg-emerald-500/5',
    icon: 'text-emerald-500 dark:text-emerald-400',
    titleHover: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
  },
};

export function FeaturesGrid() {
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
    <section ref={sectionRef} className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 dark:bg-indigo-950/40 px-3 py-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400 mb-4">
            <Zap className="h-4 w-4" />
            Powerful Features
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Everything You Need to <span className="gradient-heading">Validate</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            From quick consensus scores to brutal VC teardowns — every tool you need to stress-test your startup idea.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 mt-14">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const styles = colorStyles[feature.color];

            return (
              <div
                key={feature.title}
                className={`group relative p-6 rounded-2xl border border-border/60 dark:border-zinc-800/80 bg-card/70 dark:bg-zinc-950/60 backdrop-blur-sm transition-all duration-300 ${styles.hoverBorder} hover:shadow-xl ${styles.shadow} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                  transitionDuration: '600ms',
                  transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
                }}
              >
                <div className={`absolute top-0 right-0 w-28 h-28 ${styles.glow} rounded-full filter blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`relative h-12 w-12 rounded-xl ${styles.bg} border ${styles.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`h-6 w-6 ${styles.icon}`} />
                </div>
                <h3 className={`text-base font-bold text-foreground transition-colors mb-2 ${styles.titleHover}`}>
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
