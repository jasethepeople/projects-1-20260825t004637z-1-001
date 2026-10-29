import { useState, useEffect, useRef } from 'react';
import {
  mockAgents,
  mockFitnessData,
  mockContainmentData,
  mockBlockedActions,
  mockLogs,
  mockSystemStatus,
  updateAgents,
  updateFitnessData,
  generateNewLogEntry,
} from '@/data/mockData';
import type {
  Agent,
  FitnessDataPoint,
  ContainmentLayer,
  BlockedAction,
  LogEntry,
  SystemStatus,
  TopologyNode,
  TopologyEdge,
  FlamegraphItem,
} from '@/data/mockData';

interface RealtimeData {
  agents: Agent[];
  topology: { nodes: TopologyNode[]; edges: TopologyEdge[] };
  fitness: FitnessDataPoint[];
  flamegraph: FlamegraphItem[];
  containment: ContainmentLayer[];
  blockedActions: BlockedAction[];
  logs: LogEntry[];
  systemStatus: SystemStatus;
}

export function useRealtimeData(): RealtimeData {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [fitness, setFitness] = useState<FitnessDataPoint[]>(mockFitnessData);
  const [containment] = useState<ContainmentLayer[]>(mockContainmentData);
  const [blockedActions] = useState<BlockedAction[]>(mockBlockedActions);
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(mockSystemStatus);

  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  const logsRef = useRef(logs);
  logsRef.current = logs;

  // Update agents every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => {
        const updated = updateAgents(prev);
        agentsRef.current = updated;
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update fitness every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setFitness(prev => updateFitnessData(prev));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add new log entries every 1-3 seconds
  useEffect(() => {
    const addLog = () => {
      const newLog = generateNewLogEntry(agentsRef.current);
      setLogs(prev => {
        const updated = [...prev, newLog];
        if (updated.length > 500) return updated.slice(-500);
        return updated;
      });
    };

    const scheduleNextLog = () => {
      const delay = 1000 + Math.random() * 2000;
      return setTimeout(() => {
        addLog();
        timeoutRef.current = scheduleNextLog();
      }, delay);
    };

    const timeoutRef = { current: scheduleNextLog() };

    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Update system status
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        uptime: prev.uptime + 1,
        agentCount: agentsRef.current.filter(a => a.status !== 'DEAD').length,
        swarmStatus: agentsRef.current.filter(a => a.status === 'CRITICAL' || a.status === 'DEAD').length > 5
          ? 'DEGRADED'
          : 'OPERATIONAL',
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    agents,
    topology: { nodes: [], edges: [] },
    fitness,
    flamegraph: [],
    containment,
    blockedActions,
    logs,
    systemStatus,
  };
}
