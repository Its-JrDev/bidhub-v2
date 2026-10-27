'use client';

import Link from 'next/link';
import { CreateAuctionForm } from '@/features/auctions/components/CreateAuctionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export default function NewAuctionPage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">← Volver al Panel</Link>
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Publicar Artículo para Subasta
          </CardTitle>
          <CardDescription>
            Completa los detalles de tu artículo de colección. Recuerda que la duración debe ser de entre 1 hora y 7 días (Regla 2).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAuctionForm />
        </CardContent>
      </Card>
    </div>
  );
}
