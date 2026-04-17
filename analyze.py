from pathlib import Path


def analyze(filenames: list[str]) -> dict[str, str]:
    """Mock analyzer — returns { original_name: suggested_name } for files that
    should be renamed. Only files that need renaming appear in the map.

    This module is intentionally isolated. The real implementation will call
    the Anthropic API; nothing else in the project should change when it does.
    """
    suggestions: dict[str, str] = {}
    for index, name in enumerate(filenames[:3], start=1):
        suffix = Path(name).suffix
        new_name = f"photo_{index:02d}{suffix}"
        if new_name != name:
            suggestions[name] = new_name
    return suggestions
