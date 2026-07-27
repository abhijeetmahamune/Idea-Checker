'use client';

import { useRef, useState } from 'react';
import { Cpu } from 'lucide-react';

export function ModelTicker() {
  const tickerRef = useRef<HTMLDivElement>(null);
  
  const models = [
    { name: 'Llama 3.3 70B', color: 'text-violet-400' },
    { name: 'GPT OSS 120B', color: 'text-indigo-400' },
    { name: 'Nemotron 120B', color: 'text-cyan-400' },
    { name: 'Gemini 2.5', color: 'text-emerald-400' },
    { name: 'OpenRouter Mesh', color: 'text-amber-400' }
  ];

  const handleMouseEnter = () => {
    if (tickerRef.current) {
      tickerRef.current.style.animationPlayState = 'paused';
    }
  };

  const handleMouseLeave = () => {
    if (tickerRef.current) {
      tickerRef.current.style.animationPlayState = 'running';
    }
  };

  return (
    <div className="border-t border-b border-border/60 bg-muted/30 dark:bg-black/40 py-6 overflow-hidden">
      <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70 mb-4">
        Powered by world-class AI models
      </div>
      
      <div 
        className="ticker-mask overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={tickerRef}
          className="flex animate-ticker whitespace-nowrap w-max"
          style={{ width: 'max-content' }}
        >
          {/* Double array for seamless infinite scroll */}
          {[...models, ...models].map((model, idx) => (
            <div key={idx} className="inline-flex items-center gap-3 px-8">
              <div className="h-8 w-8 rounded-lg bg-card border border-border/60 flex items-center justify-center">
                <Cpu className={`w-4 h-4 ${model.color}`} />
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {model.name}
              </span>
              
              {/* Separator dot */}
              <div className="h-1 w-1 rounded-full bg-muted-foreground/30 mx-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
