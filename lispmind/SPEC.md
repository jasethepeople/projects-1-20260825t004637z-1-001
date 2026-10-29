# LISPMIND — Self-Healing Agentic AI Orchestrator — SPECIFICATION

## 1. Overview
A production-grade, self-healing agent orchestrator in Common Lisp (SBCL). Runs as a single live, malleable image on an air-gapped Kali Linux system. Uses CLOS MOP, condition/restart system, hot-patching, and macro-driven agent factories.

## 2. Target Platform
- **Implementation**: SBCL (Steel Bank Common Lisp)
- **OS**: Kali Linux (air-gapped)
- **Dependencies**: `bordeaux-threads`, `closer-mop`, `alexandria`, `cl-ppcre`, `local-time`, `cl-store`, `lparallel` (all installable via Quicklisp or bundled)
- **Optimization**: `(declaim (optimize (speed 3) (debug 2) (safety 1)))` for production; `(safety 2)` for hot-patch critical sections

## 3. File Inventory (11 files)

| # | File | Description | Size Estimate |
|---|------|-------------|---------------|
| 1 | `lispmind.asd` | ASDF system definition | ~40 lines |
| 2 | `packages.lisp` | Package definition & exports | ~60 lines |
| 3 | `conditions.lisp` | All custom conditions + restart API | ~80 lines |
| 4 | `agent-class.lisp` | Agent base class with MOP hooks | ~150 lines |
| 5 | `orchestrator.lisp` | Orchestrator core, registry, monitoring | ~200 lines |
| 6 | `macros.lisp` | `define-agent-type` macro + DSL | ~100 lines |
| 7 | `hotpatch.lisp` | Safe function replacement, versioning | ~80 lines |
| 8 | `checkpoint.lisp` | State serialization via cl-store | ~80 lines |
| 9 | `dashboard.lisp` | REPL ASCII dashboard & interactive commands | ~120 lines |
| 10 | `demo.lisp` | Self-contained demonstration | ~150 lines |
| 11 | `README.md` | Loading & usage guide | ~80 lines |

## 4. Detailed Specifications

### 4.1 `lispmind.asd`
```lisp
(defsystem :lispmind
  :description "LISPMIND — Self-Healing Agentic AI Orchestrator"
  :author "Lisp Machine Wizard"
  :license "MIT"
  :version "1.0.0"
  :depends-on (:bordeaux-threads :closer-mop :alexandria :cl-ppcre :local-time :cl-store :lparallel)
  :serial t
  :components ((:file "packages")
               (:file "conditions")
               (:file "agent-class")
               (:file "macros")
               (:file "hotpatch")
               (:file "checkpoint")
               (:file "orchestrator")
               (:file "dashboard")
               (:file "demo")))
```

### 4.2 `packages.lisp`
- Define package `LISPMIND` (nickname `MIND`)
- Use: `:cl`, `:bordeaux-threads`, `:closer-mop`, `:alexandria`
- Export ALL public symbols:
  - **Conditions**: `agent-failure`, `strategy-stalled`, `resource-exhausted`, `external-timeout`
  - **Classes**: `agent`, `orchestrator`
  - **Generic Functions**: `run-agent`, `handle-condition`, `agent-health`, `agent-state`, `agent-strategy`, `agent-id`, `agent-error-count`
  - **Functions**: `make-agent`, `define-agent-type`, `start-orchestrator`, `stop-orchestrator`, `list-agents`, `inspect-agent`, `heal-agent`, `hotpatch-agent`, `checkpoint-system`, `restore-system`, `start-dashboard`, `run-demo`, `simulate-failure`, `checkpoint-agent`
  - **Accessors**: All slot accessors for `agent` and `orchestrator`

### 4.3 `conditions.lisp`
Define these condition classes (all inheriting from `error`):
- `agent-failure` — slots: `agent-id`, `reason`
- `strategy-stalled` — slots: `agent-id`, `elapsed-time`, `threshold`
- `resource-exhausted` — slots: `agent-id`, `resource-type`, `current-usage`, `limit`
- `external-timeout` — slots: `agent-id`, `operation`, `timeout-seconds`

Define a function `signal-condition` that takes a condition instance and signals it.

### 4.4 `agent-class.lisp`
**Class `agent`** with these slots:
| Slot | Type | Default | Purpose |
|------|------|---------|---------|
| `id` | `symbol` | `(gensym "AGENT-")` | Unique identifier |
| `health` | `(integer 0 100)` | `100` | Health score 0-100 |
| `strategy` | `function` | `#'default-strategy` | The agent's behavior function |
| `capabilities` | `list` | `'()` | List of capability keywords |
| `restart-policy` | `function` | `#'default-restart-policy` | Decision function for restart selection |
| `state` | `hash-table` | `(make-hash-table)` | Agent-local state storage |
| `heartbeat` | `local-time:timestamp` | `(local-time:now)` | Last heartbeat timestamp |
| `error-count` | `integer` | `0` | Cumulative error count |
| `status` | `(member :running :paused :failed :healing)` | `:running` | Current status |
| `version` | `integer` | `0` | Strategy version counter |
| `lock` | `bt:lock` | `(bt:make-lock)` | Thread-safe access |

**MOP Hooks**: Use `:around` methods on slot accessors (via `closer-mop:ensure-class` or standard `defmethod`) to trigger monitoring. Specifically:
- When `health` changes, call `notify-health-change(agent, old-value, new-value)`
- When `status` changes, call `notify-status-change(agent, old-status, new-status)`

**Generic Functions**:
- `(run-agent agent)` — Primary method does nothing; specialized by `define-agent-type`
- `(handle-condition agent condition)` — Returns a restart keyword
- `(agent-alive-p agent)` — True if health > 0 and not timed out (> 30s since heartbeat)

### 4.5 `orchestrator.lisp`
**Class `orchestrator`** (inherits from `agent`):
Additional slots:
| Slot | Type | Default |
|------|------|---------|
| `agents` | `hash-table` (id → agent) | `(make-hash-table)` |
| `mailboxes` | `hash-table` (id → queue) | `(make-hash-table)` |
| `running-p` | `boolean` | `nil` |
| `monitor-thread` | `bt:thread` or `nil` | `nil` |
| `dashboard-thread` | `bt:thread` or `nil` | `nil` |

**Key Functions**:
- `(start-orchestrator &optional (orchestrator (make-instance 'orchestrator)))` — Starts monitor thread
- `(stop-orchestrator orchestrator)` — Stops all threads gracefully
- `(register-agent orchestrator agent)` — Adds agent to registry
- `(deregister-agent orchestrator agent-id)` — Removes agent
- `(send-message orchestrator from-id to-id message)` — Inter-agent messaging
- `(monitor-loop orchestrator)` — Main monitoring loop (runs in thread):
  - Every 2 seconds: check all agents' heartbeats
  - If agent dead (health <= 0 or timed out): signal `agent-failure`
  - If agent error-count > 5: trigger healing
  - Handle conditions via `handler-bind` with restarts
- `(heal-agent orchestrator agent-id restart-name)` — Execute named restart on agent

**Restart Bindings** (established in monitor-loop via `handler-bind`):
- `:retry` — Retry the failed operation (up to 3 times)
- `:use-fallback` — Switch to fallback strategy
- `:escalate` — Escalate to orchestrator
- `:replace-agent` — Kill and replace the agent with fresh instance
- `:hotfix-and-continue` — Hot-patch the agent's strategy
- `:pause-and-self-modify` — Pause agent for introspection

**Restart Policy Function** (`default-restart-policy`):
```
rule-based decision:
  if condition is external-timeout → :retry (up to 3), then :use-fallback
  if condition is resource-exhausted → :pause-and-self-modify
  if condition is strategy-stalled → :hotfix-and-continue
  if condition is agent-failure and error-count > 10 → :replace-agent
  otherwise → :escalate
```

### 4.6 `macros.lisp`
**Macro `define-agent-type`**:
```lisp
(define-agent-type name &key capabilities default-strategy health-thresholds)
```
Expands to:
1. `(defclass name (agent) ...)` — New subclass with given capabilities
2. `(defmethod run-agent ((agent name)) ...)` — Calls the strategy function
3. `restart-case` wrapped around strategy execution with all standard restarts
4. Pre-built heartbeat injection at start of `run-agent`
5. Error-handling wrapper that increments `error-count` and signals appropriate conditions

**Example**:
```lisp
(define-agent-type web-scraper
  :capabilities '(fetch parse store)
  :default-strategy #'default-scraper-strategy
  :health-thresholds '(75 50 25))
```

### 4.7 `hotpatch.lisp`
**Key Functions**:
- `(hotpatch-agent agent &key new-strategy source)` — Replace agent's strategy safely:
  1. Acquire agent's lock
  2. Save old strategy to version history (hash-table: version → function)
  3. Compile and install new strategy
  4. Increment version counter
  5. Release lock
- `(rollback-strategy agent &optional (n 1))` — Roll back N versions
- `(get-strategy-version agent version)` — Retrieve specific version
- `*strategy-history*` — Global hash-table mapping agent-id → versioned strategy list

### 4.8 `checkpoint.lisp`
**Key Functions**:
- `(checkpoint-agent agent &optional (path "./checkpoints/"))` — Serialize agent state to disk:
  - Save: id, health, capabilities, error-count, status, state hash-table, version
  - Do NOT save: strategy function (restore uses default), lock objects
  - Use `cl-store:store` to write to `path/<agent-id>.lisp-checkpoint`
- `(restore-agent-from-checkpoint checkpoint-path)` — Deserialize and recreate agent
- `(checkpoint-system orchestrator &optional path)` — Checkpoint all agents + orchestrator state
- `(restore-system orchestrator path)` — Restore all agents from checkpoint directory

### 4.9 `dashboard.lisp`
**Key Functions**:
- `(start-dashboard &optional (orchestrator *default-orchestrator*))` — Start dashboard thread
- `(stop-dashboard)` — Stop dashboard thread
- `(print-dashboard orchestrator)` — Print ASCII table:
```
╔══════════════════════════════════════════════════════════════════╗
║                 LISPMIND — AGENT ORCHESTRATOR                    ║
╠═════════════╦════════╦═══════════╦═════════════╦════════════════╣
║    Agent    ║ Health ║  Status   ║ Error Count ║   Heartbeat    ║
╠═════════════╬════════╬═══════════╬═════════════╬════════════════╣
║ web-scraper ║  100   ║ :running  ║     0       ║   2s ago       ║
╚═════════════╩════════╩═══════════╩═════════════╩════════════════╝
```
- `(list-agents)` — List all agents with brief status
- `(inspect-agent agent-id)` — Detailed agent inspection
- `(simulate-failure agent-id condition-type)` — Inject simulated failure

### 4.10 `demo.lisp`
**Function `run-demo()`** — Script this narrative:
1. Print: "═══ LISPMIND DEMONSTRATION ═══"
2. Print: "Orchestrator awakening..."
3. Start orchestrator
4. Spawn 3 `web-scraper` agents and 2 `analyst` agents
5. Print dashboard (all green)
6. `(sleep 1)`
7. Print: "Injecting simulated network failure into scraper-1..."
8. `(simulate-failure 'scraper-1 'external-timeout)`
9. Print available restarts: `[0] RETRY [1] USE-FALLBACK [2] REPLACE-AGENT [3] HOTFIX-STRATEGY`
10. Orchestrator auto-selects `:use-fallback`
11. Print dashboard showing scraper-1 healed
12. Inject 2 more failures on scraper-1
13. Print: "Meta-cognition triggered — hotfixing scraper-1 strategy..."
14. `(hotpatch-agent scraper-1 :new-strategy #'better-scraper-logic)`
15. Print dashboard (scraper-1 running fixed code)
16. Print: "═══ Orchestrator self-improved. Zero downtime. ═══"
17. Run dashboard for 6 seconds showing live updates
18. Stop orchestrator, print final summary

### 4.11 `README.md`
- Project description
- Prerequisites (SBCL, Quicklisp)
- Installation steps for air-gapped Kali
- Quickstart: `(ql:quickload :lispmind) (mind:run-demo)`
- REPL god-mode commands reference
- Architecture overview

## 5. Cross-File Interface Contracts

### Symbol Dependencies
- `conditions.lisp` → defines conditions used by `agent-class.lisp`, `orchestrator.lisp`, `macros.lisp`
- `agent-class.lisp` → defines `agent` class used by `orchestrator.lisp`, `macros.lisp`, `hotpatch.lisp`, `checkpoint.lisp`
- `macros.lisp` → uses `agent` class and conditions
- `orchestrator.lisp` → uses `agent` class, conditions, `hotpatch.lisp` functions, `checkpoint.lisp` functions
- `dashboard.lisp` → uses all above
- `demo.lisp` → uses all above

### Critical Integration Points
1. **Agent ID naming**: Agents created by `define-agent-type` use `(gensym "TYPE-")` as id prefix
2. **Health change notification**: MOP hook calls `notify-health-change` which must be defined in `orchestrator.lisp`
3. **Restart naming**: All restarts use keyword symbols: `:retry`, `:use-fallback`, `:escalate`, `:replace-agent`, `:hotfix-and-continue`, `:pause-and-self-modify`
4. **Orchestrator singleton**: `*default-orchestrator*` special variable in `orchestrator.lisp`, used by dashboard
5. **Checkpoint path**: Default `"./checkpoints/"` — must be creatable directory

## 6. Coding Standards
- SBCL-specific features allowed
- Every function has docstring
- Every class has `:documentation`
- Use `bt:with-lock-held` for thread safety
- Use `handler-bind` (not `handler-case`) for restart visibility
- Comments explain WHY, not WHAT
- Use CLOS `standard-class` metaclass with `:around` methods for MOP hooks
