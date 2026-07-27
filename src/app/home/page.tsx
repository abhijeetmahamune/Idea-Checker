import { Navbar } from '@/components/navbar';
import { HomeHero } from '@/components/home/home-hero';
import { ModelTicker } from '@/components/home/model-ticker';
import { FeaturesGrid } from '@/components/home/features-grid';
import { HowItWorks } from '@/components/home/how-it-works';
import { DemoPreview } from '@/components/home/demo-preview';
import { ValueProps } from '@/components/home/value-props';
import { FinalCTA } from '@/components/home/final-cta';
import { HomeFooter } from '@/components/home/home-footer';

export const metadata = {
  title: 'Idea Checker — Stop Guessing. Start Validating.',
  description:
    'Validate your startup idea with AI-powered multi-model consensus evaluation. Scored across 5 dimensions by 3 independent AI models simultaneously. Free, instant, and brutally honest.',
  openGraph: {
    title: 'Idea Checker — AI-Powered Startup Idea Validation',
    description:
      'Get an unbiased evaluation of your startup idea. 3 AI models. 5 scoring dimensions. 10-section deep report. No sign-up required.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-violet-500/30 selection:text-violet-200 transition-colors duration-200">
      {/* Navigation */}
      <Navbar />

      {/* Main content */}
      <main className="flex-grow flex flex-col">
        {/* Hero — Full viewport with animated pentagon & gradient orbs */}
        <HomeHero />

        {/* AI Model Ticker — Scrolling marquee of AI model names */}
        <ModelTicker />

        {/* Features Grid — 6 glassmorphic feature cards */}
        <FeaturesGrid />

        {/* How It Works — 4-step horizontal timeline */}
        <HowItWorks />

        {/* Demo Preview — Mock evaluation result card */}
        <DemoPreview />

        {/* Value Propositions — 3 value cards */}
        <ValueProps />

        {/* Final CTA — Gradient background call-to-action */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
