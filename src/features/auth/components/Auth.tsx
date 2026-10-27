import type { FC } from 'react';
import type { AuthProps } from '../types/index';

export const Auth: FC<AuthProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`.trim()} data-testid="auth-feature">
      <h2 className="text-xl font-bold">Auth Feature</h2>
    </div>
  );
};
