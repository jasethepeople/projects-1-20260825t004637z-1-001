export type AgentStatus = 'ONLINE' | 'IDLE' | 'EVOLVING' | 'DEGRADED' | 'CRITICAL' | 'DEAD';

export interface Agent {
  id: string;
  status: AgentStatus;
  health: number;
  generation: number;
  errorCount: number;
  lastSeen: Date;
  capabilities: string[];
  fitness: number;
}

export interface TopologyNode {
  id: string;
  type: 'agent' | 'orchestrator';
  x: number;
  y: number;
  health: number;
  fitness: number;
}

export interface TopologyEdge {
  source: string;
  target: string;
  active: boolean;
  messageCount: number;
}

export interface FitnessDataPoint {
  timestamp: number;
  bestFitness: number;
  avgFitness: number;
  mutationRate: number;
}

export interface FlamegraphItem {
  name: string;
  percentage: number;
  category: 'network' | 'crypto' | 'exploit' | 'gossip' | 'system';
  calls: number;
  subItems?: { name: string; percentage: number }[];
}

export interface ContainmentLayer {
  name: string;
  icon: string;
  status: 'ACTIVE' | 'DEGRADED' | 'ENFORCED' | 'THROTTLED' | 'ARMED' | 'TRIGGERED' | 'BACKLOGGED' | 'VIOLATION' | 'BREACH';
  color: 'green' | 'amber' | 'red';
}

export interface BlockedAction {
  agent: string;
  action: string;
  rule: string;
  timestamp: Date;
}

export type LogSeverity = 'INFO' | 'WARN' | 'ERROR' | 'EVOLVE' | 'GOSSIP' | 'BIRTH' | 'DEATH' | 'HEAL';

export interface LogEntry {
  timestamp: Date;
  severity: LogSeverity;
  message: string;
}

export interface SystemStatus {
  agentCount: number;
  swarmStatus: 'OPERATIONAL' | 'DEGRADED' | 'HALTED';
  uptime: number;
  containmentStatus: 'green' | 'amber' | 'red';
}

// Helper to generate random items
const capabilities = [
  ['network_scan', 'exploit_buffer', 'privilege_escalation'],
  ['crypto_aes', 'hash_crack', 'key_exchange'],
  ['gossip_protocol', 'mesh_join', 'heartbeat'],
  ['fitness_eval', 'strategy_mutate', 'genetic_crossover'],
  ['packet_capture', 'deep_inspect', 'flow_analysis'],
  ['shellcode_inject', 'rop_chain', 'heap_spray'],
  ['lateral_move', 'credential_harvest', 'persistence'],
  ['recon_passive', 'os_fingerprint', 'service_scan'],
];

const agentStatuses: AgentStatus[] = ['ONLINE', 'IDLE', 'EVOLVING', 'DEGRADED', 'CRITICAL', 'DEAD'];
const statusWeights = [0.35, 0.15, 0.2, 0.15, 0.1, 0.05];

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

function getHealthForStatus(status: AgentStatus): number {
  switch (status) {
    case 'ONLINE': return 80 + Math.random() * 20;
    case 'IDLE': return 60 + Math.random() * 30;
    case 'EVOLVING': return 50 + Math.random() * 40;
    case 'DEGRADED': return 30 + Math.random() * 30;
    case 'CRITICAL': return 5 + Math.random() * 20;
    case 'DEAD': return 0;
  }
}

// Generate 24 agents
export function generateMockAgents(): Agent[] {
  return Array.from({ length: 24 }, (_, i) => {
    const id = `A-${String(i + 1).padStart(2, '0')}`;
    const status = weightedRandom(agentStatuses, statusWeights);
    const health = Math.round(getHealthForStatus(status));
    return {
      id,
      status,
      health,
      generation: Math.floor(Math.random() * 20) + 1,
      errorCount: status === 'DEAD' ? Math.floor(Math.random() * 10) + 5 :
                  status === 'CRITICAL' ? Math.floor(Math.random() * 5) + 1 :
                  Math.floor(Math.random() * 3),
      lastSeen: new Date(Date.now() - Math.floor(Math.random() * 300000)),
      capabilities: capabilities[i % capabilities.length],
      fitness: Math.random() * 0.4 + 0.5,
    };
  });
}

// Generate topology nodes
export function generateTopologyNodes(agents: Agent[]): TopologyNode[] {
  const nodes: TopologyNode[] = agents.map((agent, i) => ({
    id: agent.id,
    type: 'agent' as const,
    x: 100 + Math.cos(i * 0.52) * (150 + Math.random() * 100),
    y: 100 + Math.sin(i * 0.52) * (150 + Math.random() * 100),
    health: agent.health,
    fitness: agent.fitness,
  }));

  nodes.push({
    id: 'ORCH',
    type: 'orchestrator',
    x: 250,
    y: 200,
    health: 100,
    fitness: 1.0,
  });

  return nodes;
}

// Generate topology edges
export function generateTopologyEdges(agents: Agent[]): TopologyEdge[] {
  const edges: TopologyEdge[] = [];
  const agentIds = agents.map(a => a.id);

  // Connect each agent to 2-4 random peers
  agentIds.forEach((id) => {
    const connectionCount = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...agentIds].filter(a => a !== id).sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(connectionCount, shuffled.length); i++) {
      const target = shuffled[i];
      // Avoid duplicate edges
      const exists = edges.some(e =>
        (e.source === id && e.target === target) ||
        (e.source === target && e.target === id)
      );
      if (!exists) {
        edges.push({
          source: id,
          target,
          active: Math.random() > 0.3,
          messageCount: Math.floor(Math.random() * 500) + 10,
        });
      }
    }
  });

  // Connect all agents to orchestrator
  agentIds.forEach((id) => {
    edges.push({
      source: id,
      target: 'ORCH',
      active: true,
      messageCount: Math.floor(Math.random() * 1000) + 100,
    });
  });

  return edges;
}

// Generate 60 fitness data points
export function generateFitnessData(): FitnessDataPoint[] {
  const data: FitnessDataPoint[] = [];
  let bestFitness = 0.6;
  let avgFitness = 0.5;
  const now = Date.now();

  for (let i = 0; i < 60; i++) {
    bestFitness = Math.min(0.95, Math.max(0.4, bestFitness + (Math.random() - 0.45) * 0.03));
    avgFitness = Math.min(0.9, Math.max(0.3, avgFitness + (Math.random() - 0.48) * 0.025));
    data.push({
      timestamp: now - (59 - i) * 1000,
      bestFitness: Math.round(bestFitness * 1000) / 1000,
      avgFitness: Math.round(avgFitness * 1000) / 1000,
      mutationRate: Math.round(Math.random() * 15 * 10) / 10,
    });
  }

  return data;
}

// Generate flamegraph data
export function generateFlamegraphData(): FlamegraphItem[] {
  return [
    {
      name: 'exploit_buffer_overflow',
      percentage: 34.2,
      category: 'exploit',
      calls: 1247,
      subItems: [
        { name: 'check_canary', percentage: 12.1 },
        { name: 'inject_shellcode', percentage: 22.1 },
      ],
    },
    {
      name: 'crypto_aes_encrypt',
      percentage: 24.1,
      category: 'crypto',
      calls: 892,
      subItems: [
        { name: 'expand_key', percentage: 8.3 },
        { name: 'cipher_block', percentage: 15.8 },
      ],
    },
    {
      name: 'gossip_send_message',
      percentage: 15.8,
      category: 'gossip',
      calls: 534,
      subItems: [
        { name: 'serialize_msg', percentage: 5.2 },
        { name: 'broadcast', percentage: 10.6 },
      ],
    },
    {
      name: 'mesh_topology_update',
      percentage: 12.3,
      category: 'network',
      calls: 412,
      subItems: [
        { name: 'recompute_routes', percentage: 7.1 },
        { name: 'send_heartbeat', percentage: 5.2 },
      ],
    },
    {
      name: 'fitness_evaluate',
      percentage: 8.7,
      category: 'system',
      calls: 298,
    },
    {
      name: 'strategy_mutate',
      percentage: 5.4,
      category: 'system',
      calls: 187,
    },
    {
      name: 'agent_spawn_child',
      percentage: 3.2,
      category: 'system',
      calls: 98,
    },
    {
      name: 'safety_kernel_check',
      percentage: 1.8,
      category: 'system',
      calls: 56,
    },
  ];
}

// Generate containment data
export function generateContainmentData(): ContainmentLayer[] {
  return [
    { name: 'ACTION FILTER', icon: 'Filter', status: 'ACTIVE', color: 'green' },
    { name: 'RATE LIMITER', icon: 'Gauge', status: 'THROTTLED', color: 'amber' },
    { name: 'ISOLATION', icon: 'Lock', status: 'ENFORCED', color: 'green' },
    { name: 'AUDIT LOG', icon: 'FileText', status: 'ACTIVE', color: 'green' },
    { name: 'KILL SWITCH', icon: 'Zap', status: 'ARMED', color: 'green' },
    { name: 'POLICY ENGINE', icon: 'Scale', status: 'ACTIVE', color: 'green' },
  ];
}

// Generate blocked actions
export function generateBlockedActions(): BlockedAction[] {
  return [
    { agent: 'A-12', action: 'network_scan_aggressive', rule: 'rate-limit-scan', timestamp: new Date(Date.now() - 14000) },
    { agent: 'A-03', action: 'exploit_kernel_module', rule: 'kernel-protected', timestamp: new Date(Date.now() - 28000) },
    { agent: 'A-19', action: 'unauthorized_fork', rule: 'max-children', timestamp: new Date(Date.now() - 41000) },
  ];
}

// Generate log entries
export function generateMockLogs(): LogEntry[] {
  const messages = [
    { severity: 'EVOLVE' as LogSeverity, message: 'Agent A-07 → Gen 12 | fitness: 0.847→0.891 | strategy: exploit-v3' },
    { severity: 'GOSSIP' as LogSeverity, message: 'A-03 → A-19 | msg: peer_state_update | latency: 12ms' },
    { severity: 'BIRTH' as LogSeverity, message: 'Agent A-25 spawned | parent: A-07 | gen: 12 | fitness: 0.823' },
    { severity: 'HEAL' as LogSeverity, message: 'Agent A-14 recovered | health: 23%→67% | auto-restart: success' },
    { severity: 'WARN' as LogSeverity, message: 'Agent A-09 | health dropping: 71%→54% | cause: memory_pressure' },
    { severity: 'ERROR' as LogSeverity, message: 'Agent A-11 | exploit_timeout | target: 192.168.1.47 | retry: 2/3' },
    { severity: 'DEATH' as LogSeverity, message: 'Agent A-04 terminated | health: 0% | uptime: 14m 32s | cause: OOM' },
    { severity: 'INFO' as LogSeverity, message: 'Swarm snapshot saved | size: 2.4MB | agents: 24 | timestamp: 1699124834' },
    { severity: 'INFO' as LogSeverity, message: 'Topology rebalanced | partitions: 3 | convergence: 98.2%' },
    { severity: 'WARN' as LogSeverity, message: 'Agent A-17 | high CPU usage: 94% | throttling engaged' },
    { severity: 'EVOLVE' as LogSeverity, message: 'Agent A-02 → Gen 8 | fitness: 0.712→0.756 | strategy: brute-force-v2' },
    { severity: 'GOSSIP' as LogSeverity, message: 'A-11 → A-05 | msg: fitness_broadcast | best: 0.891' },
    { severity: 'ERROR' as LogSeverity, message: 'Agent A-06 | connection_refused | target: 10.0.0.47:443' },
    { severity: 'HEAL' as LogSeverity, message: 'Agent A-20 | memory purged | freed: 412MB | health: 45%→62%' },
    { severity: 'INFO' as LogSeverity, message: 'Containment layer 2 (rate limiter) throttled agent A-12' },
    { severity: 'WARN' as LogSeverity, message: 'Agent A-08 | packet loss: 23% | route degradation detected' },
    { severity: 'EVOLVE' as LogSeverity, message: 'Agent A-15 → Gen 15 | fitness: 0.823→0.867 | mutation: crossover' },
    { severity: 'BIRTH' as LogSeverity, message: 'Agent A-26 spawned | parent: A-15 | gen: 16 | fitness: 0.845' },
    { severity: 'GOSSIP' as LogSeverity, message: 'A-07 → ALL | msg: strategy_share | payload: 1.2KB' },
    { severity: 'ERROR' as LogSeverity, message: 'Agent A-13 | stack_overflow | function: recursive_scan | restarting' },
  ];

  const logs: LogEntry[] = [];
  const now = Date.now();
  for (let i = 0; i < 50; i++) {
    const msgTemplate = messages[i % messages.length];
    logs.push({
      timestamp: new Date(now - (50 - i) * 2500 + Math.random() * 1000),
      severity: msgTemplate.severity,
      message: msgTemplate.message,
    });
  }

  return logs;
}

// Initial system status
export function generateSystemStatus(): SystemStatus {
  return {
    agentCount: 24,
    swarmStatus: 'OPERATIONAL',
    uptime: 14 * 3600 + 23 * 60 + 7,
    containmentStatus: 'green',
  };
}

// Update functions for simulation
export function updateAgents(agents: Agent[]): Agent[] {
  return agents.map(agent => {
    if (agent.status === 'DEAD') return agent;

    const healthDelta = (Math.random() - 0.52) * 3;
    const newHealth = Math.max(0, Math.min(100, agent.health + healthDelta));

    let newStatus: AgentStatus = agent.status;
    if (newHealth <= 0) newStatus = 'DEAD';
    else if (newHealth < 20) newStatus = 'CRITICAL';
    else if (newHealth < 50) newStatus = 'DEGRADED';
    else if (newHealth > 75 && agent.status === 'DEGRADED') newStatus = 'ONLINE';
    else if (newHealth > 60 && agent.status === 'CRITICAL') newStatus = 'DEGRADED';

    // Small chance to evolve
    if (Math.random() < 0.02 && newHealth > 50) {
      newStatus = 'EVOLVING';
    }

    return {
      ...agent,
      health: Math.round(newHealth),
      status: newStatus,
      fitness: Math.min(0.95, Math.max(0.3, agent.fitness + (Math.random() - 0.48) * 0.01)),
      lastSeen: new Date(),
    };
  });
}

export function updateFitnessData(data: FitnessDataPoint[]): FitnessDataPoint[] {
  const last = data[data.length - 1];
  const newBest = Math.min(0.95, Math.max(0.4, last.bestFitness + (Math.random() - 0.45) * 0.02));
  const newAvg = Math.min(0.9, Math.max(0.3, last.avgFitness + (Math.random() - 0.48) * 0.015));
  const newMutation = Math.round(Math.random() * 15 * 10) / 10;

  return [
    ...data.slice(1),
    {
      timestamp: Date.now(),
      bestFitness: Math.round(newBest * 1000) / 1000,
      avgFitness: Math.round(newAvg * 1000) / 1000,
      mutationRate: newMutation,
    },
  ];
}

export function generateNewLogEntry(agents: Agent[]): LogEntry {
  const severities: LogSeverity[] = ['INFO', 'WARN', 'EVOLVE', 'GOSSIP', 'HEAL'];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const now = new Date();

  const messages: Record<LogSeverity, string> = {
    INFO: `Swarm heartbeat | agents: ${agents.filter(a => a.status !== 'DEAD').length} active | load: ${Math.round(Math.random() * 40 + 30)}%`,
    WARN: `Agent ${agent.id} | health declining: ${agent.health}% | check recommended`,
    ERROR: `Agent ${agent.id} | operation_failed | retrying...`,
    EVOLVE: `Agent ${agent.id} → Gen ${agent.generation} | fitness: ${agent.fitness.toFixed(3)} | adapting strategy`,
    GOSSIP: `${agent.id} → peers | state_sync | latency: ${Math.floor(Math.random() * 20 + 2)}ms`,
    BIRTH: `Agent spawned | parent: ${agent.id} | swarm size: ${agents.length + 1}`,
    DEATH: `Agent ${agent.id} | health critical | shutting down`,
    HEAL: `Agent ${agent.id} | auto-recovery | health: ${agent.health}%`,
  };

  return {
    timestamp: now,
    severity,
    message: messages[severity],
  };
}

// Initial data
export const mockAgents = generateMockAgents();
export const mockTopologyNodes = generateTopologyNodes(mockAgents);
export const mockTopologyEdges = generateTopologyEdges(mockAgents);
export const mockFitnessData = generateFitnessData();
export const mockFlamegraphData = generateFlamegraphData();
export const mockContainmentData = generateContainmentData();
export const mockBlockedActions = generateBlockedActions();
export const mockLogs = generateMockLogs();
export const mockSystemStatus = generateSystemStatus();
