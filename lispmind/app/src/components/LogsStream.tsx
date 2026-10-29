import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Trash2 } from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import type { LogSeverity } from '@/data/mockData';

type FilterType = 'ALL' | LogSeverity;

const ALL_FILTERS: FilterType[] = ['ALL', 'BIRTH', 'DEATH', 'EVOLVE', 'HEAL', 'GOSSIP', 'ERROR', 'WARN', 'INFO'];

const severityColors: Record<LogSeverity, string> = {
  INFO: 'var(--accent-blue)',
  WARN: 'var(--accent-amber)',
  ERROR: 'var(--accent-red)',
  EVOLVE: 'var(--accent-purple)',
  GOSSIP: 'var(--accent-cyan)',
  BIRTH: 'var(--accent-green)',
  DEATH: '#B71C1C',
  HEAL: '#69F0AE',
};

const filterChipColors: Record<FilterType, string> = {
  ALL: 'var(--text-secondary)',
  INFO: 'var(--accent-blue)',
  WARN: 'var(--accent-amber)',
  ERROR: 'var(--accent-red)',
  EVOLVE: 'var(--accent-purple)',
  GOSSIP: 'var(--accent-cyan)',
  BIRTH: 'var(--accent-green)',
  DEATH: 'var(--accent-red)',
  HEAL: '#69F0AE',
};

function formatTimestamp(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export default function LogsStream() {
  const { logs } = useRealtimeData();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(['ALL']));
  const isAtBottomRef = useRef(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const prevLogsLength = useRef(logs.length);

  // Determine which severities are visible based on active filters
  const visibleSeverities = useMemo(() => {
    if (activeFilters.has('ALL')) return new Set<LogSeverity>(['INFO', 'WARN', 'ERROR', 'EVOLVE', 'GOSSIP', 'BIRTH', 'DEATH', 'HEAL']);
    return new Set<LogSeverity>([...activeFilters].filter((f): f is LogSeverity => f !== 'ALL'));
  }, [activeFilters]);

  // Filter logs: show last 100 max, filtered by severity
  const visibleLogs = useMemo(() => {
    const filtered = logs.filter((log) => visibleSeverities.has(log.severity));
    return filtered.slice(-100);
  }, [logs, visibleSeverities]);

  // Toggle filter chip
  const toggleFilter = useCallback((filter: FilterType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (filter === 'ALL') {
        return new Set(['ALL']);
      }
      next.delete('ALL');
      if (next.has(filter)) {
        next.delete(filter);
        if (next.size === 0) return new Set(['ALL']);
      } else {
        next.add(filter);
      }
      return next;
    });
  }, []);

  // Check scroll position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 20;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isAtBottomRef.current = atBottom;
    setUserScrolledUp(!atBottom);
  }, []);

  // Auto-scroll to bottom when new entries arrive (if user hasn't scrolled up)
  useEffect(() => {
    if (logs.length > prevLogsLength.current && !userScrolledUp) {
      const el = scrollRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    }
    prevLogsLength.current = logs.length;
  }, [logs.length, userScrolledUp]);

  // Jump to bottom handler
  const jumpToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setUserScrolledUp(false);
    isAtBottomRef.current = true;
  }, []);

  // Clear is handled at UI level - we just show the last 100, and
  // if the user wants "clear" we just note we can't clear the source data.
  // We'll keep a local cleared count to hide everything momentarily.
  const [clearedAt, setClearedAt] = useState<number>(0);
  const handleClear = useCallback(() => {
    setClearedAt(Date.now());
  }, []);

  const displayLogs = useMemo(() => {
    if (clearedAt === 0) return visibleLogs;
    // After clear, only show logs that arrived after the clear
    return visibleLogs.filter((log) => log.timestamp.getTime() > clearedAt);
  }, [visibleLogs, clearedAt]);

  // Log count shown to user (post-filter)
  const filteredCount = displayLogs.length;
  const totalCount = logs.length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Filter Bar */}
      <div className="flex shrink-0 items-center gap-1.5 border-b px-3 py-1.5"
        style={{ borderColor: 'rgba(30, 41, 59, 0.5)' }}
      >
        {ALL_FILTERS.map((filter) => {
          const isActive = activeFilters.has(filter);
          const color = filterChipColors[filter];
          return (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className="cursor-pointer select-none rounded px-2.5 py-0.5 text-micro uppercase transition-all duration-150"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                letterSpacing: '0.04em',
                background: isActive ? `${color}1F` : 'transparent',
                color: isActive ? color : 'var(--text-dim)',
                border: isActive ? `1px solid ${color}4D` : '1px solid var(--bg-border)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = `${color}4D`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--bg-border)';
                }
              }}
            >
              {filter}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2">
          {/* Log count */}
          <span
            className="text-[10px]"
            style={{
              color: 'var(--text-tertiary)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {filteredCount}
            <span style={{ color: 'var(--text-dim)' }}>/{totalCount}</span>
          </span>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase transition-all duration-150 hover:bg-[var(--bg-surface-elevated)]"
            style={{
              color: 'var(--text-tertiary)',
              fontFamily: 'JetBrains Mono, monospace',
              border: '1px solid var(--bg-border)',
            }}
            title="Clear visible logs"
          >
            <Trash2 size={10} />
            CLR
          </button>
        </div>
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="custom-scrollbar relative flex-1 overflow-y-auto"
      >
        {displayLogs.length === 0 ? (
          <div
            className="flex h-full items-center justify-center py-8 text-micro"
            style={{ color: 'var(--text-dim)' }}
          >
            No log entries
          </div>
        ) : (
          displayLogs.map((log, i) => {
            const severityColor = severityColors[log.severity];
            const isLastBatch = i >= displayLogs.length - 5;

            return (
              <motion.div
                key={`${log.timestamp.getTime()}-${i}-${log.message.slice(0, 20)}`}
                initial={isLastBatch ? { x: -10, opacity: 0 } : false}
                animate={{ x: 0, opacity: 1 }}
                transition={{
                  duration: 0.2,
                  ease: [0, 0, 0.2, 1] as [number, number, number, number],
                }}
                className="px-3 py-1 transition-colors duration-100 hover:bg-[rgba(255,255,255,0.015)]"
                style={{
                  borderBottom: '1px solid rgba(30, 41, 59, 0.3)',
                  minHeight: '28px',
                }}
              >
                <span
                  className="text-[11px]"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.02em',
                  }}
                >
                  [{formatTimestamp(log.timestamp)}]
                </span>
                {' '}
                <span
                  className="text-[11px] font-bold"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: severityColor,
                    letterSpacing: '0.02em',
                  }}
                >
                  [{log.severity}]
                </span>
                {' '}
                <span
                  className="text-[11px]"
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    color: log.severity === 'ERROR' || log.severity === 'DEATH'
                      ? 'var(--accent-red)'
                      : log.severity === 'WARN'
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {log.message}
                </span>
              </motion.div>
            );
          })
        )}

        {/* Jump to Bottom button */}
        <AnimatePresence>
          {userScrolledUp && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              onClick={jumpToBottom}
              className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                zIndex: 10,
              }}
            >
              <ArrowDown size={12} />
              Jump to Bottom
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
