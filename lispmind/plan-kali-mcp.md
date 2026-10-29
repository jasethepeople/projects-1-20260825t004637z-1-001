# LISPMIND v2.2 — Kali-Native Offensive Engine + MCP Bridge

## Stage 1: Core Lisp Modules (3 parallel agents)

### Agent 1: Kali_Engineer — `kali-interface.lisp`
- `kali-agent` class extending `agent` with binary/args/process slots
- `run-tool` method using `uiop:launch-program` with :output :stream
- `capture-output` method piping tool output to telemetry/gossip
- 10+ wrapped tools: nmap, metasploit (msfconsole), proxychains, aircrack-ng, john, hashcat, hydra, sqlmap, dirb, wireshark (tshark)
- Shadow Agent pattern: Observer + Analysis agents
- Interactive REPL commands: `(mind:spawn-tool 'nmap :target "x")`

### Agent 2: Policy_Janitor_Engineer — `policy-gatekeeper.lisp` + janitor
- Tactical Repository: policy files per tool (nmap.lisp, metasploit.lisp, etc.)
- `safe-strategy-p` validation before any launch-program
- `finalize-agent :after` method killing subprocesses on agent death
- Network State Checkpoint: interface config reset on link loss
- Emergency halt kills all kali-agent subprocesses

### Agent 3: MCP_Bridge_Engineer — `mcp-bridge.lisp`
- MCP server using 40ants-mcp framework
- Expose LISPMIND capabilities as MCP tools (list-agents, spawn-tool, heal-agent)
- JSON-RPC 2.0 transport (stdio + SSE)
- Dynamic capability discovery
- Schema validation for all tool inputs

## Stage 2: Dashboard Integration
- Tool output visualization in System Logs panel
- Color-coding: green for findings, red for errors
- Active tools panel showing running kali-agents
- Policy violation alerts

## Stage 3: Final Package
- Update lispmind.asd, packages.lisp
- lispmind-v2.2.0.tar.gz
