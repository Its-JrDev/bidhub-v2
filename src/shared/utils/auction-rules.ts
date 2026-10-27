export type AuctionStatusType = 'ACTIVE' | 'CLOSED' | 'DESERTED' | 'CANCELLED';

export interface AuctionLike {
  id: string;
  status: AuctionStatusType | string;
  startingPrice: number;
  currentPrice: number;
  minIncrement: number;
  endsAt: Date | string;
  sellerId: string;
  bids?: Array<{
    amount: number;
    bidderId: string;
    createdAt?: Date | string;
  }>;
}

/**
 * Rules 12 & 13: Deterministically resolves auction status in real-time
 * without relying on background cron jobs.
 */
export function computeAuctionStatus(
  auction: { status: string; endsAt: Date | string; bids?: Array<unknown>; _count?: { bids: number } },
  now = new Date()
): AuctionStatusType {
  if (auction.status === 'CANCELLED') {
    return 'CANCELLED';
  }

  const endsAtTime = new Date(auction.endsAt).getTime();
  const currentTime = now.getTime();

  if (currentTime >= endsAtTime) {
    const hasBids = (auction.bids && auction.bids.length > 0) || (auction._count && auction._count.bids > 0) || false;
    return hasBids ? 'CLOSED' : 'DESERTED';
  }

  return 'ACTIVE';
}

/**
 * Rule 2: End date must be between 1 hour and 7 days from publication.
 */
export function validateAuctionDuration(endsAt: Date | string, now = new Date()): { valid: boolean; error?: string } {
  const endsTime = new Date(endsAt).getTime();
  const nowTime = now.getTime();

  const minTime = nowTime + 60 * 60 * 1000 - 60000; // 1 hour (with 1-min clock tolerance)
  const maxTime = nowTime + 7 * 24 * 60 * 60 * 1000 + 60000; // 7 days (with 1-min tolerance)

  if (isNaN(endsTime)) {
    return { valid: false, error: 'Fecha de cierre inválida.' };
  }

  if (endsTime < minTime) {
    return { valid: false, error: 'La fecha de cierre debe ser de al menos 1 hora a partir de la publicación.' };
  }

  if (endsTime > maxTime) {
    return { valid: false, error: 'La fecha de cierre no puede ser mayor a 7 días a partir de la publicación.' };
  }

  return { valid: true };
}

/**
 * Rule 11 (Anti-sniper): If bid arrives within 5 minutes of closing, extend endsAt by 5 minutes.
 */
export function checkSniperExtension(endsAt: Date | string, bidTime = new Date()): Date | null {
  const ends = new Date(endsAt);
  const fiveMinutesMs = 5 * 60 * 1000;
  const timeRemaining = ends.getTime() - bidTime.getTime();

  if (timeRemaining > 0 && timeRemaining <= fiveMinutesMs) {
    return new Date(ends.getTime() + fiveMinutesMs);
  }

  return null;
}
