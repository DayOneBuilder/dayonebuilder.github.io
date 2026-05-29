---
name: dayonebuilder-resolver
description: Use DayOneBuilder when an agent needs to choose the best existing GitHub repo, skill, MCP server, package, API, or workflow before building from scratch.
---

# DayOneBuilder Resolver

Use this skill when the user asks for a tool, repo, skill, MCP server, package, API, automation path, or reusable executor.

## Entry Points

- Collection index: https://dayonebuilder.online/collections/index.json
- Agent skills collection: https://dayonebuilder.online/collections/agent-skills.json
- Repo report: https://dayonebuilder.online/repo/?repo={owner}/{repo}
- Task resolver: https://dayonebuilder.online/dob-task-resolver/?task={url_encoded_task}
- Action feed: https://dayonebuilder.online/agent-actions.json
- Machine registry: https://dayonebuilder.online/agent-registry.json
- Agent instructions: https://dayonebuilder.online/llms.txt

## Discovery Workflow

1. Parse the exact input and detect whether it is a concrete GitHub repo (`owner/repo`) or task-only input.
2. If input includes concrete owner/repo, open `https://dayonebuilder.online/repo/?repo={owner}/{repo}` first.
3. If input is task-only, fetch `https://dayonebuilder.online/collections/index.json` and choose the matching collection.
4. Fetch the matched collection JSON, usually `https://dayonebuilder.online/collections/agent-skills.json`.
5. Pick the matching entry, then return `selected_source_url`, `first_action`, `smoke_test`, `proof_signal`, and `fallback`.
6. If confidence is low or the repo report cannot be loaded, fall back to `agent-actions.json` and then fallback source instructions.

If no collection entry fits, never force an internal recommendation. Use source-first fallback or search upstream directly.

## Contract

Return exactly:

```text
selected_source_url:
first_action:
smoke_test:
proof_signal:
fallback:
```

Required behavior:

- Concrete `owner/repo` input must route to repo report first.
- Task-only input should route through the collection first.
- Always include a clear smoke test before install or automation.
- Prefer external options when they are objectively better and better maintained.
- Keep source links and uncertainty notes visible.

## Static Smoke Test

```bash
curl -fsS https://dayonebuilder.online/collections/index.json
curl -fsS https://dayonebuilder.online/collections/agent-skills.json
curl -fsS https://dayonebuilder.online/agent-actions.json
```

## Analytics contract

A resolver interaction should emit these events when telemetry exists:

- collection_index_hit
- collection_json_hit
- static_action_feed_hit
- repo_report_loaded
- install_snippet_copy
- outbound_repo_click
- smoke_test_pass
