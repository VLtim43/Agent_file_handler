from pathlib import Path


def apply_renames(
    folder: Path, rename_map: dict[str, str]
) -> list[tuple[str, str, str]]:
    results: list[tuple[str, str, str]] = []
    for original, new in rename_map.items():
        src = folder / original
        dst = folder / new

        if not src.exists():
            results.append((original, new, "missing"))
            continue
        if dst.exists():
            results.append((original, new, "collision"))
            continue

        src.rename(dst)
        results.append((original, new, "renamed"))
    return results
