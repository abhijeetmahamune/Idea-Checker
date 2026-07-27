'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const DOTS = [
  { top: '15%', left: '12%', delay: '0.2s', duration: '3.2s' },
  { top: '25%', left: '85%', delay: '0.8s', duration: '2.8s' },
  { top: '45%', left: '78%', delay: '1.4s', duration: '3.5s' },
  { top: '65%', left: '18%', delay: '0.5s', duration: '2.5s' },
  { top: '75%', left: '88%', delay: '1.1s', duration: '3.8s' },
  { top: '35%', left: '22%', delay: '1.7s', duration: '3.0s' },
  { top: '80%', left: '42%', delay: '0.3s', duration: '2.7s' },
  { top: '20%', left: '65%', delay: '1.0s', duration: '3.4s' },
];

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-indigo-500/5 dark:via-violet-950/20 dark:to-indigo-950/20" />
      
      {DOTS.map((dot, i) => (
        <div 
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-violet-500/20 animate-dot-float"
          style={{
            top: dot.top,
            left: dot.left,
            animationDelay: dot.delay,
            animationDuration: dot.duration
          }}
        />
      ))}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
          Ready to Validate Your <br className="hidden sm:block" />
          <span className="gradient-heading">Next Big Idea?</span>
        </h2>
        
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed mt-4">
          Join thousands of founders who validate before they build. It's free, instant, and brutally honest.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <Link 
            href="/"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 active:scale-[0.98] transition-all duration-200 text-sm inline-flex items-center gap-2"
          >
            Start Evaluating <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="border border-border hover:border-violet-500/40 bg-card/60 backdrop-blur-sm text-foreground font-medium px-8 py-3.5 rounded-xl hover:bg-card transition-all duration-200 text-sm"
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </section>
  );
}
