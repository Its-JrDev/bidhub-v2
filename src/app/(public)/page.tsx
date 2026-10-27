import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { CountdownTimer } from '@/shared/components/CountdownTimer';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/format';
import { computeAuctionStatus } from '@/shared/utils/auction-rules';

export const revalidate = 60; // SSG with 60s ISR

async function getFeaturedAuctions() {
  try {
    const rawAuctions = await db.auction.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: { endsAt: 'asc' },
      take: 6,
      include: {
        category: true,
        seller: { select: { name: true } },
        bids: { select: { id: true } },
      },
    });

    const now = new Date();
    return rawAuctions
      .map((a) => ({
        ...a,
        status: computeAuctionStatus(a, now),
        bidsCount: a.bids.length,
      }))
      .filter((a) => a.status === 'ACTIVE');
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const auctions = await getFeaturedAuctions();

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            ✨ Plataforma Fullstack de Subastas Next.js 16
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Subastas exclusivas de <span className="text-primary">artículos de colección</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Cartas raras, relojes de lujo, vinilos históricos y figuras numeradas. Compra y vende de forma segura con reglas de negocio garantizadas en el backend.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/auctions">
              <Button size="lg" className="h-11 px-8 text-base shadow-md">
                Explorar Catálogo
              </Button>
            </Link>
            <Link href="/auctions/new">
              <Button size="lg" variant="outline" className="h-11 px-8 text-base">
                Publicar Subasta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Auctions Grid */}
      <section className="container mx-auto px-4 max-w-6xl space-y-8">
        <div className="flex items-end justify-between border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Subastas Destacadas</h2>
            <p className="text-sm text-muted-foreground">Piezas seleccionadas con ofertas en curso y cierre próximo</p>
          </div>
          <Link href="/auctions" className="text-sm font-semibold text-primary hover:underline">
            Ver todas &rarr;
          </Link>
        </div>

        {auctions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No hay subastas activas en este momento. Sé el primero en publicar una.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col transition-all hover:shadow-lg">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm font-medium">
                      Sin imagen
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <StatusBadge variant="active" label="Activa" />
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-md bg-background/90 backdrop-blur px-2.5 py-1 shadow-sm">
                    <CountdownTimer endsAt={item.endsAt} />
                  </div>
                </div>

                <CardHeader className="space-y-1 p-5 pb-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {item.category.name}
                  </div>
                  <h3 className="line-clamp-1 font-bold text-lg text-foreground" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardHeader>

                <CardContent className="px-5 py-3 flex-1 flex flex-col justify-end">
                  <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
                    <div>
                      <span className="block text-[11px] font-medium text-muted-foreground">Oferta actual</span>
                      <span className="text-xl font-black text-foreground">
                        {formatCurrency(item.currentPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[11px] font-medium text-muted-foreground">Total ofertas</span>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {item.bidsCount}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-0">
                  <Link href={`/auctions/${item.id}`} className="w-full">
                    <Button variant="default" className="w-full">
                      Ver Subasta y Pujar
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
