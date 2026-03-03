'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

export default function LoginPage() {
  const [local, setLocal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const handleAuthAction = async () => {
    if (!local) {
      toast({ title: 'Falta Info', description: 'Por favor, ingresa el nombre del local.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const localLower = local.trim().toLowerCase();
    if (localLower === 'nacho1' || localLower === 'nacho2') {
      login({ local: localLower });
      toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente.' });
      router.push('/dashboard');
    } else {
      toast({ title: 'Error', description: 'Local incorrecto. Debe ser "nacho1" o "nacho2".', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm animate-pop">
        <div className="bg-primary w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-lime-500/20">
          <Zap className="h-12 w-12 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl text-white tracking-tighter mb-1">NACHO+ PRO</h1>
        <p className="text-primary text-[9px] tracking-[0.4em] mb-10 opacity-60">
          SISTEMA MULTI-LOCAL
        </p>

        {!isLoading ? (
          <div id="auth-inputs" className="space-y-3">
            <Input
              id="auth-local"
              type="text"
              placeholder="NOMBRE DEL LOCAL"
              value={local}
              onChange={e => setLocal(e.target.value)}
              className="w-full p-5 bg-zinc-900 border-2 border-zinc-800 rounded-2xl outline-none text-white text-center text-sm focus:border-primary transition-all font-black h-auto"
            />
            <div className="flex flex-col gap-3 pt-4">
              <Button
                id="btn-auth-action"
                onClick={handleAuthAction}
                className="w-full bg-primary hover:bg-lime-400 text-primary-foreground py-5 rounded-2xl text-lg shadow-xl active:scale-95 transition-all font-black h-auto"
              >
                ENTRAR
              </Button>
            </div>
          </div>
        ) : (
          <div id="loading-spinner" className="flex flex-col items-center gap-4 mt-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-white text-[9px] tracking-widest">VERIFICANDO...</p>
          </div>
        )}
      </div>
    </div>
  );
}
