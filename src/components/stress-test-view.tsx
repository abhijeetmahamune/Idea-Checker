'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShieldAlert, BrainCircuit, Loader2, Sparkles, CheckCircle2, ChevronRight, Play, AlertCircle, ArrowUpRight } from 'lucide-react';

interface SimulationItem {
  id: string;
  scenario: string;
  resilienceScore: number;
  feedback: {
    analysis: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  createdAt: Date;
}

interface StressTestViewProps {
  solutionId: string;
  initialSimulations: SimulationItem[];
}

export function StressTestView({ solutionId, initialSimulations }: StressTestViewProps) {
  const router = useRouter();
  const [simulations, setSimulations] = useState<SimulationItem[]>(initialSimulations);
  const [activeSimId, setActiveSimId] = useState<string | null>(
    initialSimulations.length > 0 ? initialSimulations[0].id : null
  );

  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const presets = [
    { label: '50% Budget Cut', text: 'What if our initial launch budget is cut by 50%?' },
    { label: 'Competitor Launch', text: 'What if a major competitor releases a similar product for free?' },
    { label: '5x Host Costs', text: 'What if our primary API provider increases hosting costs by 5x?' },
    { label: 'Double CAC', text: 'What if customer acquisition cost (CAC) doubles in the target market?' },
  ];

  const handlePresetClick = (text: string) => {
    setScenario(text);
  };

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scenario.trim().length < 10) {
      toast.error('Scenario description must be at least 10 characters long.');
      return;
    }

    setLoading(true);

    startTransition(async () => {
      try {
        const response = await fetch('/api/simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            solutionId,
            scenario,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to execute stress simulation.');
        }

        toast.success('Stress simulation completed!');
        
        const newSimItem: SimulationItem = {
          id: data.simulationId,
          scenario,
          resilienceScore: data.simulation.resilienceScore,
          feedback: data.simulation,
          createdAt: new Date(),
        };

        // Append to list, set active, and reset form
        setSimulations((prev) => [newSimItem, ...prev]);
        setActiveSimId(data.simulationId);
        setScenario('');
        
        // Refresh page so server states are aligned
        router.refresh();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'An error occurred during simulation.');
      } finally {
        setLoading(false);
      }
    });
  };

  // Find currently active simulation
  const activeSim = simulations.find((s) => s.id === activeSimId);

  // Score color helpers
  const getResilienceColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  };

  const getResilienceBorderGlow = (score: number) => {
    if (score >= 80) return 'shadow-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'shadow-amber-500/10 border-amber-500/20';
    return 'shadow-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column (8 cols): Report Display or Empty State */}
      <div className="lg:col-span-8 space-y-6">
        {loading ? (
          <Card className="border-zinc-900 bg-zinc-950 p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[400px]">
            <div className="relative flex items-center justify-center">
              <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-violet-400 opacity-20" />
              <BrainCircuit className="h-10 w-10 text-violet-400 animate-pulse relative" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Running Stress Simulation...</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-normal">
                Nvidia Nemetron is modeling risk factors, projecting resource exhaustion rates, and evaluating solution adaptability.
              </p>
            </div>
          </Card>
        ) : activeSim ? (
          <div className="space-y-6">
            {/* Simulation Header / Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              <Card className={`md:col-span-4 flex flex-col justify-center items-center text-center p-6 border ${getResilienceBorderGlow(activeSim.resilienceScore)} bg-zinc-950 shadow-xl`}>
                <div className="relative flex items-center justify-center w-28 h-28 rounded-full border-4 border-zinc-800">
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-black tracking-tight">{activeSim.resilienceScore}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Resilience</span>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-xs text-zinc-400 font-semibold block">Scenario Survival Rating</span>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-1">
                    Evaluated based on resource, operational, and market constraints.
                  </p>
                </div>
              </Card>

              {/* Written Scenario Description and Analysis */}
              <Card className="md:col-span-8 border-zinc-900 bg-zinc-950 p-6 flex flex-col justify-between shadow-xl">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">Simulated Scenario:</span>
                    <h3 className="text-base font-bold text-white italic leading-relaxed">
                      &ldquo;{activeSim.scenario}&rdquo;
                    </h3>
                  </div>
                  <div className="border-t border-zinc-900 my-2" />
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Risk Impact Analysis:</span>
                    <p className="text-zinc-300 text-sm leading-relaxed mt-1">{activeSim.feedback.analysis}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Strengths & Vulnerabilities under Scenario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mitigating Factors */}
              <Card className="border-emerald-500/10 bg-zinc-950/60 p-5 shadow-lg">
                <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Mitigating Factors / Strengths
                </h3>
                <ul className="space-y-2">
                  {activeSim.feedback.strengths.map((str, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-emerald-500">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Vulnerabilities */}
              <Card className="border-rose-500/10 bg-zinc-950/60 p-5 shadow-lg">
                <h3 className="text-sm font-bold text-rose-400 mb-3 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" />
                  Key Vulnerabilities / Risks
                </h3>
                <ul className="space-y-2">
                  {activeSim.feedback.weaknesses.map((weak, i) => (
                    <li key={i} className="text-xs text-zinc-300 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-rose-500">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="border-zinc-900 bg-zinc-950 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full filter blur-2xl pointer-events-none" />
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-400" />
                Vulnerability Adaptation Recommendations
              </h3>
              <ul className="space-y-2.5">
                {activeSim.feedback.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-violet-400 font-mono font-bold">0{i+1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : (
          <Card className="border-dashed border-zinc-900 bg-zinc-950/10 p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[400px]">
            <div className="rounded-lg bg-zinc-900 p-4 text-zinc-500">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No stress simulations run yet</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-normal mx-auto">
                Test how your solution survives under resource depletion, competitor pivots, or price hikes. Configure a test scenario on the right.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Right Column (4 cols): Simulation Controller & Presets */}
      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
        {/* Run Test Controller */}
        <Card className="border-zinc-900 bg-zinc-950 shadow-xl p-5">
          <CardHeader className="p-0 pb-3 mb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold">Simulator Controls</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <form onSubmit={handleRunTest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenario" className="text-xs font-semibold text-zinc-400">
                  Risk Scenario
                </Label>
                <textarea
                  id="scenario"
                  placeholder="e.g. What if key API providers charge $0.05 per API call?"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  disabled={loading}
                  rows={4}
                  required
                  className="w-full text-xs bg-background/50 border border-zinc-900 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-y text-white placeholder-zinc-600"
                />
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Presets:</span>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="ghost"
                      onClick={() => handlePresetClick(preset.text)}
                      disabled={loading}
                      className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white justify-start py-1 px-2.5 h-auto text-left leading-snug hover:bg-zinc-800 truncate"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || scenario.trim().length < 10}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs py-5 flex items-center justify-center gap-1 shadow-md shadow-violet-600/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-white" />
                    Run Stress Test
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Previous Simulation Runs List */}
        {simulations.length > 0 && (
          <Card className="border-zinc-900 bg-zinc-950/40 p-4">
            <h4 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Simulation History</h4>
            <div className="space-y-2">
              {simulations.map((s) => {
                const isActive = s.id === activeSimId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSimId(s.id)}
                    disabled={loading}
                    className={`w-full text-left p-2.5 rounded-md border text-xs transition-all flex justify-between items-center ${
                      isActive
                        ? 'bg-zinc-900 border-violet-500/30 text-white'
                        : 'bg-zinc-950/20 border-transparent hover:border-zinc-900 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="truncate pr-3 italic">&ldquo;{s.scenario}&rdquo;</span>
                    <Badge className={`font-mono text-[10px] font-bold ${
                      s.resilienceScore >= 80
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : s.resilienceScore >= 50
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {s.resilienceScore}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
