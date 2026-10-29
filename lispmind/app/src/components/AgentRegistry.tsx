import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { mockAgents } from '@/data/mockData';
import type { Agent, AgentStatus } from '@/data/mockData';
import StatusBadge from './StatusBadge';
import HealthBar from './HealthBar';

type SortColumn = 'id' | 'status' | 'health' | 'generation' | 'errorCount' | 'lastSeen';
type SortDirection = 'asc' | 'desc' | 'none';
type FilterChip = 'All' | 'Running' | 'Healing' | 'Failed' | 'Evolving' | 'Idle';

const FILTER_CHIPS: FilterChip[] = ['All', 'Running', 'Healing', 'Failed', 'Evolving', 'Idle'];

const statusOrder: Record<AgentStatus, number> = {
  CRITICAL: 0,
  DEAD: 1,
  DEGRADED: 2,
  EVOLVING: 3,
  IDLE: 4,
  ONLINE: 5,
};

function statusToBadgeVariant(status: AgentStatus) {
  switch (status) {
    case 'ONLINE':
      return 'online' as const;
    case 'IDLE':
      return 'idle' as const;
    case 'EVOLVING':
      return 'evolving' as const;
    case 'DEGRADED':
      return 'warning' as const;
    case 'CRITICAL':
      return 'critical' as const;
    case 'DEAD':
      return 'critical' as const;
  }
}

function statusToFilterChip(status: AgentStatus): FilterChip {
  switch (status) {
    case 'ONLINE':
      return 'Running';
    case 'EVOLVING':
      return 'Evolving';
    case 'IDLE':
      return 'Idle';
    case 'CRITICAL':
    case 'DEAD':
      return 'Failed';
    case 'DEGRADED':
      return 'Healing';
  }
}

function formatLastSeen(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function getIdNumber(id: string): number {
  return parseInt(id.replace('A-', ''), 10);
}

export default function AgentRegistry() {
  const { agents: liveAgents } = useRealtimeData();
  const [sortColumn, setSortColumn] = useState<SortColumn>('health');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('All');
  const prevAgentsRef = useRef<Agent[]>(liveAgents);
  const [changedIds, setChangedIds] = useState<Set<string>>(new Set());

  // Detect status changes for animation
  useEffect(() => {
    const changed = new Set<string>();
    for (const agent of liveAgents) {
      const prev = prevAgentsRef.current.find(a => a.id === agent.id);
      if (prev && prev.status !== agent.status) {
        changed.add(agent.id);
      }
    }
    if (changed.size > 0) {
      setChangedIds(changed);
      const timeout = setTimeout(() => setChangedIds(new Set()), 1000);
      return () => clearTimeout(timeout);
    }
    prevAgentsRef.current = liveAgents;
  }, [liveAgents]);

  const agents = liveAgents.length > 0 ? liveAgents : mockAgents;

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        setSortDirection(prev => {
          if (prev === 'asc') return 'desc';
          if (prev === 'desc') return 'none';
          return 'asc';
        });
      } else {
        setSortColumn(column);
        setSortDirection('asc');
      }
    },
    [sortColumn]
  );

  const filteredAgents = useMemo(() => {
    if (activeFilter === 'All') return agents;
    return agents.filter(a => statusToFilterChip(a.status) === activeFilter);
  }, [agents, activeFilter]);

  const sortedAgents = useMemo(() => {
    if (sortDirection === 'none') return filteredAgents;

    const sorted = [...filteredAgents];
    const dir = sortDirection === 'asc' ? 1 : -1;

    switch (sortColumn) {
      case 'id':
        sorted.sort((a, b) => (getIdNumber(a.id) - getIdNumber(b.id)) * dir);
        break;
      case 'status':
        sorted.sort((a, b) => (statusOrder[a.status] - statusOrder[b.status]) * dir);
        break;
      case 'health':
        sorted.sort((a, b) => (a.health - b.health) * dir);
        break;
      case 'generation':
        sorted.sort((a, b) => (a.generation - b.generation) * dir);
        break;
      case 'errorCount':
        sorted.sort((a, b) => (a.errorCount - b.errorCount) * dir);
        break;
      case 'lastSeen':
        sorted.sort(
          (a, b) =>
            (new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()) * dir
        );
        break;
    }
    return sorted;
  }, [filteredAgents, sortColumn, sortDirection]);

  const getSortIcon = useCallback(
    (column: SortColumn) => {
      if (sortColumn !== column) return '↕';
      if (sortDirection === 'asc') return '↑';
      if (sortDirection === 'desc') return '↓';
      return '↕';
    },
    [sortColumn, sortDirection]
  );

  const columnHeaders: { key: SortColumn; label: string; className?: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'STATUS' },
    { key: 'health', label: 'HEALTH' },
    { key: 'generation', label: 'GEN', className: 'text-center' },
    { key: 'errorCount', label: 'ERRORS', className: 'text-right' },
    { key: 'lastSeen', label: 'LAST SEEN', className: 'text-right' },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Filter chips */}
      <div className="flex shrink-0 flex-wrap gap-2 border-b border-[var(--bg-border)] px-4 py-2">
        {FILTER_CHIPS.map(chip => {
          const isActive = activeFilter === chip;
          const count =
            chip === 'All'
              ? agents.length
              : agents.filter(a => statusToFilterChip(a.status) === chip).length;
          return (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className="text-micro flex items-center gap-1 rounded px-2.5 py-1 transition-all duration-200"
              style={{
                background: isActive
                  ? 'rgba(0, 229, 255, 0.12)'
                  : 'transparent',
                color: isActive
                  ? 'var(--accent-cyan)'
                  : 'var(--text-tertiary)',
                border: isActive
                  ? '1px solid rgba(0, 229, 255, 0.3)'
                  : '1px solid var(--bg-border)',
              }}
            >
              {chip}
              <span
                className="text-micro"
                style={{
                  color: isActive
                    ? 'var(--accent-cyan)'
                    : 'var(--text-dim)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table header */}
      <div className="flex shrink-0 items-center border-b border-[var(--bg-border)] px-3 py-1">
        {columnHeaders.map(col => (
          <button
            key={col.key}
            onClick={() => handleSort(col.key)}
            className={`text-micro flex items-center gap-1 px-2 py-1 transition-colors hover:text-[var(--text-primary)] ${col.className || ''}`}
            style={{
              color:
                sortColumn === col.key
                  ? 'var(--accent-cyan)'
                  : 'var(--text-tertiary)',
              width:
                col.key === 'id'
                  ? '70px'
                  : col.key === 'status'
                    ? '90px'
                    : col.key === 'health'
                      ? '120px'
                      : col.key === 'generation'
                        ? '50px'
                        : col.key === 'errorCount'
                          ? '60px'
                          : '80px',
              minWidth:
                col.key === 'id'
                  ? '70px'
                  : col.key === 'status'
                    ? '90px'
                    : col.key === 'health'
                      ? '120px'
                      : col.key === 'generation'
                        ? '50px'
                        : col.key === 'errorCount'
                          ? '60px'
                          : '80px',
            }}
          >
            <span>{col.label}</span>
            <span
              className="text-micro"
              style={{
                opacity: sortColumn === col.key ? 1 : 0.3,
              }}
            >
              {getSortIcon(col.key)}
            </span>
          </button>
        ))}
      </div>

      {/* Scrollable agent list */}
      <div className="custom-scrollbar flex-1 overflow-y-auto overflow-x-auto">
        <AnimatePresence mode="popLayout">
          {sortedAgents.map((agent, index) => {
            const isChanged = changedIds.has(agent.id);
            const isCritical = agent.health < 40;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  backgroundColor: isChanged
                    ? 'rgba(0, 229, 255, 0.05)'
                    : isCritical
                      ? 'rgba(255, 23, 68, 0.03)'
                      : 'transparent',
                }}
                transition={{
                  opacity: { duration: 0.3, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
                  x: { duration: 0.3, ease: [0, 0, 0.2, 1] as [number, number, number, number] },
                  backgroundColor: { duration: 0.5 },
                  delay: Math.min(index * 0.03, 0.6),
                }}
                className="flex items-center border-b border-[rgba(30,41,59,0.4)] px-3 transition-colors duration-200 hover:bg-[rgba(255,255,255,0.02)]"
                style={{ height: '40px' }}
              >
                {/* ID */}
                <div
                  className="flex items-center gap-2"
                  style={{ width: '70px', minWidth: '70px' }}
                >
                  <div
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      background:
                        agent.status === 'ONLINE'
                          ? 'var(--accent-green)'
                          : agent.status === 'EVOLVING'
                            ? 'var(--accent-purple)'
                            : agent.status === 'DEAD'
                              ? 'var(--text-dim)'
                              : agent.status === 'CRITICAL'
                                ? 'var(--accent-red)'
                                : 'var(--accent-amber)',
                    }}
                  />
                  <span
                    className="text-mono truncate font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {agent.id}
                  </span>
                </div>

                {/* Status */}
                <div style={{ width: '90px', minWidth: '90px' }}>
                  <StatusBadge variant={statusToBadgeVariant(agent.status)}>
                    {agent.status}
                  </StatusBadge>
                </div>

                {/* Health */}
                <div
                  className="flex items-center gap-2"
                  style={{ width: '120px', minWidth: '120px' }}
                >
                  <div className="w-16">
                    <HealthBar value={agent.health} />
                  </div>
                  <span
                    className="text-micro tabular-nums"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {agent.health}%
                  </span>
                </div>

                {/* Gen */}
                <div
                  className="text-center"
                  style={{ width: '50px', minWidth: '50px' }}
                >
                  <span
                    className="text-mono font-bold"
                    style={{ color: 'var(--accent-purple)' }}
                  >
                    G-{agent.generation}
                  </span>
                </div>

                {/* Errors */}
                <div
                  className="flex items-center justify-end gap-1"
                  style={{ width: '60px', minWidth: '60px' }}
                >
                  <span
                    className="text-mono tabular-nums"
                    style={{
                      color:
                        agent.errorCount === 0
                          ? 'var(--text-dim)'
                          : agent.errorCount <= 5
                            ? 'var(--accent-amber)'
                            : 'var(--accent-red)',
                      fontWeight: agent.errorCount >= 6 ? 'bold' : 'normal',
                    }}
                  >
                    {agent.errorCount}
                  </span>
                </div>

                {/* Last Seen */}
                <div
                  className="text-right"
                  style={{ width: '80px', minWidth: '80px' }}
                >
                  <span
                    className="text-micro"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {formatLastSeen(agent.lastSeen)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {sortedAgents.length === 0 && (
          <div
            className="flex items-center justify-center py-8"
            style={{ color: 'var(--text-dim)' }}
          >
            <span className="text-micro">No agents match the selected filter</span>
          </div>
        )}
      </div>
    </div>
  );
}
