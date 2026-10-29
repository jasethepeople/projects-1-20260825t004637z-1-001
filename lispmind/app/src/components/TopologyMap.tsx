import { useRef, useEffect, useState, useCallback } from 'react';
import { mockTopologyNodes, mockTopologyEdges } from '@/data/mockData';
import type { TopologyNode, TopologyEdge, AgentStatus } from '@/data/mockData';
import { useRealtimeData } from '@/hooks/useRealtimeData';

interface TooltipData {
  x: number;
  y: number;
  node: TopologyNode & { status?: AgentStatus; peerCount?: number };
}

const NODE_RADIUS = 8;
const ORCH_RADIUS = 14;
const PULSE_SPEED = 0.003;
const EDGE_PULSE_SPEED = 0.002;

function getNodeColor(health: number, type: string): string {
  if (type === 'orchestrator') return 'var(--accent-cyan)';
  if (health > 80) return 'var(--accent-green)';
  if (health > 40) return 'var(--accent-amber)';
  if (health > 0) return 'var(--accent-red)';
  return 'var(--text-dim)';
}

function getNodeGlow(health: number, type: string): string {
  if (type === 'orchestrator') return 'rgba(0, 229, 255, 0.5)';
  if (health > 80) return 'rgba(0, 230, 118, 0.4)';
  if (health > 40) return 'rgba(255, 179, 0, 0.3)';
  if (health > 0) return 'rgba(255, 23, 68, 0.4)';
  return 'transparent';
}

function getNodeRadius(type: string): number {
  return type === 'orchestrator' ? ORCH_RADIUS : NODE_RADIUS;
}

// Build a simple force simulation
function runForceSimulation(
  nodes: TopologyNode[],
  edges: TopologyEdge[],
  width: number,
  height: number,
  iterations: number
): TopologyNode[] {
  const simulated = nodes.map(n => ({ ...n }));
  const centerX = width / 2;
  const centerY = height / 2;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    for (let i = 0; i < simulated.length; i++) {
      for (let j = i + 1; j < simulated.length; j++) {
        const dx = simulated[j].x - simulated[i].x;
        const dy = simulated[j].y - simulated[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 3000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        simulated[i].x -= fx;
        simulated[i].y -= fy;
        simulated[j].x += fx;
        simulated[j].y += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = simulated.find(n => n.id === edge.source);
      const target = simulated.find(n => n.id === edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * 0.001;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      source.x += fx;
      source.y += fy;
      target.x -= fx;
      target.y -= fy;
    }

    // Pull orchestrator to center
    const orch = simulated.find(n => n.type === 'orchestrator');
    if (orch) {
      orch.x += (centerX - orch.x) * 0.1;
      orch.y += (centerY - orch.y) * 0.1;
    }

    // Pull all agents toward center slightly
    for (const node of simulated) {
      node.x += (centerX - node.x) * 0.005;
      node.y += (centerY - node.y) * 0.005;
    }
  }

  return simulated;
}

export default function TopologyMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<TopologyNode[]>([]);
  const timeRef = useRef(0);
  const hoveredNodeRef = useRef<string | null>(null);
  const agentsDataRef = useRef<Record<string, { status: AgentStatus; health: number }>>({});

  const { agents } = useRealtimeData();

  // Sync agents data for health/status lookup
  useEffect(() => {
    const map: Record<string, { status: AgentStatus; health: number }> = {};
    for (const agent of agents) {
      map[agent.id] = { status: agent.status, health: agent.health };
    }
    agentsDataRef.current = map;
  }, [agents]);

  // Initialize and run simulation
  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const simulated = runForceSimulation(
      mockTopologyNodes,
      mockTopologyEdges,
      dimensions.width,
      dimensions.height,
      300
    );
    nodesRef.current = simulated;
  }, [dimensions]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Mouse move handler for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found: TopologyNode | null = null;
      for (const node of nodesRef.current) {
        const r = getNodeRadius(node.type) + 4;
        const dx = mx - node.x;
        const dy = my - node.y;
        if (dx * dx + dy * dy < r * r) {
          found = node;
          break;
        }
      }

      if (found) {
        hoveredNodeRef.current = found.id;
        const peerCount = mockTopologyEdges.filter(
          e => e.source === found!.id || e.target === found!.id
        ).length;
        const agentInfo = agentsDataRef.current[found.id];
        setTooltip({
          x: mx + 12,
          y: my - 12,
          node: {
            ...found,
            status: agentInfo?.status || (found.type === 'orchestrator' ? 'ONLINE' : 'IDLE'),
            peerCount,
          },
        });
      } else {
        hoveredNodeRef.current = null;
        setTooltip(null);
      }
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    hoveredNodeRef.current = null;
    setTooltip(null);
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 16;
      const t = timeRef.current;
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const nodes = nodesRef.current;
      const edges = mockTopologyEdges;
      const hoveredId = hoveredNodeRef.current;

      // Draw edges
      for (const edge of edges) {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) continue;

        const isActive = edge.active;
        const isHovered =
          hoveredId && (edge.source === hoveredId || edge.target === hoveredId);

        // Edge pulse animation
        let opacity = 0.2;
        if (isActive) {
          const pulse = Math.sin(t * EDGE_PULSE_SPEED + edge.messageCount) * 0.5 + 0.5;
          opacity = 0.3 + pulse * 0.5;
        }
        if (isHovered) {
          opacity = 0.9;
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
        ctx.lineWidth = isHovered ? 2 : isActive ? 1.5 : 1;
        ctx.stroke();

        // Animated dash on active edges
        if (isActive) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.setLineDash([4, 8]);
          ctx.lineDashOffset = -t * 0.02;
          ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const isHovered = hoveredId === node.id;
        const baseRadius = getNodeRadius(node.type);
        const agentInfo = agentsDataRef.current[node.id];
        const health = agentInfo ? agentInfo.health : node.health;

        // Pulse animation for healthy nodes
        let radius = baseRadius;
        if (node.type === 'orchestrator') {
          const pulse = Math.sin(t * PULSE_SPEED) * 0.15 + 1;
          radius = baseRadius * pulse;
        } else if (health > 50) {
          const pulse = Math.sin(t * PULSE_SPEED * 1.2 + node.x) * 0.12 + 1;
          radius = baseRadius * pulse;
        }

        if (isHovered) {
          radius *= 1.3;
        }

        const color = getNodeColor(health, node.type);
        const glow = getNodeGlow(health, node.type);

        // Glow effect
        if (glow !== 'transparent') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = glow.replace(/[\d.]+\)$/, '0.15)');
          ctx.fill();
        }

        // Node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Inner highlight for depth
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();

        // Dashed border for dead agents
        if (health <= 0 && node.type !== 'orchestrator') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'var(--text-dim)';
          ctx.setLineDash([2, 3]);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Label below node
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(node.id, node.x, node.y + radius + 6);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [dimensions]);

  return (
    <div ref={containerRef} className="relative flex h-full w-full flex-col">
      {/* Canvas */}
      <div className="relative flex-1">
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: dimensions.width,
            height: dimensions.height - 28,
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-50 rounded-md border border-[var(--bg-border-hover)] px-3 py-2 shadow-xl"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              background: 'var(--bg-surface-elevated)',
            }}
          >
            <div className="text-micro mb-1" style={{ color: 'var(--text-primary)' }}>
              {tooltip.node.type === 'orchestrator' ? 'ORCHESTRATOR' : tooltip.node.id}
            </div>
            <div className="text-micro" style={{ color: 'var(--text-secondary)' }}>
              Health:{` `}
              <span
                style={{
                  color:
                    (tooltip.node.health ?? 0) > 80
                      ? 'var(--accent-green)'
                      : (tooltip.node.health ?? 0) > 40
                        ? 'var(--accent-amber)'
                        : 'var(--accent-red)',
                }}
              >
                {tooltip.node.health ?? 0}%
              </span>
            </div>
            {tooltip.node.status && (
              <div className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                Status:{` `}
                <span
                  style={{
                    color:
                      tooltip.node.status === 'ONLINE'
                        ? 'var(--accent-green)'
                        : tooltip.node.status === 'EVOLVING'
                          ? 'var(--accent-purple)'
                          : tooltip.node.status === 'DEAD'
                            ? 'var(--accent-red)'
                            : tooltip.node.status === 'CRITICAL'
                              ? 'var(--accent-red)'
                              : 'var(--accent-amber)',
                  }}
                >
                  {tooltip.node.status}
                </span>
              </div>
            )}
            {tooltip.node.peerCount !== undefined && (
              <div className="text-micro" style={{ color: 'var(--text-secondary)' }}>
                Peers:{` `}
                <span style={{ color: 'var(--accent-cyan)' }}>{tooltip.node.peerCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend bar */}
      <div className="flex h-7 shrink-0 items-center gap-4 border-t border-[var(--bg-border)] px-3">
        <div className="flex items-center gap-1.5">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--accent-green)' }}
          />
          <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>
            HEALTHY
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--accent-amber)' }}
          />
          <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>
            DEGRADED
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'var(--accent-red)' }}
          />
          <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>
            CRITICAL
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-[2px] w-3"
            style={{ background: 'var(--accent-cyan)' }}
          />
          <span className="text-micro" style={{ color: 'var(--text-tertiary)' }}>
            GOSSIP LINK
          </span>
        </div>
      </div>
    </div>
  );
}
