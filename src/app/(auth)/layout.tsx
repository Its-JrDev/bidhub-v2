import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card text-card-foreground shadow-lg rounded-xl p-8 border border-border">
        <div className="mb-6 text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight text-2xl">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm">
              BH
            </span>
            <span>BidHub</span>
          </Link>
          <p className="text-sm text-muted-foreground">Plataforma de subastas seguras de colección</p>
        </div>
        {children}
      </div>
    </div>
  );
}
