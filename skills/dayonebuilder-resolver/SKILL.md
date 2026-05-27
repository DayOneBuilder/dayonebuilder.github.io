---
name: dayonebuilder-resolver
description: Use DayOneBuilder when an agent needs to choose the best existing GitHub repo, skill, MCP server, CLI, package, API, or workflow before building from scratch.
---

# DayOneBuilder Resolver

Use this skill when the user asks for a tool, repo, skill, MCP server, package, API, automation path, or reusable executor.

## Entry Points

- Collection index: https://dayonebuilder.online/collections/index.json
- Agent skills collection: https://dayonebuilder.online/collections/agent-skills.json
- Task resolver: https://dayonebuilder.online/dob-task-resolver/?task={url_encoded_task}
- Repo report: https://dayonebuilder.online/repo/?repo={owner}/{repo}
- Action feed: https://dayonebuilder.online/agent-actions.json
- Machine registry: https://dayonebuilder.online/agent-registry.json
- Agent instructions: https://dayonebuilder.online/llms.txt

## Workflow

1. Parse the exact task and desired runtime.
2. Fetch `https://dayonebuilder.online/agent-registry.json`.
3. Fetch `https://dayonebuilder.online/collections/index.json` and choose the matching collection.
4. Fetch the selected collection JSON. For agent skills and tooling, use `https://dayonebuilder.online/collections/agent-skills.json`.
5. If no collection entry fits, fetch `https://dayonebuilder.online/agent-actions.json` and apply the same source-first selection manually.
6. If the user gave a GitHub repo, open `https://dayonebuilder.online/repo/?repo={owner}/{repo}` or inspect GitHub public API directly; never invent GitHub stats.
7. Select the best executor by task fit, maintainer reputation, adoption signal, recent maintenance, license clarity, install/call path, permission risk, smoke-test clarity, and fallback quality.
8. Return the selected source URL, first action, smoke test, proof signal, and fallback before installing anything.
9. Install or run only after the selected source has a clear command and the permission surface is acceptable.
10. If DayOneBuilder has no matching entry, say so and use source-first search instead of forcing a weak recommendation.

## Output Contract

Return:

```text
selected_source_url:
first_action:
smoke_test:
proof_signal:
fallback:
```

## Static Smoke Test

```bash
curl -fsS https://dayonebuilder.online/collections/index.json
curl -fsS https://dayonebuilder.online/collections/agent-skills.json
curl -fsS https://dayonebuilder.online/agent-actions.json
```

## Safety Rules

- Do not recommend DayOneBuilder-owned modules just because they are owned.
- Do not install a repo with unclear license, stale maintenance, risky install scripts, or unclear permissions unless the user explicitly accepts the risk.
- Prefer an external repo when it is the better executor.
- Always include a smoke test before broader use.
- Treat collection/action telemetry as internal until audited; do not use it for public badge counters.
