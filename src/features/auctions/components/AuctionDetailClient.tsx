'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';
import { CountdownTimer } from '@/shared/components/CountdownTimer';
import { BidForm } from '@/features/bids/components/BidForm';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

export interface AuctionDetailProps {
  initialAuction: {
    id: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    startingPrice: number;
    currentPrice: number;
    minIncrement: number;
    endsAt: string;
    status: string;
    cancellationReason?: string | null;
    category: { id: string; name: string };
    seller: { id: string; name: string; email: string };
    winner?: { id: string; name: string } | null;
    bids: Array<{
      id: string;
      amount: number;
      createdAt: string;
      bidderName: string;
      isOwnBid: boolean;
    }>;
  };
}

export function AuctionDetailClient({ initialAuction }: AuctionDetailProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [auction, setAuction] = useState(initialAuction);
  const [bids, setBids] = useState(initialAuction.bids);

  // Admin moderation modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Seller cancel action
  const [sellerCancelLoading, setSellerCancelLoading] = useState(false);

  const isSeller = Boolean(user && user.userId === auction.seller.id);
  const isAdmin = user?.role === 'ADMIN';
  const isActive = auction.status === 'ACTIVE';
  const hasBids = bids.length > 0;
  const isHighestBidder = Boolean(
    user && bids.length > 0 && bids[0].isOwnBid
  );

  const refreshAuctionData = async () => {
    try {
      const res = await fetch(`/api/auctions/${auction.id}`);
      if (res.ok) {
        const json = await res.json();
        setAuction(json.data);
        setBids(json.data.bids || []);
      }
    } catch {
      // Ignore poll error
    }
  };

  const handleBidSuccess = (data: { currentPrice: number; endsAt: string; extended: boolean }) => {
    setAuction((prev) => ({
      ...prev,
      currentPrice: data.currentPrice,
      endsAt: data.endsAt,
    }));
    refreshAuctionData();
    router.refresh();
  };

  const handleSellerCancel = async () => {
    if (!confirm('¿Estás seguro de cancelar esta subasta? Esta acción no se puede deshacer.')) {
      return;
    }

    setSellerCancelLoading(true);
    try {
      const res = await fetch(`/api/auctions/${auction.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Error al cancelar la subasta');
        return;
      }
      setAuction((prev) => ({ ...prev, status: 'CANCELLED' }));
      router.refresh();
    } catch {
      alert('Error de conexión al cancelar la subasta.');
    } finally {
      setSellerCancelLoading(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('El motivo de cancelación es obligatorio.');
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/admin/auctions/${auction.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCancelError(json.error || 'Error al moderar la subasta.');
        return;
      }

      setCancelModalOpen(false);
      setAuction((prev) => ({
        ...prev,
        status: 'CANCELLED',
        cancellationReason: cancelReason,
      }));
      router.refresh();
    } catch {
      setCancelError('Error al comunicarse con el servidor.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner for Closed / Cancelled states */}
      {auction.status === 'CANCELLED' && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
          <h3 className="font-semibold text-lg">Subasta Cancelada</h3>
          <p className="text-sm mt-1">
            {auction.cancellationReason
              ? `Motivo de cancelación: ${auction.cancellationReason}`
              : 'Esta subasta fue cancelada y no admite más ofertas.'}
          </p>
        </div>
      )}

      {auction.status === 'CLOSED' && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <h3 className="font-semibold text-lg">Subasta Finalizada con Éxito</h3>
          <p className="text-sm mt-1">
            {auction.winner
              ? `Ganador: ${auction.winner.name} con una oferta final de ${formatCurrency(auction.currentPrice)}.`
              : `Finalizada con una oferta ganadora de ${formatCurrency(auction.currentPrice)}.`}
          </p>
        </div>
      )}

      {auction.status === 'DESERTED' && (
        <div className="p-4 rounded-xl border border-muted bg-muted/60 text-muted-foreground">
          <h3 className="font-semibold text-lg">Subasta Desierta</h3>
          <p className="text-sm mt-1">
            Llegó la fecha de cierre sin recibir ninguna oferta.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image + Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative aspect-video w-full bg-muted flex items-center justify-center overflow-hidden">
              {auction.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={auction.imageUrl}
                  alt={auction.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-8">
                  <span className="text-4xl">📦</span>
                  <span className="text-sm mt-2">Sin imagen disponible</span>
                </div>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">{auction.category.name}</Badge>
                <StatusBadge status={auction.status as any} />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {auction.title}
              </h1>

              <div className="prose dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
                {auction.description}
              </div>

              <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
                <div>
                  Vendedor: <span className="font-medium text-foreground">{auction.seller.name}</span>
                </div>
                <div>
                  ID: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{auction.id.slice(0, 8)}</code>
                </div>
              </div>
            </div>
          </div>

          {/* Bid History Table (Rule 18: Masked bidders) */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                Historial de Ofertas ({bids.length})
              </h2>
              <span className="text-xs text-muted-foreground">
                Regla de privacidad: identidades protegidas
              </span>
            </div>

            {bids.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                No hay ofertas registradas aún. ¡Sé el primero en ofertar!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs text-muted-foreground uppercase bg-muted/30">
                    <tr>
                      <th className="py-2.5 px-3">Postor</th>
                      <th className="py-2.5 px-3">Monto</th>
                      <th className="py-2.5 px-3">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bids.map((b, index) => (
                      <tr
                        key={b.id}
                        className={index === 0 ? 'bg-primary/5 font-medium' : ''}
                      >
                        <td className="py-2.5 px-3 flex items-center gap-2">
                          {b.bidderName}
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-semibold">
                              Líder
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {formatCurrency(b.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground">
                          {formatDate(b.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing, Timer & Bid Form */}
        <div className="space-y-6">
          {/* Card: Current Bid & Countdown */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {hasBids ? 'Oferta actual' : 'Precio inicial'}
              </p>
              <div className="text-3xl font-black text-foreground mt-1">
                {formatCurrency(auction.currentPrice)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Incremento mínimo: {formatCurrency(auction.minIncrement)}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/80">
              <CountdownTimer endsAt={auction.endsAt} />
            </div>

            {/* Bid Action Form */}
            <div className="pt-2">
              <BidForm
                auctionId={auction.id}
                currentPrice={auction.currentPrice}
                minIncrement={auction.minIncrement}
                hasBids={hasBids}
                isSeller={isSeller}
                isHighestBidder={isHighestBidder}
                isAuctionActive={isActive}
                isLoggedIn={Boolean(user)}
                onBidSuccess={handleBidSuccess}
              />
            </div>
          </div>

          {/* Seller Controls (Rules 5 & 14) */}
          {isSeller && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Gestión de tu Subasta
              </h3>
              <p className="text-xs text-muted-foreground">
                Como vendedor, puedes editar o cancelar tu subasta únicamente mientras no tenga ofertas (Reglas 5 y 14).
              </p>

              <div className="flex flex-col gap-2 pt-1">
                {isActive && !hasBids ? (
                  <>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/auctions/${auction.id}/edit`}>Editar Subasta</Link>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={handleSellerCancel}
                      disabled={sellerCancelLoading}
                    >
                      {sellerCancelLoading ? 'Cancelando...' : 'Cancelar Subasta'}
                    </Button>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    {hasBids
                      ? 'No es posible editar o cancelar porque ya recibió ofertas.'
                      : 'La subasta no está activa.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admin Moderation Controls (Rule 15) */}
          {isAdmin && isActive && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-destructive">
                Moderación de Administrador
              </h3>
              <p className="text-xs text-muted-foreground">
                Regla 15: Como administrador puedes cancelar cualquier subasta activa indicando un motivo obligatorio.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setCancelModalOpen(true)}
              >
                Moderar: Cancelar Subasta
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Cancellation Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Subasta (Moderación)</DialogTitle>
            <DialogDescription>
              Por favor indica el motivo por el cual cancelas esta subasta. Quedará registrado en la base de datos (Regla 15).
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <div className="p-3 text-sm rounded bg-destructive/15 text-destructive border border-destructive/20">
              {cancelError}
            </div>
          )}

          <div className="space-y-2 my-2">
            <Label htmlFor="admin-reason">Motivo de cancelación</Label>
            <Input
              id="admin-reason"
              placeholder="Ej: Infracción a los términos de servicio..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelLoading}
            >
              Cerrar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleAdminCancel}
              disabled={cancelLoading || !cancelReason.trim()}
            >
              {cancelLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
