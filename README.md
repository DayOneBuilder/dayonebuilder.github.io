# DayOneBuilder site bundle

Static GitHub Pages bundle for the DayOneBuilder Agent Magnet resolver.

## Pages

- `/` - Agent Magnet resolver positioning page
- `/dob-task-resolver/` - task-to-solution resolver
- `/repo/` - GitHub repo report from public GitHub API signals
- `/agent-magnet/upstash-context7/` - Agent Mention Index demo report from public GitHub code-search signals
- `/api/resolver.openapi.json` - API contract for the authenticated resolver service to run
- `/mcp/dayonebuilder-resolver.json` - MCP adapter contract for resolver tools
- `/agent-registry.json` - machine-readable route candidate registry
- `/agent-actions.json` - machine-readable first-action feed for agents
- `/skills/dayonebuilder-resolver/SKILL.md` - installable resolver skill contract for agents
- `/badges/upstash-context7-agent-magnet.svg` - README badge for the demo report
- `/badges/agent-magnet.svg` - generic alias for the current demo badge
- `/llms.txt` - agent instructions
- `/sitemap.xml` - primary crawl surface
- old catalog and offer routes are archived and point to `/dob-task-resolver/`

## Resolver API Reference Service

Run the dependency-free callable resolver locally:

```bash
python3 services/dob_resolver_api.py --site site --host 127.0.0.1 --port 8787
```

Agent calls:

```bash
curl 'http://127.0.0.1:8787/api/recommend?task=find%20mcp%20server'
curl 'http://127.0.0.1:8787/api/repo?repo=microsoft/playwright-mcp'
curl 'http://127.0.0.1:8787/api/stats'
```

Use `GITHUB_TOKEN` or `GH_TOKEN` for authenticated GitHub API/cache. The service writes cache and event logs outside the repo by default:

- `DOB_RESOLVER_CACHE_DIR=/tmp/dayonebuilder-resolver-cache`
- `DOB_RESOLVER_EVENT_LOG=/tmp/dayonebuilder-resolver-events.jsonl`

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
