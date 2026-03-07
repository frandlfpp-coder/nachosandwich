'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { auth, firestore, user: firebaseUser, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && firebaseUser) {
      router.push('/dashboard');
    }
  }, [firebaseUser, isUserLoading, router]);

  const handleLocalSelect = async (selectedLocal: string) => {
    if (!selectedLocal) {
      return;
    }
    setIsLoading(true);
    setLocal(selectedLocal);

    const requiredPasswords: { [key: string]: string } = {
      nacho1: 'ignacio369',
      nacho2: '1234',
    };

    const passwordForLocal = requiredPasswords[selectedLocal];
    if (!passwordForLocal) {
        toast({ title: 'Error', description: 'Local no válido.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    
    const email = `${selectedLocal}@local.com`;

    try {
      await signInWithEmailAndPassword(auth, email, passwordForLocal);
      toast({ title: '¡Bienvenido de vuelta!' });
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          const { user: newUser } = await createUserWithEmailAndPassword(auth, email, passwordForLocal);
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
          toast({ title: 'Error', description: 'Hubo un problema de autenticación. Contacta a soporte si el problema persiste.', variant: 'destructive' });
          setIsLoading(false); 
      }
      else {
        toast({ title: 'Error de Autenticación', description: `Ocurrió un error inesperado: ${error.message}`, variant: 'destructive' });
        setIsLoading(false);
      }
    }
    // No set isLoading to false here, the loading screen will persist until redirect.
  };
  
  if (isUserLoading || isLoading || firebaseUser) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div id="loading-spinner" className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-white text-[9px] tracking-widest">INGRESANDO...</p>
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

        <div id="auth-inputs" className="space-y-3 pt-4">
            <Select onValueChange={handleLocalSelect} value={local}>
              <SelectTrigger className="w-full p-5 bg-zinc-900 border-2 border-zinc-800 rounded-2xl outline-none text-white text-center text-sm focus:border-primary transition-all font-black h-auto">
                <SelectValue placeholder="SELECCIONA UN LOCAL PARA ENTRAR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nacho1">NACHO1</SelectItem>
                <SelectItem value="nacho2">NACHO2</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>
    </div>
  );
}
