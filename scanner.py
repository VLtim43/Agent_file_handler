from pathlib import Path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def scan_folder(folder: Path, recursive: bool = False) -> list[Path]:
    if not folder.is_dir():
        raise NotADirectoryError(f"{folder} is not a directory")

    entries = folder.rglob("*") if recursive else folder.iterdir()
    images = [p for p in entries if p.is_file() and p.suffix.lower() in IMAGE_EXTS]
    return sorted(images)
