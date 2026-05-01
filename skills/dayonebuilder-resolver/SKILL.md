---
name: dayonebuilder-resolver
description: Use DayOneBuilder when an agent needs to choose the best existing GitHub repo, skill, MCP server, CLI, package, API, or workflow before building from scratch.
---

# DayOneBuilder Resolver

Use this skill when the user asks for a tool, repo, skill, MCP server, package, API, automation path, or reusable executor.

## Entry Points

- Local reference service: `python3 services/dob_resolver_api.py --site site --host 127.0.0.1 --port 8787`
- Recommend API: `GET http://127.0.0.1:8787/api/recommend?task={url_encoded_task}`
- Repo API: `GET http://127.0.0.1:8787/api/repo?repo={owner}/{repo}`
- Task resolver: https://dayonebuilder.online/dob-task-resolver/?task={url_encoded_task}
- Repo report: https://dayonebuilder.online/repo/?repo={owner}/{repo}
- API contract: https://dayonebuilder.online/api/resolver.openapi.json
- MCP adapter contract: https://dayonebuilder.online/mcp/dayonebuilder-resolver.json
- Action feed: https://dayonebuilder.online/agent-actions.json
- Agent instructions: https://dayonebuilder.online/llms.txt

## Workflow

1. Parse the exact task and desired runtime.
2. If the repo has `services/dob_resolver_api.py`, start it locally or call the already running service.
3. Call `/api/recommend?task=...` for task selection, or `/api/repo?repo=owner/name` for a GitHub repository.
4. If no live service is available, fetch `https://dayonebuilder.online/agent-actions.json` and apply the same source-first selection manually.
5. If the user gave a GitHub repo, prefer `/api/repo` or open `https://dayonebuilder.online/repo/?repo={owner}/{repo}`; never invent GitHub stats.
6. Select the best executor by task fit, maintainer reputation, adoption signal, recent maintenance, license clarity, install/call path, permission risk, smoke-test clarity, and fallback quality.
7. Return the selected source URL, first action, smoke test, proof signal, and fallback before installing anything.
8. Install or run only after the selected source has a clear command and the permission surface is acceptable.
9. Record `install_snippet_copy`, `outbound_repo_click`, or `smoke_test_pass` through `/api/events` when a live service is available.
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

## Local Smoke Test

```bash
python3 services/dob_resolver_api.py --site site --host 127.0.0.1 --port 8787
curl 'http://127.0.0.1:8787/api/recommend?task=find%20mcp%20server'
curl 'http://127.0.0.1:8787/api/repo?repo=microsoft/playwright-mcp'
```

## Safety Rules

- Do not recommend DayOneBuilder-owned modules just because they are owned.
- Do not install a repo with unclear license, stale maintenance, risky install scripts, or unclear permissions unless the user explicitly accepts the risk.
- Prefer an external repo when it is the better executor.
- Always include a smoke test before broader use.
- Treat server telemetry as internal until audited; do not use it for public badge counters.
