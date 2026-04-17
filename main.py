from pathlib import Path

import readchar
import typer
from rich.console import Console
from rich.table import Table

from analyze import analyze
from renamer import apply_renames
from scanner import scan_folder

app = typer.Typer(add_completion=False)
console = Console()


def _prompt_key(prompt: str, valid: set[str]) -> str:
    console.print(prompt, end=" ")
    while True:
        key = readchar.readkey().lower()
        if key in valid:
            console.print(f"[bold]{key}[/bold]")
            return key


def _render_rename_table(rename_map: dict[str, str]) -> Table:
    table = Table(title="", show_lines=False)
    table.add_column("Original", style="cyan")
    table.add_column("", style="white")
    table.add_column("Suggested", style="green")
    for original, new in rename_map.items():
        table.add_row(original, "->", new)
    return table


def _render_summary(results: list[tuple[str, str, str]]) -> Table:
    table = Table(title="Summary")
    table.add_column("Original", style="cyan")
    table.add_column("New", style="green")
    table.add_column("Status")
    status_styles = {"renamed": "green", "collision": "red", "missing": "yellow"}
    for original, new, status in results:
        style = status_styles.get(status, "white")
        table.add_row(original, new, f"[{style}]{status}[/{style}]")
    return table


@app.command()
def run(
    folder: Path = typer.Argument(
        ...,
        exists=True,
        file_okay=False,
        dir_okay=True,
        resolve_path=True,
        help="Folder containing images to rename.",
    ),
    recursive: bool = typer.Option(
        False, "--recursive", "-r", help="Recurse into subfolders."
    ),
) -> None:
    images = scan_folder(folder, recursive=recursive)
    if not images:
        console.print(f"[yellow]No images found in {folder}.[/yellow]")
        raise typer.Exit()

    console.print(f"[bold]Found {len(images)} image(s) in {folder}:[/bold]")
    for p in images:
        display = p.relative_to(folder) if recursive else p.name
        console.print(f"  • {display}")

    try:
        input("\nPress Enter to send for analysis (Ctrl+C to quit)... ")
    except (KeyboardInterrupt, EOFError):
        console.print("\n[yellow]Cancelled.[/yellow]")
        raise typer.Exit()

    rename_map = analyze([p.name for p in images])
    if not rename_map:
        console.print("[green]No renames suggested — everything looks good.[/green]")
        raise typer.Exit()

    console.print(_render_rename_table(rename_map))

    choice = _prompt_key("\n[y] apply all  [n] quit", {"y", "n"})
    if choice == "n":
        console.print("[yellow]Quit — no files changed.[/yellow]")
        raise typer.Exit()

    results = apply_renames(folder, rename_map)
    console.print(_render_summary(results))

    counts: dict[str, int] = {}
    for _, _, status in results:
        counts[status] = counts.get(status, 0) + 1
    console.print(
        " | ".join(f"[bold]{status}[/bold]: {n}" for status, n in counts.items())
    )


if __name__ == "__main__":
    app()
