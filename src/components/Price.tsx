import React from 'react';
import { formatPrice } from '@/lib/format';

interface PriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | string | undefined | null;
}

export function Price({ amount, className = '', ...props }: PriceProps) {
  return (
    <span className={className} {...props}>
      {formatPrice(amount)}
    </span>
  );
}
