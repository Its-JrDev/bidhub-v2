import type { FC } from 'react';
import type { BidsProps } from '../types/index';

export const Bids: FC<BidsProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`.trim()} data-testid="bids-feature">
      <h2 className="text-xl font-bold">Bids Feature</h2>
    </div>
  );
};
