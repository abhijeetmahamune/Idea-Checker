'use client';

import { useEffect, useRef, useState } from 'react';
import { Target, Zap, Users } from 'lucide-react';

export function ValueProps() {
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
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const props = [
    { 
      icon: Target, 
      colors: 'from-violet-500 to-indigo-500', 
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-500/10 border-violet-500/20',
      title: 'Unbiased Consensus', 
      desc: 'Three independent AI models eliminate single-model bias. No hallucinations, no favoritism — just honest, averaged evaluation.' 
    },
    { 
      icon: Zap, 
      colors: 'from-cyan-500 to-blue-500', 
      iconColor: 'text-cyan-500',
      iconBg: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Instant Validation', 
      desc: 'No sign-up required. Paste your idea, get a detailed evaluation in under 30 seconds. Save reports by creating a free account.' 
    },
    { 
      icon: Users, 
      colors: 'from-emerald-500 to-teal-500', 
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'Community Validated', 
      desc: 'Share your validated idea on the community board. Collect upvotes, ratings, and feedback from other founders and builders.' 
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 border-t border-border bg-muted/20 dark:bg-zinc-950/40">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 container mx-auto px-4 sm:px-6 lg:px-8">
        {props.map((prop, index) => {
          const Icon = prop.icon;
          return (
            <div 
              key={index}
              className={`relative p-6 rounded-2xl border border-border/60 dark:border-zinc-800/80 bg-card/70 dark:bg-zinc-950/60 backdrop-blur-sm overflow-hidden group hover:shadow-lg transition-all duration-500 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${prop.colors}`} />
              <div className={`h-11 w-11 rounded-xl ${prop.iconBg} border flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${prop.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{prop.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prop.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
