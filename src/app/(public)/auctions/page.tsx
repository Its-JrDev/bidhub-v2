import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { CountdownTimer } from '@/shared/components/CountdownTimer';
import { StatusBadge, type StatusVariant } from '@/shared/components/ui/StatusBadge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/shared/components/ui/card';
import { formatCurrency } from '@/shared/utils/format';
import { computeAuctionStatus } from '@/shared/utils/auction-rules';

export const dynamic = 'force-dynamic'; // SSR required

interface CatalogPageProps {
  searchParams: Promise<{
    category?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { category, status: statusParam, search } = await searchParams;

  const where: Record<string, unknown> = {};
  if (category) {
    where.categoryId = category;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [categories, rawAuctions] = await Promise.all([
    db.category.findMany({ orderBy: { name: 'asc' } }),
    db.auction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        seller: { select: { name: true } },
        bids: { select: { id: true } },
      },
    }),
  ]);

  const now = new Date();
  const formatted = rawAuctions.map((a) => ({
    ...a,
    status: computeAuctionStatus(a, now),
    bidsCount: a.bids.length,
  }));

  const filteredAuctions = statusParam
    ? formatted.filter((a) => a.status.toLowerCase() === statusParam.toLowerCase())
    : formatted;

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Catálogo de Subastas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explora todos los artículos disponibles, filtra por categoría o consulta subastas finalizadas.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        {/* Search Input */}
        <form className="flex-1 max-w-md">
          <input
            type="search"
            name="search"
            defaultValue={search || ''}
            placeholder="Buscar por título o descripción..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </form>

        {/* Category & Status Quick Links */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/auctions">
            <Button variant={!category && !statusParam ? 'default' : 'outline'} size="sm">
              Todas
            </Button>
          </Link>
          <Link href="/auctions?status=active">
            <Button variant={statusParam === 'active' ? 'default' : 'outline'} size="sm">
              Activas
            </Button>
          </Link>
          <Link href="/auctions?status=closed">
            <Button variant={statusParam === 'closed' ? 'default' : 'outline'} size="sm">
              Cerradas
            </Button>
          </Link>
          <Link href="/auctions?status=cancelled">
            <Button variant={statusParam === 'cancelled' ? 'default' : 'outline'} size="sm">
              Canceladas
            </Button>
          </Link>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-xs font-semibold uppercase text-muted-foreground shrink-0 mr-2">Categorías:</span>
        <Link href="/auctions">
          <span
            className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
              !category ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Todas
          </span>
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/auctions?category=${c.id}`}>
            <span
              className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-colors ${
                category === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {c.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Grid of Auctions */}
      {filteredAuctions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
          No se encontraron subastas con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAuctions.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm font-medium">
                    Sin imagen
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <StatusBadge variant={item.status.toLowerCase() as StatusVariant} label={item.status} />
                </div>
                {item.status === 'ACTIVE' && (
                  <div className="absolute bottom-3 right-3 rounded-md bg-background/90 backdrop-blur px-2.5 py-1 shadow-sm">
                    <CountdownTimer endsAt={item.endsAt} />
                  </div>
                )}
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
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      {item.status === 'ACTIVE' ? 'Oferta actual' : 'Precio final'}
                    </span>
                    <span className="text-xl font-black text-foreground">
                      {formatCurrency(item.currentPrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] font-medium text-muted-foreground">Ofertas</span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {item.bidsCount}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-0">
                <Link href={`/auctions/${item.id}`} className="w-full">
                  <Button variant="default" className="w-full">
                    Ver Detalles
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
