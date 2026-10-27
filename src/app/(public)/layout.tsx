import type { ReactNode } from 'react';
import { Navbar } from '@/shared/components/Navbar';
import { Footer } from '@/shared/components/Footer';

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar variant="public" />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
