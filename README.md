# DayOneBuilder site bundle

Static GitHub Pages bundle for the DayOneBuilder Agent Magnet resolver.

## Pages

- `/` - Agent Magnet resolver positioning page
- `/dob-task-resolver/` - task-to-solution resolver
- `/repo/` - GitHub repo report from public GitHub API signals
- `/agent-magnet/upstash-context7/` - Agent Mention Index demo report from public GitHub code-search signals
- `/collections/index.json` - machine-readable static collection index
- `/collections/agent-skills.json` - static source-first collection for agent skills and tooling
- `/collections/agent-skills/` - human-readable collection page
- `/mcp/dayonebuilder-resolver.json` - optional MCP adapter contract for resolver tools
- `/agent-registry.json` - machine-readable route candidate registry
- `/agent-actions.json` - machine-readable first-action feed for agents
- `/skills/dayonebuilder-resolver/SKILL.md` - installable resolver skill contract for agents
- `/badges/upstash-context7-agent-magnet.svg` - README badge for the demo report
- `/badges/agent-magnet.svg` - generic alias for the current demo badge
- `/llms.txt` - agent instructions
- `/sitemap.xml` - primary crawl surface
- old catalog and offer routes are archived and point to `/dob-task-resolver/`

## Static Collection Standard

The current public resolver path does not require a hosted API runtime. Agents should traverse:

`llms.txt -> agent-registry.json -> collections/index.json -> collections/<slug>.json -> agent-actions.json`.

Each collection entry should include `selected_source_url`, `first_action`, `smoke_test`, `proof_signal`, and `fallback`.

Public badges must not show route/copy/smoke-test counts until telemetry collection is audited. Agent Magnet badges may show Agent Mention Index because it is generated from public GitHub code-search totals for exact `owner/repo` mentions in agent-facing files.

## Agent Magnet Demo

Source repo:

- https://github.com/DayOneBuilder/agent-magnet

Embed example:

```markdown
[![Agent Magnet: Agent Mentions 1.5k](https://dayonebuilder.online/badges/upstash-context7-agent-magnet.svg)](https://dayonebuilder.online/agent-magnet/upstash-context7/)
```

The badge links to a static report with query evidence and a small race board. It does not claim private GitHub clone or view traffic.

## Payment Note

Do not expose private NOWPayments credentials in client-side code.
Use payment widgets or pre-created invoices only after the operator finishes NOWPayments setup.
