'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createAuctionSchema, type CreateAuctionFormValues } from './CreateAuction.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useCategories } from '@/shared/hooks/useCategories';

export interface CreateAuctionFormProps {
  auctionId?: string;
  defaultValues?: Partial<CreateAuctionFormValues>;
  onSubmit?: (data: CreateAuctionFormValues) => void | Promise<void>;
  isEditing?: boolean;
}

export function CreateAuctionForm({
  auctionId,
  defaultValues,
  onSubmit,
  isEditing = false,
}: CreateAuctionFormProps) {
  const router = useRouter();
  const { categories, loading: loadingCategories } = useCategories();
  const [serverError, setServerError] = useState<string | null>(null);

  // Helper default for endsAt: 24h from now
  const [defaultEndsAt] = useState(() => {
    if (defaultValues?.endsAt) return defaultValues.endsAt;
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateAuctionFormValues>({
    resolver: zodResolver(createAuctionSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      categoryId: defaultValues?.categoryId || '',
      startingPrice: defaultValues?.startingPrice || 10,
      minIncrement: defaultValues?.minIncrement || 1,
      imageUrl: defaultValues?.imageUrl || '',
      endsAt: defaultEndsAt,
    },
  });

  const handleFormSubmit = async (data: CreateAuctionFormValues) => {
    setServerError(null);
    if (onSubmit) {
      await onSubmit(data);
      return;
    }

    try {
      const url = isEditing && auctionId ? `/api/auctions/${auctionId}` : '/api/auctions';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || 'Error al guardar la subasta');
        return;
      }

      const targetId = json.data?.id || auctionId;
      if (targetId) {
        router.push(`/auctions/${targetId}`);
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      setServerError('Ocurrió un error inesperado al procesar la subasta.');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="auc-title">Título del artículo</Label>
        <Input
          id="auc-title"
          placeholder="Ej: Carta Charizard 1st Edition PSA 9"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm font-medium text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="auc-category">Categoría</Label>
        <select
          id="auc-category"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          {...register('categoryId')}
          disabled={loadingCategories}
        >
          <option value="">Selecciona una categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="text-sm font-medium text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="auc-desc">Descripción detallada</Label>
        <Textarea
          id="auc-desc"
          rows={4}
          placeholder="Describe el estado de conservación, autenticidad, accesorios y detalles..."
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm font-medium text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="auc-start-price">Precio inicial (USD)</Label>
          <Input
            id="auc-start-price"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="50.00"
            {...register('startingPrice', { valueAsNumber: true })}
          />
          {errors.startingPrice && (
            <p className="text-sm font-medium text-destructive">{errors.startingPrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="auc-min-inc">Incremento mínimo (USD)</Label>
          <Input
            id="auc-min-inc"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="5.00"
            {...register('minIncrement', { valueAsNumber: true })}
          />
          {errors.minIncrement && (
            <p className="text-sm font-medium text-destructive">{errors.minIncrement.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="auc-image">URL de imagen (Opcional)</Label>
        <Input
          id="auc-image"
          type="url"
          placeholder="https://images.unsplash.com/photo-..."
          {...register('imageUrl')}
        />
        {errors.imageUrl && (
          <p className="text-sm font-medium text-destructive">{errors.imageUrl.message}</p>
        )}
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="auc-ends-at">Fecha y hora de cierre (Entre 1h y 7 días)</Label>
          <Input
            id="auc-ends-at"
            type="datetime-local"
            {...register('endsAt')}
          />
          <p className="text-xs text-muted-foreground">
            Regla de negocio: la subasta debe durar entre 1 hora y 7 días a partir de la publicación.
          </p>
          {errors.endsAt && (
            <p className="text-sm font-medium text-destructive">{errors.endsAt.message}</p>
          )}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting
          ? isEditing
            ? 'Guardando cambios...'
            : 'Publicando subasta...'
          : isEditing
          ? 'Guardar Cambios'
          : 'Publicar Subasta'}
      </Button>
    </form>
  );
}
