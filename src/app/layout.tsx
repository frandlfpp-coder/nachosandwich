import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600', '900'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Control Nacho+ | Gestión Multi-Local',
  description: 'Sistema de Gestión Multi-Local para Nacho+',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${inter.variable} bg-background`} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="font-body overflow-x-hidden antialiased text-foreground">
        <ThemeProvider>
          <FirebaseClientProvider>
            <AppProvider>
              {children}
              <Toaster />
            </AppProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
