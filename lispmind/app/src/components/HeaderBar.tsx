import { useState, useEffect, useMemo } from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import StatusBadge from './StatusBadge';

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatUTC(date: Date): string {
  return date.toISOString().slice(11, 19);
}

export default function HeaderBar() {
  const { systemStatus } = useRealtimeData();
  const [now, setNow] = useState(new Date());
  const [showColon, setShowColon] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setShowColon(prev => !prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const statusVariant = useMemo(() => {
    switch (systemStatus.swarmStatus) {
      case 'OPERATIONAL': return 'online' as const;
      case 'DEGRADED': return 'warning' as const;
      case 'HALTED': return 'critical' as const;
    }
  }, [systemStatus.swarmStatus]);

  return (
    <motion.header
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center justify-between px-5"
      style={{
        background: 'var(--bg-base)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--bg-border)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-[var(--accent-cyan)]" />
        <div className="flex flex-col">
          <span
            className="font-mono text-lg font-bold leading-tight tracking-wide text-[var(--accent-cyan)]"
            style={{ textShadow: '0 0 10px var(--accent-cyan-glow)' }}
          >
            LISPMIND
          </span>
          <span className="text-micro tracking-[0.08em] text-[var(--text-tertiary)]">
            AUTONOMOUS OFFENSIVE SWARM
          </span>
        </div>
      </div>

      {/* Center: System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex items-center gap-4"
      >
        {/* Agent Count */}
        <div className="flex items-center gap-2">
          <span className="text-small text-[var(--text-secondary)]">AGENTS:</span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-green)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
            </span>
            <span className="font-mono text-sm font-bold text-[var(--accent-green)]">
              {systemStatus.agentCount}
            </span>
          </div>
        </div>

        {/* Divider */}
        <span className="text-[var(--bg-border)]">|</span>

        {/* Swarm Status */}
        <StatusBadge variant={statusVariant}>
          {systemStatus.swarmStatus}
        </StatusBadge>

        {/* Divider */}
        <span className="text-[var(--bg-border)]">|</span>

        {/* Uptime */}
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          UP: {formatUptime(systemStatus.uptime)}
        </span>
      </motion.div>

      {/* Right: Clock + Connection */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="flex items-center gap-3"
      >
        {/* UTC Clock */}
        <span className="font-mono text-[13px] text-[var(--text-primary)]">
          {formatUTC(now).split(':').map((part, i) => (
            <span key={i}>
              {i > 0 && (
                <span style={{ opacity: showColon ? 1 : 0.3, transition: 'opacity 0.1s' }}>:</span>
              )}
              {part}
            </span>
          ))}
          {' '}UTC
        </span>

        {/* Connection Dot */}
        <div className="relative flex h-2 w-2">
          <span
            className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--accent-green)]"
          />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-green)]" />
        </div>
      </motion.div>
    </motion.header>
  );
}
