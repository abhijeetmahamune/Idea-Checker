import Link from 'next/link';
import { LightbulbIcon } from 'lucide-react';

export function HomeFooter() {
  return (
    <footer className="relative z-10 border-t border-border py-12 bg-card/40 dark:bg-zinc-950/60 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          <div className="space-y-3">
            <Link href="/" className="flex items-center space-x-2 mb-3">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 p-2 text-white shadow-md shadow-violet-500/20">
                <LightbulbIcon className="h-5 w-5" />
              </div>
              <span className="font-display font-bold text-xl gradient-heading">Idea Checker</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              Stop guessing. Start validating. AI-powered startup idea evaluation.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Product</h3>
            <ul className="space-y-1">
              <li><Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Evaluate Idea</Link></li>
              <li><Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Dashboard</Link></li>
              <li><Link href="/community" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Community</Link></li>
              <li><Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Deep Reports</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Features</h3>
            <ul className="space-y-1">
              <li><Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Multi-Model Consensus</Link></li>
              <li><Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Devil's Advocate</Link></li>
              <li><Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Stress Simulator</Link></li>
              <li><Link href="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Solution Merger</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Account</h3>
            <ul className="space-y-1">
              <li><Link href="/register" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Sign Up</Link></li>
              <li><Link href="/login" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Login</Link></li>
              <li><Link href="/dashboard" className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1">Dashboard</Link></li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Idea Checker — Built for founders who want honest feedback.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with <span className="text-red-500">♥</span> by Abhijeet
          </p>
        </div>
      </div>
    </footer>
  );
}
