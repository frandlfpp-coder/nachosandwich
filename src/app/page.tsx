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
  // isUserLoading and firebaseUser are used to show loading on initial page load or if already logged in.
  const { auth, firestore, user: firebaseUser, isUserLoading } = useFirebase();

  // This effect handles redirecting an already logged-in user.
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
    const email = `${selectedLocal}@local.com`;
    
    if (!passwordForLocal) {
        toast({ title: 'Error', description: 'Local no válido.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, passwordForLocal);
      toast({ title: '¡Bienvenido de vuelta!' });
      // On success, we don't set isLoading to false. The loading screen will persist
      // until the useEffect hook redirects, preventing a UI flicker.
    } catch (signInError: any) {
      if (signInError.code === 'auth/user-not-found') {
        // If user doesn't exist, try to create a new one.
        try {
          const { user: newUser } = await createUserWithEmailAndPassword(auth, email, passwordForLocal);
          
          await setDoc(doc(firestore, 'locals', newUser.uid), {
              id: newUser.uid,
              email: email,
              createdAt: serverTimestamp(),
          });
          
          toast({ title: '¡Cuenta Creada!', description: 'Hemos creado una nueva cuenta para tu local.' });
          // Let the useEffect hook handle redirection.
        } catch (signUpError: any) {
          // This catches errors from both createUserWithEmailAndPassword and setDoc.
          toast({
            variant: "destructive",
            title: 'Error al Registrar',
            description: `No se pudo crear la cuenta nueva. ${signUpError.message}`,
          });
          setIsLoading(false); // IMPORTANT: Reset loading state on failure.
        }
      } else {
        // Handle all other sign-in errors (e.g., wrong password).
        toast({
          variant: "destructive",
          title: 'Error de Autenticación',
          description: "La contraseña es incorrecta o ha ocurrido un problema.",
        });
        setIsLoading(false); // IMPORTANT: Reset loading state on failure.
      }
    }
  };
  
  // Show loading screen if:
  // 1. We are checking the initial auth state (`isUserLoading`).
  // 2. A login attempt is in progress (`isLoading`).
  // 3. The user has successfully logged in (`firebaseUser`) and we are waiting for redirect.
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
