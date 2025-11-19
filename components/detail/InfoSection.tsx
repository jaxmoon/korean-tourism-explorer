import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type InfoSectionProps = {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  className?: string;
};

export function InfoSection({ icon, label, value, className }: InfoSectionProps) {
  if (!value) return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"
      >
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="text-base text-foreground">{value}</div>
      </div>
    </div>
  );
}
