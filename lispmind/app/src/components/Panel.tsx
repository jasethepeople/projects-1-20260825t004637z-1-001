import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelProps {
  title: string;
  accentColor?: string;
  children: ReactNode;
  className?: string;
  showCRT?: boolean;
  subtitle?: string;
  rightContent?: ReactNode;
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ title, accentColor = 'var(--accent-cyan)', children, className, showCRT = false, subtitle, rightContent }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col overflow-hidden',
          'bg-[var(--bg-surface)] backdrop-blur-[12px]',
          'border-[var(--panel-border)] rounded-[var(--panel-radius)]',
          'shadow-panel',
          'transition-all duration-200',
          'hover:border-[var(--bg-border-hover)] hover:shadow-panel-hover',
          className
        )}
        style={{
          borderLeftWidth: '3px',
          borderLeftColor: accentColor,
        }}
      >
        {/* CRT scanline overlay */}
        {showCRT && (
          <div
            className="pointer-events-none absolute inset-0 z-10 opacity-30"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
            }}
          />
        )}

        {/* Title bar */}
        <div className="flex h-9 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h2
              className="text-h3 uppercase"
              style={{ color: accentColor }}
            >
              {title}
            </h2>
            {subtitle && (
              <span className="text-micro text-[var(--text-tertiary)]">
                {subtitle}
              </span>
            )}
          </div>
          {rightContent && (
            <div className="flex items-center gap-2">
              {rightContent}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export default Panel;
