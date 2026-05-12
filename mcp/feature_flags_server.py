from __future__ import annotations

import json
import os
import tempfile
from datetime import date
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FEATURES_PATH = PROJECT_ROOT / 'backend' / 'features.json'
VALID_STATES = {'Disabled', 'Testing', 'Enabled'}

mcp = FastMCP(
    'ProShop Feature Flags',
    instructions=(
        'Manage ProShop MERN feature flags stored in backend/features.json. '
        'Use read tools before writes when the user asks about dependencies, '
        'rollout state, or all flags. Write tools update the JSON file directly, '
        'so changes are immediately visible through GET /api/feature-flags.'
    ),
    json_response=True,
)


def _error(code: str, message: str, feature_name: str | None = None) -> dict[str, Any]:
    response: dict[str, Any] = {'error': code, 'message': message}
    if feature_name is not None:
        response['feature_name'] = feature_name
    return response


def _today() -> str:
    return date.today().isoformat()


def _read_features() -> dict[str, dict[str, Any]]:
    try:
        with FEATURES_PATH.open('r', encoding='utf-8') as file:
            return json.load(file)
    except FileNotFoundError as error:
        raise RuntimeError(
            f'FILE_READ_ERROR: backend/features.json was not found at {FEATURES_PATH}.'
        ) from error
    except json.JSONDecodeError as error:
        raise RuntimeError(
            f'JSON_PARSE_ERROR: backend/features.json contains invalid JSON: {error}.'
        ) from error
    except OSError as error:
        raise RuntimeError(
            f'FILE_READ_ERROR: backend/features.json could not be read: {error}.'
        ) from error


def _write_features(features: dict[str, dict[str, Any]]) -> None:
    try:
        with tempfile.NamedTemporaryFile(
            'w',
            encoding='utf-8',
            dir=FEATURES_PATH.parent,
            delete=False,
        ) as temp_file:
            json.dump(features, temp_file, ensure_ascii=False, indent=2)
            temp_file.write('\n')
            temp_path = Path(temp_file.name)

        os.replace(temp_path, FEATURES_PATH)
    except OSError as error:
        raise RuntimeError(
            f'FILE_WRITE_ERROR: backend/features.json could not be written: {error}.'
        ) from error


def _resolve_feature_id(
    features: dict[str, dict[str, Any]],
    feature_name: str,
) -> str | None:
    if feature_name in features:
        return feature_name

    # Allow exact display-name lookup because the public tool parameter is
    # feature_name, while the underlying file is keyed by feature_id.
    for feature_id, feature in features.items():
        if feature.get('name') == feature_name:
            return feature_id

    normalized = feature_name.strip().lower()
    for feature_id, feature in features.items():
        if feature_id.lower() == normalized:
            return feature_id
        if str(feature.get('name', '')).strip().lower() == normalized:
            return feature_id

    return None


def _dependency_states(
    features: dict[str, dict[str, Any]],
    feature: dict[str, Any],
) -> list[dict[str, Any]]:
    return [
        {
            'feature_id': dependency_id,
            'name': features.get(dependency_id, {}).get('name'),
            'status': features.get(dependency_id, {}).get('status', 'Missing'),
            'traffic_percentage': features.get(dependency_id, {}).get(
                'traffic_percentage'
            ),
        }
        for dependency_id in feature.get('dependencies', [])
    ]


def _dependency_warnings(
    features: dict[str, dict[str, Any]],
    feature_id: str,
    feature: dict[str, Any],
) -> list[str]:
    warnings = []

    for dependency in _dependency_states(features, feature):
        dependency_id = dependency['feature_id']
        dependency_status = dependency['status']

        if dependency_status == 'Missing':
            warnings.append(
                f"Dependency '{dependency_id}' is missing from backend/features.json. "
                f"{feature_id} may not function correctly."
            )
        elif dependency_status != 'Enabled':
            warnings.append(
                f"Dependency '{dependency_id}' is in status '{dependency_status}', "
                f"not 'Enabled'. {feature_id} may not function correctly."
            )

    return warnings


def _feature_response(
    feature_id: str,
    feature: dict[str, Any],
    features: dict[str, dict[str, Any]],
    warnings: list[str] | None = None,
    hint: str | None = None,
) -> dict[str, Any]:
    response = {
        'feature_id': feature_id,
        'name': feature.get('name'),
        'status': feature.get('status'),
        'traffic_percentage': feature.get('traffic_percentage'),
        'last_modified': feature.get('last_modified'),
        'depends_on': feature.get('dependencies', []),
        'dependencies_state': _dependency_states(features, feature),
    }

    if warnings is not None:
        response['warnings'] = warnings
    if hint is not None:
        response['hint'] = hint

    return response


@mcp.tool()
def list_features() -> dict[str, Any]:
    """List every feature flag in backend/features.json with its current rollout summary.

    What it does: returns all feature IDs with name, status, and traffic_percentage.
    When to call: use this first when the user asks for "all features", "which flags exist",
    a dashboard-style summary, or before choosing a feature to inspect or modify.
    When NOT to call: do not use this when the user already named one specific flag and needs
    dependency details; use get_feature_info instead. Do not use this to edit flags.

    Examples:
    - list_features()
    - User: "Покажи все фичи и их статусы." -> call list_features()
    - User: "Какие флаги сейчас в Testing?" -> call list_features(), then filter the result.
    """

    try:
        features = _read_features()
    except RuntimeError as error:
        code, message = str(error).split(': ', 1)
        return _error(code, message)

    return {
        'features': [
            {
                'feature_id': feature_id,
                'name': feature.get('name'),
                'status': feature.get('status'),
                'traffic_percentage': feature.get('traffic_percentage'),
            }
            for feature_id, feature in features.items()
        ]
    }


@mcp.tool()
def get_feature_info(feature_name: str) -> dict[str, Any]:
    """Get the current state and dependency states for one ProShop feature flag.

    What it does: reads backend/features.json and returns status, traffic_percentage,
    last_modified, depends_on, and the current state of each dependency. The feature_name
    parameter accepts either the snake_case feature ID such as "dark_mode" or the exact
    display name such as "Dark Mode Theme".
    When to call: use this before any write operation, when the user asks whether a flag can
    be enabled, or when dependency state matters.
    When NOT to call: do not use this for broad inventory questions about every flag; use
    list_features instead. Do not use it to change status or rollout traffic.

    Examples:
    - get_feature_info(feature_name="dark_mode")
    - get_feature_info(feature_name="semantic_search")
    - User: "От чего зависит Save for Later?" -> call get_feature_info("save_for_later").
    """

    try:
        features = _read_features()
    except RuntimeError as error:
        code, message = str(error).split(': ', 1)
        return _error(code, message, feature_name)

    feature_id = _resolve_feature_id(features, feature_name)
    if feature_id is None:
        return _error(
            'FEATURE_NOT_FOUND',
            f"No feature with ID or name '{feature_name}' exists in backend/features.json.",
            feature_name,
        )

    return _feature_response(feature_id, features[feature_id], features)


@mcp.tool()
def set_feature_state(feature_name: str, state: str) -> dict[str, Any]:
    """Change a feature flag status and update canonical rollout fields.

    What it does: sets status to exactly one of Disabled, Testing, or Enabled; updates
    last_modified; sets traffic_percentage to 0 for Disabled, 100 for Enabled, and keeps
    a valid 1-99 Testing percentage or defaults to 10. It writes directly to
    backend/features.json using an atomic replace.
    When to call: use this when the user explicitly asks to enable, disable, promote, roll
    back, or move a feature into Testing. You SHOULD call get_feature_info first when the
    user did not provide dependency context.
    When NOT to call: do not use this to change only rollout percentage; use
    adjust_traffic_rollout for that. Do not call with lowercase state values; they are invalid.
    Enabling is blocked when any dependency is Disabled.

    Examples:
    - set_feature_state(feature_name="dark_mode", state="Testing")
    - set_feature_state(feature_name="stripe_alternative", state="Disabled")
    - User: "Включи semantic_search" -> call get_feature_info("semantic_search"), then
      set_feature_state("semantic_search", "Enabled") only if validation passes.
    """

    if state not in VALID_STATES:
        return _error(
            'INVALID_STATE',
            f"State '{state}' is not valid. Must be one of: Disabled, Testing, Enabled "
            '(case-sensitive).',
            feature_name,
        )

    try:
        features = _read_features()
    except RuntimeError as error:
        code, message = str(error).split(': ', 1)
        return _error(code, message, feature_name)

    feature_id = _resolve_feature_id(features, feature_name)
    if feature_id is None:
        return _error(
            'FEATURE_NOT_FOUND',
            f"No feature with ID or name '{feature_name}' exists in backend/features.json.",
            feature_name,
        )

    feature = features[feature_id]
    dependency_states = _dependency_states(features, feature)
    disabled_dependencies = [
        dependency['feature_id']
        for dependency in dependency_states
        if dependency['status'] == 'Disabled'
    ]

    if state == 'Enabled' and disabled_dependencies:
        return _error(
            'DEPENDENCY_DISABLED',
            'Cannot set feature to Enabled while these dependencies are Disabled: '
            f"{', '.join(disabled_dependencies)}. Enable dependencies first, then retry.",
            feature_name,
        )

    feature['status'] = state
    if state == 'Disabled':
        feature['traffic_percentage'] = 0
    elif state == 'Enabled':
        feature['traffic_percentage'] = 100
    elif not isinstance(feature.get('traffic_percentage'), int) or not (
        1 <= feature['traffic_percentage'] <= 99
    ):
        feature['traffic_percentage'] = 10

    feature['last_modified'] = _today()

    try:
        _write_features(features)
    except RuntimeError as error:
        code, message = str(error).split(': ', 1)
        return _error(code, message, feature_name)

    warnings = _dependency_warnings(features, feature_id, feature)
    return _feature_response(feature_id, feature, features, warnings=warnings)


@mcp.tool()
def adjust_traffic_rollout(feature_name: str, percentage: int) -> dict[str, Any]:
    """Adjust rollout traffic percentage for a feature that is currently in Testing.

    What it does: validates percentage as an integer from 0 to 100, writes it to
    traffic_percentage, and updates last_modified in backend/features.json. It does not
    change status.
    When to call: use this when the user asks to ramp, reduce, expand, canary, or A/B-test
    rollout traffic for a feature that is already in Testing.
    When NOT to call: do not use this for Disabled or Enabled features; call set_feature_state
    first. In particular, percentage > 0 is locked for Disabled features and will be rejected.

    Examples:
    - adjust_traffic_rollout(feature_name="dark_mode", percentage=50)
    - adjust_traffic_rollout(feature_name="search_v2", percentage=25)
    - User: "Увеличь checkout v2 до 50%" -> call get_feature_info, then
      adjust_traffic_rollout("multi_step_checkout_v2", 50) if it is Testing.
    """

    if isinstance(percentage, bool) or not isinstance(percentage, int):
        return _error(
            'INVALID_PERCENTAGE',
            f"Percentage '{percentage}' is not valid. Must be an integer from 0 to 100.",
            feature_name,
        )

    if percentage < 0 or percentage > 100:
        return _error(
            'INVALID_PERCENTAGE',
            f"Percentage '{percentage}' is outside the allowed range 0..100.",
            feature_name,
        )

    try:
        features = _read_features()
    except RuntimeError as error:
        code, message = str(error).split(': ', 1)
        return _error(code, message, feature_name)

    feature_id = _resolve_feature_id(features, feature_name)
    if feature_id is None:
        return _error(
            'FEATURE_NOT_FOUND',
            f"No feature with ID or name '{feature_name}' exists in backend/features.json.",
            feature_name,
        )

    feature = features[feature_id]
    status = feature.get('status')

    if status == 'Disabled' and percentage > 0:
        return _error(
            'TRAFFIC_LOCKED_FOR_DISABLED',
            f"Cannot set traffic_percentage to {percentage} while '{feature_id}' is Disabled. "
            "Use set_feature_state with state 'Testing' first.",
            feature_name,
        )

    if status != 'Testing':
        return _error(
            'WRONG_STATUS_FOR_ROLLOUT',
            'adjust_traffic_rollout can only be called on features with status '
            f"'Testing'. '{feature_id}' is currently '{status}'. Use set_feature_state "
            'to change its status first.',
            feature_name,
        )

    feature['traffic_percentage'] = percentage
    feature['last_modified'] = _today()

    try:
        _write_features(features)
    except RuntimeError as error:
        code, message = str(error).split(': ', 1)
        return _error(code, message, feature_name)

    hint = None
    if percentage == 0:
        hint = "Traffic is 0. Consider set_feature_state with state 'Disabled'."
    elif percentage == 100:
        hint = "Traffic is 100. Consider set_feature_state with state 'Enabled'."

    return _feature_response(feature_id, feature, features, hint=hint)


if __name__ == '__main__':
    mcp.run()
