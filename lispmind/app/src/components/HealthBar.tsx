import { cn } from '@/lib/utils';

interface HealthBarProps {
  value: number;
  animate?: boolean;
  className?: string;
}

function getHealthGradient(value: number): string {
  if (value >= 81) {
    return 'linear-gradient(90deg, var(--accent-green), #69F0AE)';
  } else if (value >= 51) {
    return 'linear-gradient(90deg, var(--accent-amber), #FFD54F)';
  } else if (value >= 21) {
    return 'linear-gradient(90deg, #FF6D00, var(--accent-amber))';
  } else {
    return 'linear-gradient(90deg, var(--accent-red), #FF5252)';
  }
}

export default function HealthBar({ value, animate = true, className }: HealthBarProps) {
  const isCritical = value < 20 && value > 0;

  return (
    <div
      className={cn(
        'h-[6px] w-full overflow-hidden rounded-[3px]',
        className
      )}
      style={{ background: 'var(--bg-border)' }}
    >
      <div
        className={cn(
          'h-full rounded-[3px]',
          isCritical && 'animate-critical-pulse'
        )}
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: getHealthGradient(value),
          transition: animate ? 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
        }}
      />
    </div>
  );
}
