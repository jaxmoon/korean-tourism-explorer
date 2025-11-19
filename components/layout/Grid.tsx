import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 2 | 4 | 6 | 8;
}

export const Grid: React.FC<GridProps> = ({
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className,
  children,
  ...props
}) => {
  const gridColsClasses = {
    mobile: `grid-cols-${cols.mobile}`,
    tablet: cols.tablet ? `md:grid-cols-${cols.tablet}` : '',
    desktop: cols.desktop ? `lg:grid-cols-${cols.desktop}` : '',
  };

  return (
    <div
      className={cn(
        'grid',
        gridColsClasses.mobile,
        gridColsClasses.tablet,
        gridColsClasses.desktop,
        `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Grid.displayName = 'Grid';
