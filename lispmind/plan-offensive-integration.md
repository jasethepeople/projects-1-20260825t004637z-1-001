# LISPMIND v2.3.1 — Offensive Tool Registry + Categorical Safety Framework

## Architecture

### 1. define-offensive-tool Macro
Central macro that generates kali-agent subclasses from a concise manifest.

### 2. *offensive-tool-manifest* — 100+ Tools across 8 Categories
| Category | Tools | Policy Profile |
|----------|-------|---------------|
| :lolbin | certutil, bitsadmin, mshta, rundll32, regsvr32, wmic, cscript, powershell, installutil, msbuild | Log all executions; pause on network connect |
| :creds | mimikatz, rubeus, impacket-secretsdump, impacket-samrdump, impacket-psexec, netexec, crackmapexec, hashcat, john, fgdump, lsasecrets, gsecdump | Require ARM signal; log all credential access |
| :lateral | impacket-psexec, impacket-wmiexec, impacket-smbexec, impacket-atexec, evil-winrm, bloodhound.py, sharphound, ladon, pth-toolkit | Require ARM signal; only whitelisted targets |
| :recon | nmap, subfinder, amass, dnsrecon, theharvester, spiderfoot, maltego, recon-ng, osmedeus | Whitelisted IP ranges; alert on high packet freq |
| :post-exploit | metasploit, cobalt-strike, empire, covenant, poshc2, sliver, havoc, bruteratel | Require ARM + override-safety-lock |
| :web | sqlmap, burpsuite, nikto, dirb, gobuster, wfuzz, commix, whatweb, zaproxy | Allowed on test targets only |
| :wireless | bettercap, airgeddon, aircrack-ng, reaver, pixiewps, wifite, fluxion | wlan1 only; no deauth floods |
| :social-engineering | setoolkit, king-phisher, gophish, beef-xss | No outbound email without whitelist |

### 3. Policy Profiles
- ARM/DISARM per category
- Categorical constraints (not per-tool)
- Override-safety-lock for critical categories
- sudo-wrapper for root-requiring tools

### 4. MCP Registration
- All tools registered as MCP capabilities
- Categorical ARM/DISARM as MCP tools

### 5. Parallel Build (3 agents)
- Tool_Registry_Engineer: macro + manifest + LOLBin agents
- Offensive_Tool_Engineer: Impacket, Metasploit, BloodHound, Empire, Sliver, etc.
- Policy_Profile_Engineer: all policy profiles + ARM/DISARM + finalize-agent + sudo-wrapper
