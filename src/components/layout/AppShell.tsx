'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user } = useApp();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user === null) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
        {/* Optional: Add a loading spinner here */}
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
