'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bidSchema, type BidFormValues } from './Bid.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

export interface BidFormProps {
  auctionId: string;
  currentPrice: number;
  minIncrement: number;
  hasBids: boolean;
  isSeller?: boolean;
  isHighestBidder?: boolean;
  isAuctionActive?: boolean;
  isLoggedIn?: boolean;
  onBidSuccess?: (data: { currentPrice: number; endsAt: string; extended: boolean }) => void;
}

export function BidForm({
  auctionId,
  currentPrice,
  minIncrement,
  hasBids,
  isSeller = false,
  isHighestBidder = false,
  isAuctionActive = true,
  isLoggedIn = true,
  onBidSuccess,
}: BidFormProps) {
  const minAllowed = hasBids ? currentPrice + minIncrement : currentPrice;
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: minAllowed,
    },
  });

  const handleFormSubmit = async (data: BidFormValues) => {
    setServerError(null);
    setSuccessMsg(null);

    if (data.amount < minAllowed) {
      setServerError(`La oferta mínima permitida es de $${minAllowed.toFixed(2)} USD.`);
      return;
    }

    try {
      const res = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: data.amount }),
      });

      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || 'Error al enviar la oferta.');
        return;
      }

      let message = '¡Oferta realizada con éxito!';
      if (json.data?.extended) {
        message += ' Se agregaron 5 minutos adicionales al cierre por regla anti-sniper (Regla 11).';
      }
      setSuccessMsg(message);

      if (onBidSuccess) {
        onBidSuccess(json.data);
      }
    } catch {
      setServerError('Ocurrió un error al procesar tu oferta. Inténtalo de nuevo.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="p-4 rounded-lg border border-border bg-muted/40 text-center space-y-3">
        <p className="text-sm text-muted-foreground font-medium">
          Debes iniciar sesión para poder realizar ofertas en esta subasta.
        </p>
        <Button asChild variant="default" className="w-full">
          <a href="/login">Iniciar Sesión para Ofertar</a>
        </Button>
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium">
        Eres el creador de esta subasta. Por regla de negocio (Regla 6), no puedes ofertar en tu propia subasta.
      </div>
    );
  }

  if (!isAuctionActive) {
    return (
      <div className="p-4 rounded-lg border border-muted bg-muted/50 text-muted-foreground text-sm font-medium text-center">
        Esta subasta no está activa o ya ha cerrado. No se reciben más ofertas.
      </div>
    );
  }

  if (isHighestBidder) {
    return (
      <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
        ¡Actualmente tienes la oferta más alta! (Regla 9: no puedes superarte a ti mismo hasta que otro usuario oferte).
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
          {serverError}
        </div>
      )}

      {successMsg && (
        <div className="p-3 text-sm rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          {successMsg}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="bid-amount">Monto a ofertar (USD)</Label>
          <span className="text-xs text-muted-foreground">
            Mínimo sugerido: ${minAllowed.toFixed(2)}
          </span>
        </div>
        <Input
          id="bid-amount"
          type="number"
          step="0.01"
          min={minAllowed}
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-sm font-medium text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Quick increments */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValue('amount', minAllowed)}
        >
          Mínimo (+${minAllowed.toFixed(2)})
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValue('amount', minAllowed + minIncrement)}
        >
          +${(minIncrement).toFixed(2)}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValue('amount', minAllowed + minIncrement * 5)}
        >
          +${(minIncrement * 5).toFixed(2)}
        </Button>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Enviando oferta...' : 'Confirmar Oferta'}
      </Button>
    </form>
  );
}
