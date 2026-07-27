import { Navbar } from '@/components/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] rounded-full bg-violet-500/5 dark:bg-violet-900/5 filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 dark:bg-indigo-900/5 filter blur-[100px] pointer-events-none" />
        {children}
      </main>
      <footer className="border-t border-border py-6 bg-card/60 backdrop-blur-md text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Idea Checker. Private Workspace.
      </footer>
    </div>
  );
}
