import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { computeAuctionStatus } from '@/shared/utils/auction-rules';
import { maskBidder } from '@/shared/utils/format';
import { AuctionDetailClient } from '@/features/auctions/components/AuctionDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const auction = await db.auction.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: auction ? `${auction.title} - BidHub Subastas` : 'Detalle de Subasta - BidHub',
  };
}

export default async function AuctionDetailPage({ params }: Props) {
  const { id } = await params;

  const auction = await db.auction.findUnique({
    where: { id },
    include: {
      category: {
        select: { id: true, name: true },
      },
      seller: {
        select: { id: true, name: true, email: true },
      },
      winner: {
        select: { id: true, name: true },
      },
      bids: {
        orderBy: { createdAt: 'desc' },
        include: {
          bidder: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!auction) {
    notFound();
  }

  const now = new Date();
  const computedStatus = computeAuctionStatus(auction, now);

  const serializedAuction = {
    id: auction.id,
    title: auction.title,
    description: auction.description,
    imageUrl: auction.imageUrl,
    startingPrice: auction.startingPrice,
    currentPrice: auction.currentPrice,
    minIncrement: auction.minIncrement,
    endsAt: auction.endsAt.toISOString(),
    status: computedStatus,
    cancellationReason: auction.cancellationReason,
    category: auction.category,
    seller: auction.seller,
    winner: auction.winner,
    bids: auction.bids.map((b) => ({
      id: b.id,
      amount: b.amount,
      createdAt: b.createdAt.toISOString(),
      bidderName: maskBidder(b.bidder.name, b.bidder.email),
      isOwnBid: false, // The client will re-check via session if needed
    })),
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <AuctionDetailClient initialAuction={serializedAuction} />
    </div>
  );
}
