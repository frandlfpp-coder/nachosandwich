'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, isUserLoading } = useApp();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only redirect once loading is complete and we know there's no user
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  // Show a loading screen while authentication is in progress.
  // This prevents a flicker of the protected content before the redirect happens.
  if (isUserLoading || !user) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        <div id="loading-spinner" className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-white text-[9px] tracking-widest">CARGANDO...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden">
      {isMobile ? <MobileHeader /> : <Sidebar />}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        <div id="content-area" className={cn("flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar", isMobile ? "pb-24" : "pb-8")}>
          {children}
        </div>
      </main>
    </div>
  );
}
