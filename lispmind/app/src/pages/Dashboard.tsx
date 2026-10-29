import { motion } from 'framer-motion';
import HeaderBar from '@/components/HeaderBar';
import ControlUnit from '@/components/ControlUnit';
import CRTEffect from '@/components/CRTEffect';
import Panel from '@/components/Panel';
import TopologyMap from '@/components/TopologyMap';
import AgentRegistry from '@/components/AgentRegistry';
import FitnessChart from '@/components/FitnessChart';
import Flamegraph from '@/components/Flamegraph';
import ContainmentPanel from '@/components/ContainmentPanel';
import LogsStream from '@/components/LogsStream';
import { useRealtimeData } from '@/hooks/useRealtimeData';

const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  }),
};

export default function Dashboard() {
  const { fitness, flamegraph } = useRealtimeData();

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-[var(--bg-base)]">
      <HeaderBar />
      <CRTEffect />

      <div
        className="grid h-[calc(100dvh-48px)] w-full gap-panel-gap p-panel-gap pt-[60px]"
        style={{
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: '1fr 1fr auto',
        }}
      >
        {/* Topology Map — col 1-3, rows 1-2 */}
        <motion.div
          custom={1}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="col-span-3 row-span-2 min-h-0"
        >
          <Panel
            title="MESH TOPOLOGY"
            subtitle="Gossip Protocol Peer Graph — Real-time"
          >
            <TopologyMap />
          </Panel>
        </motion.div>

        {/* Agent Registry — col 4-8, rows 1-2 */}
        <motion.div
          custom={2}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="col-span-5 row-span-2 min-h-0"
        >
          <Panel
            title="AGENT REGISTRY"
            subtitle="Swarm Population — 24 Active Agents"
            accentColor="var(--accent-green)"
          >
            <AgentRegistry />
          </Panel>
        </motion.div>

        {/* Fitness Chart — col 9-12, row 1 */}
        <motion.div
          custom={3}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="col-span-4 row-span-1 min-h-0"
        >
          <Panel
            title="EVOLUTIONARY FITNESS"
            subtitle="Fitness Trajectory & Strategy Mutations"
            accentColor="var(--accent-purple)"
          >
            <FitnessChart data={fitness} />
          </Panel>
        </motion.div>

        {/* Flamegraph — col 9-12, row 2 */}
        <motion.div
          custom={4}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="col-span-4 row-span-1 min-h-0"
        >
          <Panel
            title="CPU FLAMEGRAPH"
            subtitle="Per-Agent Function Hotspots — Aggregated"
            accentColor="var(--accent-amber)"
          >
            <Flamegraph data={flamegraph} />
          </Panel>
        </motion.div>

        {/* Containment & Policy — col 1-3, row 3 */}
        <motion.div
          custom={5}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="col-span-3 row-span-1 min-h-0"
        >
          <Panel
            title="CONTAINMENT & POLICY"
            subtitle="Safety Kernel — Live Enforcement"
            accentColor="var(--accent-red)"
          >
            <ContainmentPanel />
          </Panel>
        </motion.div>

        {/* System Logs — col 4-12, row 3 */}
        <motion.div
          custom={6}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          className="col-span-9 row-span-1 min-h-0"
        >
          <Panel
            title="SYSTEM LOGS"
            subtitle="Real-time Event Stream — Filterable"
            accentColor="var(--accent-blue)"
          >
            <LogsStream />
          </Panel>
        </motion.div>
      </div>

      <ControlUnit />
    </div>
  );
}
