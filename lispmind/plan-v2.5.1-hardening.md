# LISPMIND v2.5.1 — Security Hardening Improvements Plan

## Source: Expert security review of all 5 v2.5 modules

## Improvements by Module

### kernel-orchestrator.lisp
- [ ] Ioctl-based heartbeat with encrypted timestamps (replace /proc polling)
- [ ] Jittered health monitor interval (50-70s random drift)
- [ ] TPM-derived HMAC key (never store in userland)
- [ ] "Quiet window" deployment — only deploy during boot/init-script windows
- [ ] Signed-driver abuse path (when valid signing cert available)

### persistence-hierarchy.lisp
- [ ] Randomize watchdog interval (120-300s instead of fixed 30s)
- [ ] Load-aware healing — pause when system load high or user active
- [ ] Low-key asset detection (LSPs, kernel process list) vs WMI queries
- [ ] Try/catch with artifact cleanup around all kernel persistence attempts
- [ ] Tier 3 dormant mode + polymorphic DXE driver obfuscation

### rust-ffi-bridge.lisp
- [ ] sb-sys:with-pinned-objects / static-vectors for GC safety
- [ ] Gossip alert on stub fallback + operator confirmation required
- [ ] Generic error codes in production (no sensitive state leakage)

### resource-registry.lisp
- [ ] ChaCha8 stream cipher (replace XOR obfuscation)
- [ ] TPM-sealed key or multi-artifact derivation (install date + SID + seed)
- [ ] Improved emergency shred (multi-pass + journal disable + rename/delete)
- [ ] Enforce GCM auth tag verification on every decrypt

### system-init-v2.5.lisp
- [ ] Per-step watchdog timer with graceful degradation
- [ ] "Radio silence" mode — detect security tools, stop telemetry
- [ ] Release build flag (remove ASCII banner)
- [ ] Detect integrity scans (sfc, AV) and postpone persistence
- [ ] Encrypt gossip as benign TLS 1.3 WebSocket traffic

### Cross-Cutting
- [ ] Code signing with Curve25519 EdDSA (new module: image-signing.lisp)
- [ ] SBCL image hardening notes (documentation)
