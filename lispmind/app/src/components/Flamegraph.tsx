import { useState, useMemo } from 'react';
import { mockFlamegraphData } from '@/data/mockData';
import type { FlamegraphItem } from '@/data/mockData';

interface FlamegraphProps {
  data?: FlamegraphItem[];
}

// Map function names to the assignment's 8 function categories
// We map from the mock data names to display names
const FUNCTION_DISPLAY_NAMES: Record<string, string> = {
  exploit_buffer_overflow: 'run-agent',
  crypto_aes_encrypt: 'parse-html',
  gossip_send_message: 'handle-msg',
  mesh_topology_update: 'check-health',
  fitness_evaluate: 'heartbeat',
  strategy_mutate: 'evolve-strategy',
  agent_spawn_child: 'gossip-send',
  safety_kernel_check: 'checkpoint',
};

function getBarColor(percentage: number): { start: string; end: string } {
  if (percentage > 50) {
    return { start: '#FF1744', end: 'rgba(255, 23, 68, 0.1)' };
  }
  if (percentage >= 20) {
    return { start: '#FFB300', end: 'rgba(255, 179, 0, 0.1)' };
  }
  return { start: '#00E5FF', end: 'rgba(0, 229, 255, 0.1)' };
}

function TooltipContent({
  item,
  displayName,
}: {
  item: FlamegraphItem;
  displayName: string;
}) {
  return (
    <div
      className="rounded-md border px-3 py-2 shadow-lg"
      style={{
        background: 'var(--bg-surface-elevated)',
        borderColor: 'var(--bg-border-hover)',
      }}
    >
      <p
        className="mb-1 text-[11px] font-bold"
        style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {displayName}
      </p>
      <div
        className="space-y-0.5 text-[10px]"
        style={{ color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}
      >
        <p>
          CPU:{' '}
          <span style={{ color: getBarColor(item.percentage).start }}>
            {item.percentage.toFixed(1)}%
          </span>
        </p>
        <p>Calls: {item.calls.toLocaleString()}</p>
        <p
          className="text-[9px] uppercase"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Category: {item.category}
        </p>
      </div>
    </div>
  );
}

export default function Flamegraph({ data }: FlamegraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sortedData = useMemo(() => {
    const source = data && data.length > 0 ? data : mockFlamegraphData;
    // Sort by CPU percentage descending
    return [...source].sort((a, b) => b.percentage - a.percentage);
  }, [data]);

  const totalCalls = useMemo(
    () => sortedData.reduce((sum, item) => sum + item.calls, 0),
    [sortedData]
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Bars area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1">
        <div className="flex flex-col gap-[3px]">
          {sortedData.map((item, index) => {
            const displayName = FUNCTION_DISPLAY_NAMES[item.name] || item.name;
            const colors = getBarColor(item.percentage);
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.name}
                className="group relative flex items-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bar */}
                <div className="relative h-5 w-full overflow-hidden rounded-[3px]">
                  {/* Animated gradient bar */}
                  <div
                    className="h-full rounded-[3px] transition-all duration-500 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      background: `linear-gradient(90deg, ${colors.start} 0%, ${colors.end} 100%)`,
                      opacity: isHovered ? 1 : 0.85,
                      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                      animationDelay: `${index * 60}ms`,
                    }}
                  >
                    {/* Function name label - inside bar, left-aligned */}
                    <span
                      className="absolute inset-y-0 left-0 flex items-center pl-2 text-[10px] font-medium"
                      style={{
                        color: '#F8FAFC',
                        fontFamily: 'JetBrains Mono, monospace',
                        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
                      }}
                    >
                      {displayName}
                    </span>
                  </div>

                  {/* Percentage label - right-aligned, outside bar */}
                  <span
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-[10px]"
                    style={{
                      color: 'var(--text-secondary)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Hover tooltip */}
                {isHovered && (
                  <div className="absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2">
                    <TooltipContent item={item} displayName={displayName} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between border-t px-2 py-1" style={{ borderColor: 'var(--bg-border)' }}>
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          TOTAL SAMPLES: {totalCalls.toLocaleString()}
        </span>
        <span
          className="text-[9px] uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}
        >
          SAMPLE RATE: 100Hz
        </span>
      </div>
    </div>
  );
}
