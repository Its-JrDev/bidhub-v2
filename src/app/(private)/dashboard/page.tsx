'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { formatCurrency, formatDate } from '@/shared/utils/format';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

interface UserAuction {
  id: string;
  title: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  endsAt: string;
  bidsCount: number;
  category: { id: string; name: string };
}

interface UserBid {
  id: string;
  amount: number;
  createdAt: string;
  isHighestBid: boolean;
  isWinning: boolean;
  auction: {
    id: string;
    title: string;
    currentPrice: number;
    status: string;
    endsAt: string;
    categoryName: string;
  };
}

export default function DashboardPage() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<'auctions' | 'bids'>('auctions');

  const [myAuctions, setMyAuctions] = useState<UserAuction[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);

  const [myBids, setMyBids] = useState<UserBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(true);

  const fetchMyAuctions = useCallback(async () => {
    try {
      const res = await fetch('/api/auctions?sellerId=me', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setMyAuctions(json.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAuctions(false);
    }
  }, []);

  const fetchMyBids = useCallback(async () => {
    try {
      const res = await fetch('/api/bids/me', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setMyBids(json.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingBids(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch('/api/auctions?sellerId=me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.data) setMyAuctions(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAuctions(false);
      });

    fetch('/api/bids/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.data) setMyBids(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingBids(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCancelAuction = async (auctionId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta subasta? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      const res = await fetch(`/api/auctions/${auctionId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Error al cancelar la subasta');
        return;
      }
      fetchMyAuctions();
    } catch {
      alert('Error al comunicarse con el servidor.');
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Panel de Usuario
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenido, <span className="font-semibold text-foreground">{user?.name}</span> ({user?.email})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/auctions/new">Publicar Nueva Subasta</Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('auctions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'auctions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Mis Subastas ({myAuctions.length})
        </button>
        <button
          onClick={() => setActiveTab('bids')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'bids'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Mis Ofertas ({myBids.length})
        </button>
      </div>

      {/* Content: Mis Subastas */}
      {activeTab === 'auctions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Regla 4: Máximo 5 subastas activas al mismo tiempo por vendedor.
            </span>
            <span>
              Activas:{' '}
              <strong className="text-foreground">
                {myAuctions.filter((a) => a.status === 'ACTIVE').length} / 5
              </strong>
            </span>
          </div>

          {loadingAuctions ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando tus subastas...
            </div>
          ) : myAuctions.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border space-y-4">
              <span className="text-4xl">🏷️</span>
              <h3 className="font-bold text-foreground">No tienes subastas publicadas</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Publica tus cartas, relojes, figuras o vinilos y comienza a recibir ofertas de coleccionistas.
              </p>
              <Button asChild>
                <Link href="/auctions/new">Crear mi primera subasta</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground uppercase bg-muted/40">
                  <tr>
                    <th className="py-3 px-4">Artículo</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Precio Actual</th>
                    <th className="py-3 px-4">Ofertas</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myAuctions.map((auc) => {
                    const canModify = auc.status === 'ACTIVE' && auc.bidsCount === 0;

                    return (
                      <tr key={auc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          <Link
                            href={`/auctions/${auc.id}`}
                            className="hover:text-primary transition-colors hover:underline"
                          >
                            {auc.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {auc.category.name}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(auc.currentPrice)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {auc.bidsCount}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={auc.status as any} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/auctions/${auc.id}`}>Ver</Link>
                          </Button>
                          {canModify && (
                            <>
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/auctions/${auc.id}/edit`}>Editar</Link>
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelAuction(auc.id)}
                              >
                                Cancelar
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Content: Mis Ofertas (Rule 20) */}
      {activeTab === 'bids' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Regla 20: Visualización exclusiva de todas tus ofertas realizadas en BidHub.
          </p>

          {loadingBids ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando tus ofertas...
            </div>
          ) : myBids.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border space-y-4">
              <span className="text-4xl">🔨</span>
              <h3 className="font-bold text-foreground">Aún no has realizado ofertas</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Explora el catálogo de coleccionables y participa en subastas activas.
              </p>
              <Button asChild>
                <Link href="/auctions">Explorar Catálogo</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground uppercase bg-muted/40">
                  <tr>
                    <th className="py-3 px-4">Subasta</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Tu Oferta</th>
                    <th className="py-3 px-4">Precio Actual</th>
                    <th className="py-3 px-4">Posición</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myBids.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        <Link
                          href={`/auctions/${b.auction.id}`}
                          className="hover:text-primary transition-colors hover:underline"
                        >
                          {b.auction.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {b.auction.categoryName}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {formatCurrency(b.amount)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatCurrency(b.auction.currentPrice)}
                      </td>
                      <td className="py-3 px-4">
                        {b.isWinning ? (
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                            🏆 ¡Ganador!
                          </Badge>
                        ) : b.isHighestBid ? (
                          <Badge className="bg-primary text-primary-foreground">
                            🌟 Oferta Líder
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Superado
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {formatDate(b.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/auctions/${b.auction.id}`}>Ver Subasta</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
