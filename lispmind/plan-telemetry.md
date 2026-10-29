# LISPMIND v2.1 — Telemetry Bridge & Safety Circuit Breaker

## Stage 1: Lisp Backend (3 parallel agents)

### Agent 1: Telemetry_Engineer — `telemetry.lisp` + `websocket.lisp`
- WebSocket server using websocket-driver
- JSON schema encoding (cl-json)
- `*dashboard-clients*` hash-table
- `stream-telemetry` function — broadcasts metrics every 500ms
- `calculate-success-rate`, `calculate-rejection-rate`, `calculate-containment-score`
- `start-telemetry-server`, `stop-telemetry-server`

### Agent 2: Safety_Engineer — Emergency Halt + Alert Thresholds
- `emergency-halt` condition class in conditions.lisp
- `containment-score-circuit-breaker` in orchestrator.lisp
- `monitor-swarm-health` with thresholds:
  - Rejection rate > 15% → auto-pause evolution
  - Success rate < 5% over 10min → auto-tune
  - Containment score < 0.8 → emergency halt
- `trigger-emergency-halt` global function
- `resume-in-safe-mode` restart

### Agent 3: Dashboard_Telemetry_Engineer — React WebSocket + Visualizations
- Update `useRealtimeData.ts` — WebSocket client consuming JSON schema
- `ContainmentGauge.tsx` — radial gauge showing Containment Integrity (C)
- `FitnessSafetyManifold.tsx` — bivariate scatter plot: Success Rate vs Rejection Rate
- `AlertPanel.tsx` — active alerts with severity colors, dismiss/acknowledge
- Update `Dashboard.tsx` to include new panels
- Color C < 0.8 → amber/red dashboard, force golden image checkpoint

## Stage 2: Integration
- Wire `stream-telemetry` into `monitor-loop-v2`
- Final build + deploy
