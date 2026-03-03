'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const [local, setLocal] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore, user: firebaseUser, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && firebaseUser) {
      router.push('/dashboard');
    }
  }, [firebaseUser, isUserLoading, router]);

  const handleAuthAction = async () => {
    if (!local || !password) {
      toast({ title: 'Falta Info', description: 'Por favor, selecciona un local e ingresa la contraseña.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const requiredPasswords: { [key: string]: string } = {
      nacho1: 'ignacio369',
      nacho2: '1234',
    };

    if (password !== requiredPasswords[local]) {
      toast({ title: 'Error', description: 'Contraseña incorrecta.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const email = `${local}@local.com`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: '¡Bienvenido de vuelta!' });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
          const localDocRef = doc(firestore, 'locals', newUser.uid);
          
          await setDoc(localDocRef, {
              id: newUser.uid,
              email: email,
              createdAt: serverTimestamp(),
          });
          
          toast({ title: '¡Cuenta Creada!', description: 'Hemos creado una nueva cuenta para tu local.' });
        } catch (creationError: any) {
          toast({ title: 'Error de Creación', description: `No se pudo crear la cuenta. ${creationError.message}`, variant: 'destructive' });
        }
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          toast({ title: 'Error', description: 'Local o contraseña incorrecta.', variant: 'destructive' });
      }
      else {
        toast({ title: 'Error de Autenticación', description: `Ocurrió un error inesperado: ${error.message}`, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading || firebaseUser) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div id="loading-spinner" className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-white text-[9px] tracking-widest">CARGANDO...</p>
          </div>
      </div>
    );
  }

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

        <div id="auth-inputs" className="space-y-3">
            <Select onValueChange={setLocal} value={local}>
              <SelectTrigger className="w-full p-5 bg-zinc-900 border-2 border-zinc-800 rounded-2xl outline-none text-white text-center text-sm focus:border-primary transition-all font-black h-auto">
                <SelectValue placeholder="SELECCIONA UN LOCAL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nacho1">NACHO1</SelectItem>
                <SelectItem value="nacho2">NACHO2</SelectItem>
              </SelectContent>
            </Select>
            <Input
              id="auth-password"
              type="password"
              placeholder="CONTRASEÑA"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuthAction()}
              className="w-full p-5 bg-zinc-900 border-2 border-zinc-800 rounded-2xl outline-none text-white text-center text-sm focus:border-primary transition-all font-black h-auto"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-3 pt-4">
              <Button
                id="btn-auth-action"
                onClick={handleAuthAction}
                className="w-full bg-primary hover:bg-lime-400 text-primary-foreground py-5 rounded-2xl text-lg shadow-xl active:scale-95 transition-all font-black h-auto"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'ENTRAR'}
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
