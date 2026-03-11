'use client';

import { ReactNode } from 'react';
import { useApp } from '@/contexts/AppContext';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Loader2, Zap } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { user, isUserLoading, isSwitchingLocal } = useApp();
  const isMobile = useIsMobile();

  // Show a loading screen while authentication is in progress or local is switching.
  if (isUserLoading || isSwitchingLocal) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div id="loading-spinner" className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-foreground text-[9px] tracking-widest">CARGANDO...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in after loading, show a welcome/selection screen
  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden">
        {isMobile ? <MobileHeader /> : <Sidebar />}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-secondary">
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="flex flex-col items-center gap-4 animate-pop">
              <div className="bg-primary w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/20">
                <Zap className="h-12 w-12 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-black tracking-tighter">Bienvenido a NACHO+</h1>
              <p className="text-muted-foreground max-w-xs">
                Por favor, selecciona un local desde el menú para comenzar.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden">
      {isMobile ? <MobileHeader /> : <Sidebar />}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-secondary">
        <div id="content-area" className={cn("flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar", isMobile ? "pb-24" : "pb-8")}>
          {children}
        </div>
      </main>
    </div>
  );
}
