# ProShop Feature Flags MCP

Python FastMCP server for managing `backend/features.json`.

## Tools

- `list_features()` — read-only summary of all flags: `feature_id`, `name`, `status`, `traffic_percentage`.
- `get_feature_info(feature_name)` — read-only detail for one flag, including `depends_on` and dependency states.
- `set_feature_state(feature_name, state)` — writes `status`, canonical `traffic_percentage`, and `last_modified`.
- `adjust_traffic_rollout(feature_name, percentage)` — writes `traffic_percentage` and `last_modified` for flags in `Testing`.

## Install

From the repository root, create an isolated venv and install dependencies:

```bash
python3 -m venv mcp/.venv
mcp/.venv/bin/pip install -r mcp/requirements.txt
```

`mcp/.venv/` is in `.gitignore`.

## Run

The server uses stdio transport. Manual run from the repo root:

```bash
mcp/.venv/bin/python mcp/feature_flags_server.py
```

## Claude Code integration

`.mcp.json` at the repo root registers this server as `feature-flags` for any session opened in this project:

```json
{
  "mcpServers": {
    "feature-flags": {
      "type": "stdio",
      "command": "mcp/.venv/bin/python",
      "args": ["mcp/feature_flags_server.py"]
    }
  }
}
```

Verify:

```bash
claude mcp list
# feature-flags: mcp/.venv/bin/python mcp/feature_flags_server.py - ✓ Connected
```

First time you open the project, Claude Code asks to approve the project-scoped MCP server.

## Validation Rules

- `state` must be exactly `Disabled`, `Testing`, or `Enabled`.
- `set_feature_state(..., "Enabled")` is blocked if any dependency is `Disabled`.
- `set_feature_state(..., "Disabled")` sets traffic to `0`.
- `set_feature_state(..., "Enabled")` sets traffic to `100`.
- `set_feature_state(..., "Testing")` keeps a valid `1..99` traffic value or defaults to `10`.
- `adjust_traffic_rollout` accepts only integer `0..100`.
- `adjust_traffic_rollout` only writes flags currently in `Testing`.
- `percentage > 0` is rejected while a feature is `Disabled`.

All writes are atomic: the server writes a temp file next to `backend/features.json`, then renames it over the source file.
