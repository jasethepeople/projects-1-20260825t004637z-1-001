# LISPMIND Evolution — Distributed Immortal Swarm Expansion Plan

## New Modules (4 core + 3 integration)

### Stage 1 — Core Modules (4 parallel agents)
| Module | File | Agent | Purpose |
|--------|------|-------|---------|
| Evolution Engine | `evolution.lisp` | Evolution_Architect | MGL-GPR bridge, genetic strategy evolution, `define-evolving-agent` macro |
| Gossip Protocol | `gossip.lisp` | Gossip_Engineer | ZeroMQ pub/sub mesh, topic-based messaging, peer discovery |
| Image Persistence | `image-persist.lisp` | Resurrection_Engineer | `sb-ext:save-lisp-and-die`, golden images, watchdog resurrection |
| Profiler Integration | `profiler.lisp` | Profiler_Engineer | `sb-sprof` harness, ASCII flamegraph, auto-tuning hotspot detection |

### Stage 2 — Integration (3 parallel agents)
| Task | Agent | Purpose |
|------|-------|---------|
| Dashboard v2 | Dashboard_Upgrader | Flamegraph display, gossip status panel, evolution tracker |
| Orchestrator v2 | Orchestrator_Upgrader | Wire evolution hooks into healing cycle, gossip integration |
| System Update | System_Updater | ASDF deps, package exports, demo update |

### Stage 3 — Validation & Package
| Task | Purpose |
|------|---------|
| Final tarball with evolution patch | Deliver `lispmind-v2.0.0.tar.gz` |

## Key Interfaces

### evolution.lisp ↔ orchestrator.lisp
- Orchestrator calls `(evolve-strategy current-strategy fitness-data)` when failure rate > threshold
- `(heal-agent ...)` invokes `(evolve-strategy ...)` for `:evolve` restart
- `*evolution-log*` tracks all strategy mutations

### gossip.lisp ↔ orchestrator.lisp
- Orchestrator calls `(start-gossip-node orch)` on startup
- `(publish-health orb)` broadcasts agent health to `swarm.health` topic
- `(subscribe-topic "swarm.threats" #'handle-threat)` registers callbacks

### image-persist.lisp ↔ orchestrator.lisp
- `(save-golden-image orch)` called after significant improvements
- Orchestrator startup checks `(find-latest-golden-image)` and auto-resurrects
- Watchdog thread monitors process health

### profiler.lisp ↔ dashboard.lisp
- `(generate-flamegraph)` returns ASCII flamegraph string
- `(profiler-dashboard-data)` returns hotspot summary for dashboard
- `(auto-tune-hotspot function-name)` called when >80% time detected

## New Dependencies (for lispmind.asd)
- `cl-zeromq` or `zmq` — ZeroMQ bindings
- `mgl-gpr` — Genetic programming
- (sb-sprof is built into SBCL — no external dependency)

## New Package Exports
- `evolve-strategy`, `generate-initial-strategy`, `define-evolving-agent`
- `start-gossip-node`, `publish-message`, `subscribe-topic`, `gossip-broadcast`
- `save-golden-image`, `resurrect-from-image`, `watchdog-thread`
- `start-swarm-profile`, `generate-flamegraph`, `auto-tune-hotspot`
