import { useState, useEffect, useCallback } from 'react';
import { Camera, Octagon, GitFork, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ButtonConfig {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  variant: 'default' | 'danger' | 'success' | 'purple';
  onClick: () => void;
}

function EmergencyHaltModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  const handleConfirm = () => {
    if (countdown > 0) return;
    toast.error('EMERGENCY HALT ACTIVATED — All agents terminated');
    setTimeout(() => onClose(), 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-[400px] overflow-hidden rounded-lg border border-[var(--accent-red)] p-6"
            style={{
              background: 'var(--bg-surface-elevated)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-h2 mb-3 text-[var(--accent-red)]">
              CONFIRM EMERGENCY HALT
            </h2>
            <p className="text-body mb-6 text-[var(--text-secondary)]">
              This will immediately terminate all swarm agents and stop all operations. This action cannot be undone.
            </p>

            <div className="mb-6 text-center">
              <span
                className="font-mono text-2xl font-bold text-[var(--accent-red)]"
                style={{
                  textShadow: countdown > 0 ? '0 0 20px var(--accent-red-glow)' : 'none',
                }}
              >
                {countdown > 0 ? `Halting in ${countdown}...` : 'READY'}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-md border border-[var(--bg-border-hover)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-surface-elevated)]"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirm}
                disabled={countdown > 0}
                className="flex-1 rounded-md px-4 py-2 font-mono text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40"
                style={{
                  background: countdown > 0 ? 'var(--bg-border)' : 'var(--accent-red)',
                }}
              >
                CONFIRM HALT
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InjectStrategyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) {
      toast.warning('Please enter strategy code');
      return;
    }
    toast.success(`Strategy injected: ${code.slice(0, 30)}...`);
    setCode('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-[500px] overflow-hidden rounded-lg border border-[var(--accent-purple)] p-6"
            style={{ background: 'var(--bg-surface-elevated)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-h2 mb-3 text-[var(--accent-purple)]">
              INJECT STRATEGY
            </h2>
            <p className="text-body mb-4 text-[var(--text-secondary)]">
              Enter strategy code to deploy to selected agents.
            </p>
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="(define strategy ... )"
              className="mb-4 h-32 w-full resize-none rounded-md border border-[var(--bg-border-hover)] bg-[var(--bg-base)] p-3 font-mono text-xs text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-[var(--accent-purple)] focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-md border border-[var(--bg-border-hover)] px-4 py-2 font-mono text-sm text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-surface-elevated)]"
              >
                CANCEL
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 rounded-md px-4 py-2 font-mono text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ background: 'var(--accent-purple)' }}
              >
                INJECT
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ControlUnit() {
  const [showHaltModal, setShowHaltModal] = useState(false);
  const [showInjectModal, setShowInjectModal] = useState(false);

  const handleSnapshot = useCallback(() => {
    toast.success('SNAPSHOT SAVED — 24 agents captured');
  }, []);

  const handleSaveGolden = useCallback(() => {
    toast.success('GOLDEN IMAGE PERSISTED — State saved to disk');
  }, []);

  const buttons: ButtonConfig[] = [
    {
      id: 'snapshot',
      label: 'SNAPSHOT',
      sublabel: 'Save full state',
      icon: <Camera className="h-3.5 w-3.5" />,
      variant: 'default',
      onClick: handleSnapshot,
    },
    {
      id: 'halt',
      label: 'HALT SWARM',
      sublabel: 'Stop all agents',
      icon: <Octagon className="h-3.5 w-3.5" />,
      variant: 'danger',
      onClick: () => setShowHaltModal(true),
    },
    {
      id: 'inject',
      label: 'INJECT',
      sublabel: 'Manual strategy',
      icon: <GitFork className="h-3.5 w-3.5" />,
      variant: 'purple',
      onClick: () => setShowInjectModal(true),
    },
    {
      id: 'golden',
      label: 'GOLDEN IMG',
      sublabel: 'Persist state',
      icon: <Save className="h-3.5 w-3.5" />,
      variant: 'success',
      onClick: handleSaveGolden,
    },
  ];

  const getVariantStyles = (variant: ButtonConfig['variant']) => {
    switch (variant) {
      case 'danger':
        return {
          borderColor: 'var(--accent-red)',
          hoverGlow: 'hover:shadow-glow-red',
          hoverBorder: 'hover:border-[var(--accent-red)]',
        };
      case 'success':
        return {
          borderColor: 'var(--accent-green)',
          hoverGlow: 'hover:shadow-glow-green',
          hoverBorder: 'hover:border-[var(--accent-green)]',
        };
      case 'purple':
        return {
          borderColor: 'var(--accent-purple)',
          hoverGlow: 'hover:shadow-glow-purple',
          hoverBorder: 'hover:border-[var(--accent-purple)]',
        };
      default:
        return {
          borderColor: 'var(--bg-border-hover)',
          hoverGlow: 'hover:shadow-glow-cyan',
          hoverBorder: 'hover:border-[var(--accent-cyan)]',
        };
    }
  };

  return (
    <>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ duration: 0.4, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="fixed right-3 top-1/2 z-40 w-[220px] -translate-y-1/2 overflow-hidden rounded-[8px_0_0_8px] border border-[var(--bg-border-hover)] p-3"
        style={{
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(12px)',
          borderLeftWidth: '3px',
          borderLeftColor: 'var(--accent-cyan)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Panel title */}
        <div className="mb-3 px-1">
          <h3 className="text-h3 text-[var(--accent-cyan)]">CONTROL UNIT</h3>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          {buttons.map((button) => {
            const styles = getVariantStyles(button.variant);
            return (
              <button
                key={button.id}
                onClick={button.onClick}
                className={`
                  flex w-full items-center gap-3 rounded-md border px-3 py-2.5
                  bg-transparent text-left
                  transition-all duration-200 ease-out
                  hover:bg-[var(--bg-surface-elevated)]
                  active:scale-[0.97]
                  ${styles.hoverGlow} ${styles.hoverBorder}
                `}
                style={{ borderColor: 'var(--bg-border-hover)' }}
              >
                <span className="text-[var(--text-secondary)]">{button.icon}</span>
                <div className="flex flex-col">
                  <span className="text-h3 leading-tight text-[var(--text-primary)]">
                    {button.label}
                  </span>
                  <span className="text-small text-[var(--text-tertiary)]">
                    {button.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Modals */}
      <EmergencyHaltModal
        isOpen={showHaltModal}
        onClose={() => setShowHaltModal(false)}
      />
      <InjectStrategyModal
        isOpen={showInjectModal}
        onClose={() => setShowInjectModal(false)}
      />
    </>
  );
}
