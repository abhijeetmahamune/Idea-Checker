import { Navbar } from '@/components/navbar';
import { LandingHero } from '@/components/landing-hero';
import Link from 'next/link';

export const metadata = {
  title: 'Idea Checker — Stop Guessing. Start Validating.',
  description:
    'Get an unbiased AI evaluation of your startup idea scored across 5 dimensions by 3 independent models simultaneously. No sign-up required.',
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-violet-500/30 selection:text-violet-200">
      {/* Server component — fetches user for navbar auth state */}
      <Navbar />

      {/* Client island — all interactive mode-selection logic */}
      <main className="flex-grow flex flex-col relative overflow-hidden">
        <LandingHero />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-7 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Idea Checker — Built for founders who want honest feedback.
          </p>
          <div className="flex gap-5 text-xs text-zinc-500">
            <Link href="/community" className="hover:text-white transition-colors">Community</Link>
            <Link href="/login" className="hover:text-white transition-colors">Dashboard</Link>
            <Link href="/register" className="hover:text-white transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
