'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreateAuctionForm } from '@/features/auctions/components/CreateAuctionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditAuctionPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: loadingUser } = useCurrentUser();

  const [auction, setAuction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/auctions/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Subasta no encontrada');
        }
        return json.data;
      })
      .then((data) => {
        if (!active) return;
        setAuction(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading || loadingUser) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Cargando subasta...
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-destructive">Error</h2>
        <p className="text-sm text-muted-foreground">{error || 'No se pudo cargar la subasta.'}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al Panel</Link>
        </Button>
      </div>
    );
  }

  // Rule 19: Security validation
  const isSeller = user && user.userId === auction.seller.id;
  if (!isSeller && user?.role !== 'ADMIN') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-destructive">Acceso Denegado (Regla 19)</h2>
        <p className="text-sm text-muted-foreground">
          No tienes permisos para editar la subasta de otro usuario.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Volver al Panel</Link>
        </Button>
      </div>
    );
  }

  // Rule 5: Only editable if active and no bids
  const canEdit = auction.status === 'ACTIVE' && auction.bids.length === 0;
  if (!canEdit) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-amber-600">Edición no permitida (Regla 5)</h2>
        <p className="text-sm text-muted-foreground">
          {auction.bids.length > 0
            ? 'Esta subasta ya ha recibido ofertas y no puede ser modificada.'
            : 'Esta subasta no se encuentra activa.'}
        </p>
        <Button asChild variant="outline">
          <Link href={`/auctions/${id}`}>Ver Subasta</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/auctions/${id}`}>← Cancelar y volver al artículo</Link>
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Editar Subasta
          </CardTitle>
          <CardDescription>
            Puedes modificar la información del artículo mientras no existan ofertas registradas (Regla 5).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAuctionForm
            auctionId={id}
            isEditing={true}
            defaultValues={{
              title: auction.title,
              description: auction.description,
              categoryId: auction.categoryId || auction.category.id,
              startingPrice: auction.startingPrice,
              minIncrement: auction.minIncrement,
              imageUrl: auction.imageUrl || '',
              endsAt: new Date(auction.endsAt).toISOString().slice(0, 16),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
