'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';
import { formatCurrency, formatDate } from '@/shared/utils/format';

interface AdminMetrics {
  totalUsers: number;
  totalAuctions: number;
  totalBids: number;
  totalCategories: number;
  breakdown: {
    active: number;
    closed: number;
    deserted: number;
    cancelled: number;
  };
}

interface CategoryRow {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    auctions: number;
  };
}

interface AdminAuctionRow {
  id: string;
  title: string;
  startingPrice: number;
  currentPrice: number;
  status: string;
  endsAt: string;
  bidsCount: number;
  cancellationReason?: string | null;
  category: { id: string; name: string };
  seller: { id: string; name: string };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'categories' | 'moderation'>('metrics');

  // Metrics state
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Categories state
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Auctions moderation state
  const [auctions, setAuctions] = useState<AdminAuctionRow[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(true);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<AdminAuctionRow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      if (res.ok) {
        const json = await res.json();
        setMetrics(json.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchAuctions = useCallback(async () => {
    try {
      const res = await fetch('/api/auctions');
      if (res.ok) {
        const json = await res.json();
        setAuctions(json.data || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingAuctions(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch('/api/admin/metrics')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.data) setMetrics(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingMetrics(false);
      });

    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.data) setCategories(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    fetch('/api/auctions')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.data) setAuctions(json.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAuctions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Open modal to create or edit category
  const handleOpenCategoryModal = (cat?: CategoryRow) => {
    setCatError(null);
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatDesc(cat.description || '');
    } else {
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
    }
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      setCatError('El nombre de la categoría es obligatorio.');
      return;
    }

    setCatSaving(true);
    setCatError(null);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() || undefined }),
      });

      const json = await res.json();
      if (!res.ok) {
        setCatError(json.error || 'Error al guardar categoría');
        return;
      }

      setCategoryModalOpen(false);
      fetchCategories();
      fetchMetrics();
    } catch {
      setCatError('Error de red al guardar categoría.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryRow) => {
    // Rule 17 check
    if (cat._count && cat._count.auctions > 0) {
      alert(`Regla 17: No se puede eliminar "${cat.name}" porque tiene ${cat._count.auctions} subasta(s) asociada(s).`);
      return;
    }

    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Error al eliminar categoría');
        return;
      }
      fetchCategories();
      fetchMetrics();
    } catch {
      alert('Error al comunicarse con el servidor.');
    }
  };

  // Open moderation cancel dialog (Rule 15)
  const handleOpenModeration = (auc: AdminAuctionRow) => {
    setSelectedAuction(auc);
    setCancelReason('');
    setModerationError(null);
    setModerationModalOpen(true);
  };

  const handleConfirmModerationCancel = async () => {
    if (!selectedAuction) return;
    if (!cancelReason.trim()) {
      setModerationError('El motivo de cancelación es obligatorio (Regla 15).');
      return;
    }

    setModerationSaving(true);
    setModerationError(null);
    try {
      const res = await fetch(`/api/admin/auctions/${selectedAuction.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const json = await res.json();
      if (!res.ok) {
        setModerationError(json.error || 'Error al cancelar la subasta');
        return;
      }

      setModerationModalOpen(false);
      fetchAuctions();
      fetchMetrics();
    } catch {
      setModerationError('Error al contactar al servidor.');
    } finally {
      setModerationSaving(false);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Panel de Administración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestión centralizada de categorías, métricas y moderación de subastas.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'metrics'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Resumen & Métricas
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Gestión de Categorías ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'moderation'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Moderación de Subastas ({auctions.length})
        </button>
      </div>

      {/* Content: Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {loadingMetrics ? (
            <p className="text-muted-foreground text-sm">Cargando métricas...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Usuarios</span>
                  <div className="text-3xl font-extrabold text-foreground">{metrics?.totalUsers}</div>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Subastas Totales</span>
                  <div className="text-3xl font-extrabold text-foreground">{metrics?.totalAuctions}</div>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Ofertas Emitidas</span>
                  <div className="text-3xl font-extrabold text-foreground">{metrics?.totalBids}</div>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Categorías</span>
                  <div className="text-3xl font-extrabold text-foreground">{metrics?.totalCategories}</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
                <h3 className="font-bold text-lg text-foreground">Desglose de Estados de Subastas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">ACTIVAS</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                      {metrics?.breakdown.active}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">CERRADAS (CON GANADOR)</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">
                      {metrics?.breakdown.closed}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-500/10 border border-zinc-500/20">
                    <p className="text-xs text-zinc-700 dark:text-zinc-400 font-semibold">DESIERTAS</p>
                    <p className="text-2xl font-black text-zinc-700 dark:text-zinc-400 mt-1">
                      {metrics?.breakdown.deserted}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">CANCELADAS (MODERADAS)</p>
                    <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
                      {metrics?.breakdown.cancelled}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Content: Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Regla 17: Una categoría con subastas asociadas no se puede eliminar.
            </p>
            <Button onClick={() => handleOpenCategoryModal()}>
              + Nueva Categoría
            </Button>
          </div>

          {loadingCategories ? (
            <p className="text-muted-foreground text-sm">Cargando categorías...</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground uppercase bg-muted/40">
                  <tr>
                    <th className="py-3 px-4">Nombre</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Subastas Asociadas</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map((c) => {
                    const hasAuctions = Boolean(c._count && c._count.auctions > 0);

                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">{c.name}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs max-w-md">
                          {c.description || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              hasAuctions
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {c._count?.auctions || 0} subastas
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCategoryModal(c)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={hasAuctions}
                            onClick={() => handleDeleteCategory(c)}
                            title={
                              hasAuctions
                                ? 'Regla 17: No se puede eliminar porque tiene subastas asociadas'
                                : 'Eliminar categoría'
                            }
                          >
                            Eliminar
                          </Button>
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

      {/* Content: Moderation Tab */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Regla 15: El administrador puede cancelar cualquier subasta activa, incluso con ofertas, indicando un motivo obligatorio que queda registrado.
          </p>

          {loadingAuctions ? (
            <p className="text-muted-foreground text-sm">Cargando subastas...</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground uppercase bg-muted/40">
                  <tr>
                    <th className="py-3 px-4">Título</th>
                    <th className="py-3 px-4">Vendedor</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Precio Actual</th>
                    <th className="py-3 px-4">Ofertas</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Moderación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {auctions.map((auc) => {
                    const isActive = auc.status === 'ACTIVE';

                    return (
                      <tr key={auc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          <Link
                            href={`/auctions/${auc.id}`}
                            className="hover:text-primary transition-colors hover:underline"
                          >
                            {auc.title}
                          </Link>
                          {auc.cancellationReason && (
                            <p className="text-xs text-destructive mt-0.5">
                              Motivo: {auc.cancellationReason}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{auc.seller.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{auc.category.name}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(auc.currentPrice)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{auc.bidsCount}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={auc.status as any} />
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/auctions/${auc.id}`}>Ver</Link>
                          </Button>
                          {isActive && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleOpenModeration(auc)}
                            >
                              Cancelar
                            </Button>
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

      {/* Category Modal (Create / Edit) */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Actualiza el nombre y descripción de la categoría.'
                : 'Crea una nueva categoría para organizar los coleccionables.'}
            </DialogDescription>
          </DialogHeader>

          {catError && (
            <div className="p-3 text-sm rounded bg-destructive/15 text-destructive border border-destructive/20">
              {catError}
            </div>
          )}

          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nombre de categoría</Label>
              <Input
                id="cat-name"
                placeholder="Ej: Joyas y Numismática"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Descripción (opcional)</Label>
              <Textarea
                id="cat-desc"
                placeholder="Breve descripción del tipo de coleccionables..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCategoryModalOpen(false)}
              disabled={catSaving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCategory}
              disabled={catSaving || !catName.trim()}
            >
              {catSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderation Cancellation Modal (Rule 15) */}
      <Dialog open={moderationModalOpen} onOpenChange={setModerationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Subasta (Moderación)</DialogTitle>
            <DialogDescription>
              Regla 15: Indica el motivo obligatorio de la cancelación de{' '}
              <strong className="text-foreground">{selectedAuction?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          {moderationError && (
            <div className="p-3 text-sm rounded bg-destructive/15 text-destructive border border-destructive/20">
              {moderationError}
            </div>
          )}

          <div className="space-y-2 my-2">
            <Label htmlFor="mod-reason">Motivo obligatorio</Label>
            <Textarea
              id="mod-reason"
              placeholder="Ej: Publicación sospechosa de falsificación o no permitida..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModerationModalOpen(false)}
              disabled={moderationSaving}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmModerationCancel}
              disabled={moderationSaving || !cancelReason.trim()}
            >
              {moderationSaving ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
