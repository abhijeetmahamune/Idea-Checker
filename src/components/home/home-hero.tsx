'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ChevronDown } from 'lucide-react';

export function HomeHero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Pentagon points generation helper
  const getPoints = (radius: number) => {
    const angles = [-90, -18, 54, 126, 198];
    return angles.map(angle => {
      const rad = (angle * Math.PI) / 180;
      return `${150 + radius * Math.cos(rad)},${150 + radius * Math.sin(rad)}`;
    }).join(' ');
  };

  // Data shape specific radius percentages
  const dataPercentages = [0.85, 0.90, 0.70, 0.75, 0.95];
  const dataPointsStr = [-90, -18, 54, 126, 198].map((angle, i) => {
    const radius = 120 * dataPercentages[i];
    const rad = (angle * Math.PI) / 180;
    return `${150 + radius * Math.cos(rad)},${150 + radius * Math.sin(rad)}`;
  }).join(' ');

  const dataPoints = [-90, -18, 54, 126, 198].map((angle, i) => {
    const radius = 120 * dataPercentages[i];
    const rad = (angle * Math.PI) / 180;
    return { x: 150 + radius * Math.cos(rad), y: 150 + radius * Math.sin(rad) };
  });

  const labelAngles = [-90, -18, 54, 126, 198];
  const labelNames = ["Feasibility", "Effectiveness", "Scalability", "Cost Efficiency", "Innovation"];
  const getLabelPos = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: 150 + radius * Math.cos(rad), y: 150 + radius * Math.sin(rad) };
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden pt-10 pb-20">
      {/* Ambient floating gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-500/8 dark:bg-violet-900/12 filter blur-[120px] animate-float-1" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/8 dark:bg-indigo-900/12 filter blur-[120px] animate-float-2" />
        <div className="absolute top-[30%] left-[50%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/6 dark:bg-cyan-900/8 filter blur-[100px] animate-float-3" />
      </div>

      <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
        
        {/* Badge pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 dark:bg-violet-950/40 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-300 backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Startup Validation</span>
          </div>
        </div>

        {/* Main heading */}
        <h1 className="font-display text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] sm:leading-[1.05] glow-heading max-w-4xl mx-auto">
          Stop Guessing.<br />
          Start <span className="gradient-heading">Validating.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-4 sm:mt-6">
          Get an unbiased AI evaluation of your startup idea — scored across 5 dimensions by 3 independent models simultaneously.
        </p>

        {/* Decorative Pentagon Radar Chart */}
        <div className="animate-subtle-pulse max-w-[240px] xs:max-w-[280px] sm:max-w-[320px] mx-auto my-6 sm:my-8 opacity-80">
          <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
            {/* Concentric pentagons */}
            <polygon points={getPoints(120)} stroke="oklch(0.68 0.22 270 / 0.15)" fill="none" strokeWidth="1" />
            <polygon points={getPoints(80)} stroke="oklch(0.68 0.22 270 / 0.15)" fill="none" strokeWidth="1" />
            <polygon points={getPoints(40)} stroke="oklch(0.68 0.22 270 / 0.15)" fill="none" strokeWidth="1" />
            
            {/* Axis lines */}
            {labelAngles.map((angle, i) => {
              const p = getLabelPos(angle, 120);
              return (
                <line key={i} x1="150" y1="150" x2={p.x} y2={p.y} stroke="oklch(0.68 0.22 270 / 0.15)" strokeWidth="1" />
              );
            })}

            {/* Data shape */}
            <polygon 
              points={dataPointsStr} 
              fill="oklch(0.68 0.22 270 / 0.12)" 
              stroke="oklch(0.68 0.22 270 / 0.6)" 
              strokeWidth="2" 
            />

            {/* Data shape glowing dots */}
            {dataPoints.map((point, i) => (
              <circle key={i} cx={point.x} cy={point.y} r="4" fill="#818CF8" />
            ))}

            {/* Labels */}
            {labelAngles.map((angle, i) => {
              // Push labels out a bit further than radius 120
              const labelRadius = 140;
              const p = getLabelPos(angle, labelRadius);
              let textAnchor: 'middle' | 'start' | 'end' = 'middle';
              let dy = "0.3em";
              
              if (angle === -90) { dy = "-0.2em"; }
              else if (angle === -18) { textAnchor = "start"; }
              else if (angle === 54) { textAnchor = "start"; dy = "0.8em"; }
              else if (angle === 126) { textAnchor = "end"; dy = "0.8em"; }
              else if (angle === 198) { textAnchor = "end"; }

              return (
                <text 
                  key={i} 
                  x={p.x} 
                  y={p.y} 
                  textAnchor={textAnchor}
                  dy={dy}
                  className="text-[10px] fill-muted-foreground font-medium"
                >
                  {labelNames[i]}
                </text>
              );
            })}
          </svg>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-xs sm:max-w-none mx-auto">
          <Link 
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 active:scale-[0.98] transition-all duration-200"
          >
            Validate Your Idea
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <button 
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto flex items-center justify-center gap-2 border border-border hover:border-violet-500/40 bg-card/60 backdrop-blur-sm text-foreground font-medium px-7 py-3.5 rounded-xl hover:bg-card transition-all duration-200"
          >
            See How It Works
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-6">
          <span className="text-xs text-muted-foreground font-medium">✦ No sign-up required</span>
          <span className="text-xs text-muted-foreground font-medium">✦ Free forever</span>
          <span className="text-xs text-muted-foreground font-medium">✦ 3 AI models</span>
        </div>

      </div>
    </div>
  );
}
