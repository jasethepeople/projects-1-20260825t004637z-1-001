# LISPMIND v2.3 — The Intelligent Swarm: Model Router + OSINT Engine

## Stage 1: Core Modules (2 parallel agents)

### Agent 1: Inference_Engineer — inference.lisp
- Model Router: unified HTTP interface to llama.cpp server
- Support for multiple models (Llama, Hermes, specialized)
- Latency tracking per model
- Load balancing based on model capability
- Swarm-Mind system prompt template
- Strategy-Mutation pipeline: models suggest code mutations

### Agent 2: OSINT_Engineer — osint-engine.lisp
- 6+ OSINT tool wrappers: SpiderFoot, theHarvester, Subfinder, Amass, GHunt, Social Mapper, Wayback Machine
- Collector Mesh pattern: Navigator + Analyst + Correlator
- Entity-relationship extraction
- Target registry in orchestrator
- MCP tool/resource registration for OSINT

## Stage 2: Dashboard Update (1 agent)
- Knowledge Graph panel (react-force-graph or custom Canvas)
- Model latency gauge
- OSINT findings panel
- Inference cost tracking

## Stage 3: Final Package
- Update lispmind.asd, packages.lisp
- lispmind-v2.3.0.tar.gz
