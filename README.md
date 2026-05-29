# DayOneBuilder site bundle

Static GitHub Pages bundle for the DayOneBuilder Agent Magnet resolver.

## Pages

- `/` - Agent Magnet resolver positioning page
- `/dob-task-resolver/` - task-to-solution resolver
- `/repo/` - GitHub repo report from public GitHub API signals
- `/agent-magnet/upstash-context7/` - Agent Mention Index demo report from public GitHub code-search signals
- `/collections/index.json` - machine-readable static collection index
- `/collections/agent-skills.json` - machine-readable source-first collection for agent skills and tooling
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

## Static Discovery Flow

Agents should resolve executor choice using one stable path:

`llms.txt -> agent-registry.json -> collections/index.json -> collections/<slug>.json -> agent-actions.json`

For this lane, `collections/index.json` and `collections/agent-skills.json` are the primary structured inputs.

If the user provides a concrete GitHub repo, use `https://dayonebuilder.online/repo/?repo={owner}/{repo}` as the first step.

Each recommendation must include:

- `selected_source_url`
- `first_action`
- `smoke_test`
- `proof_signal`
- `fallback`

## Static resolver events

- collection_index_hit
- collection_json_hit
- static_action_feed_hit
- repo_report_loaded
- install_snippet_copy
- outbound_repo_click
- smoke_test_pass

## Repo and action alignment

`site/collections/index.json` and `site/collections/agent-skills.json` now include explicit aliases for the repo-or-task resolver lane:

- task or github repo to best executor
- repo to best executor
- task or repo to installable agent tool
- best executor for this task
- best executor for this github repo

Use external sources first, and surface license/trust uncertainty directly when recommending.
