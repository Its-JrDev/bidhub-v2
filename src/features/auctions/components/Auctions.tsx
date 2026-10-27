import type { FC } from 'react';
import type { AuctionsProps } from '../types/index';

export const Auctions: FC<AuctionsProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`.trim()} data-testid="auctions-feature">
      <h2 className="text-xl font-bold">Auctions Feature</h2>
    </div>
  );
};
