import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Gauge,
  Lock,
  ClipboardList,
  Power,
  BookOpen,
  Ban,
} from 'lucide-react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import type { ContainmentLayer } from '@/data/mockData';

const layerIcons: Record<string, React.ElementType> = {
  'ACTION FILTER': Shield,
  'RATE LIMITER': Gauge,
  'ISOLATION': Lock,
  'AUDIT LOG': ClipboardList,
  'KILL SWITCH': Power,
  'POLICY ENGINE': BookOpen,
};

const layerDescriptions: Record<string, string> = {
  'ACTION FILTER': 'Filters unauthorized agent actions',
  'RATE LIMITER': 'Throttles excessive operation rates',
  'ISOLATION': 'Contains compromised agents',
  'AUDIT LOG': 'Records all policy decisions',
  'KILL SWITCH': 'Emergency agent termination',
  'POLICY ENGINE': 'Evaluates rule compliance',
};

const statusColorMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  green: {
    text: 'var(--accent-green)',
    bg: 'rgba(0, 230, 118, 0.06)',
    border: 'rgba(0, 230, 118, 0.2)',
    glow: 'var(--accent-green-glow)',
  },
  amber: {
    text: 'var(--accent-amber)',
    bg: 'rgba(255, 179, 0, 0.06)',
    border: 'rgba(255, 179, 0, 0.2)',
    glow: 'var(--accent-amber-glow)',
  },
  red: {
    text: 'var(--accent-red)',
    bg: 'rgba(255, 23, 68, 0.06)',
    border: 'rgba(255, 23, 68, 0.2)',
    glow: 'var(--accent-red-glow)',
  },
};

function getOverallStatus(layers: ContainmentLayer[]) {
  const hasRed = layers.some((l) => l.color === 'red');
  const hasAmber = layers.some((l) => l.color === 'amber');
  if (hasRed) return { label: 'CONTAINMENT: BREACH', color: 'red' as const };
  if (hasAmber) return { label: 'CONTAINMENT: DEGRADED', color: 'amber' as const };
  return { label: 'CONTAINMENT: ACTIVE', color: 'green' as const };
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export default function ContainmentPanel() {
  const { containment, blockedActions } = useRealtimeData();

  const overall = useMemo(() => getOverallStatus(containment), [containment]);
  const overallColors = statusColorMap[overall.color];

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
      {/* Overall Status Banner */}
      <div
        className="flex items-center gap-2 rounded-md px-3 py-1.5"
        style={{
          background: overallColors.bg,
          border: `1px solid ${overallColors.border}`,
        }}
      >
        <Shield
          size={14}
          style={{ color: overallColors.text }}
        />
        <span
          className="text-micro font-bold uppercase"
          style={{ color: overallColors.text }}
        >
          {overall.label}
        </span>
      </div>

      {/* Safety Kernel Grid — 3×2 */}
      <div className="grid grid-cols-3 gap-2">
        {containment.map((layer, i) => {
          const Icon = layerIcons[layer.name] || Shield;
          const colors = statusColorMap[layer.color];
          const desc = layerDescriptions[layer.name] || '';

          return (
            <motion.div
              key={layer.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.4 + i * 0.05,
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
              }}
              className="flex flex-col gap-1 rounded-md p-2"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
              }}
              title={desc}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={14} style={{ color: colors.text }} />
                <span
                  className="text-micro uppercase"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {layer.name}
                </span>
              </div>
              <span
                className="text-[11px] font-bold uppercase"
                style={{ color: colors.text, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {layer.status}
              </span>
              <span
                className="truncate text-[9px]"
                style={{ color: 'var(--text-tertiary)', fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {desc}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Blocked Actions List */}
      <div className="mt-1 flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1 flex items-center gap-2 px-1">
          <span
            className="text-micro uppercase"
            style={{ color: 'var(--text-tertiary)' }}
          >
            BLOCKED ACTIONS
          </span>
          {blockedActions.length > 0 && (
            <span
              className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold"
              style={{
                background: 'rgba(255, 23, 68, 0.2)',
                color: 'var(--accent-red)',
              }}
            >
              {blockedActions.length}
            </span>
          )}
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {blockedActions.length === 0 ? (
            <div
              className="py-4 text-center text-micro"
              style={{ color: 'var(--text-dim)' }}
            >
              No blocked actions
            </div>
          ) : (
            blockedActions.map((action, i) => {
              const isCritical = action.rule.includes('kernel') || action.action.includes('exploit');
              const borderColor = isCritical
                ? 'rgba(255, 23, 68, 0.3)'
                : 'rgba(255, 179, 0, 0.3)';
              const bgColor = isCritical
                ? 'rgba(255, 23, 68, 0.03)'
                : 'transparent';

              return (
                <motion.div
                  key={`${action.agent}-${action.timestamp.getTime()}-${i}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{
                    delay: 0.5 + i * 0.08,
                    duration: 0.3,
                    ease: [0, 0, 0.2, 1] as [number, number, number, number],
                  }}
                  className="mb-1 flex items-center gap-2 rounded-md border px-2 py-1.5"
                  style={{
                    borderColor,
                    background: bgColor,
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                >
                  <Ban
                    size={12}
                    style={{ color: 'var(--accent-red)', flexShrink: 0 }}
                  />
                  <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
                    <span
                      className="truncate text-[11px]"
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {action.agent}
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>→</span>
                    <span
                      className="truncate text-[11px]"
                      style={{
                        color: 'var(--text-secondary)',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {action.action}
                    </span>
                  </div>
                  <span
                    className="shrink-0 truncate text-[10px]"
                    style={{
                      color: 'var(--accent-amber)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {action.rule}
                  </span>
                  <span
                    className="shrink-0 text-[9px]"
                    style={{
                      color: 'var(--text-tertiary)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {formatRelativeTime(action.timestamp)}
                  </span>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
