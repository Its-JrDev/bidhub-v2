import type { FC } from 'react';
import type { CategoriesProps } from '../types/index';

export const Categories: FC<CategoriesProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 ${className}`.trim()} data-testid="categories-feature">
      <h2 className="text-xl font-bold">Categories Feature</h2>
    </div>
  );
};
