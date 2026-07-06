import { Navbar } from '@/components/navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] rounded-full bg-violet-900/5 filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-900/5 filter blur-[100px] pointer-events-none" />
        {children}
      </main>
      <footer className="border-t border-zinc-900 py-6 bg-black text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} Idea Checker. Private Workspace.
      </footer>
    </div>
  );
}
