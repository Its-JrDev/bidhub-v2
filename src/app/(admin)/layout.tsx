import type { ReactNode } from 'react';
import Link from 'next/link';
import { Navbar } from '@/shared/components/Navbar';
import { Footer } from '@/shared/components/Footer';

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-destructive text-destructive-foreground px-6 py-2.5 flex items-center justify-between text-xs font-medium">
        <div className="font-semibold flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Panel de Moderación y Administración de Categorías</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/admin" className="underline hover:no-underline">
            Gestión
          </Link>
          <Link href="/dashboard" className="underline hover:no-underline">
            Volver a Mi Panel
          </Link>
        </nav>
      </header>
      <Navbar variant="admin" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">{children}</main>
      <Footer />
    </div>
  );
}
