import { cn } from '@/lib/utils';

type BadgeVariant = 'online' | 'warning' | 'critical' | 'evolving' | 'idle';

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  online: 'badge-online',
  warning: 'badge-warning',
  critical: 'badge-critical',
  evolving: 'badge-evolving',
  idle: 'badge-idle',
};

export default function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(variantClasses[variant], className)}>
      {children}
    </span>
  );
}
