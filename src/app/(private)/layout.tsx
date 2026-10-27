import type { ReactNode } from 'react';
import { Navbar } from '@/shared/components/Navbar';
import { Footer } from '@/shared/components/Footer';

export default function PrivateLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar variant="private" />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">{children}</main>
      <Footer />
    </div>
  );
}
