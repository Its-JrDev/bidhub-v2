import type { FC } from 'react';
import type { AdminProps } from '../types/index';

export const Admin: FC<AdminProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`.trim()} data-testid="admin-feature">
      <h2 className="text-xl font-bold">Admin Feature</h2>
    </div>
  );
};
