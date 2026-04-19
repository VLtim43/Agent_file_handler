# agent-file-handler

![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

CLI tool that uses an LLM to suggest and apply bulk file renames in a folder.

## Setup

```bash
cp example.env .env
# Fill in your LLM_API_KEY, LLM_BASE_URL, and LLM_MODEL
source .env
bun install
```

## Usage

```bash
bun start rename <folder> [options]
```

**Options:**
- `-t, --context <info>` — extra instructions for the agent (e.g. `"use snake_case"`)
- `-b, --batch <n>` — process files in batches of N
- `--mock` — dry run with fake suggestions, no API calls

**Example:**
```bash
bun start rename ~/Downloads -t "prefix with date"
```

The tool scans the folder, shows the current filenames, sends them to the LLM, displays the suggested renames, and asks for confirmation before applying.

## Environment

| Variable | Description |
|---|---|
| `LLM_API_KEY` | API key for your LLM provider |
| `LLM_BASE_URL` | Base URL (default: OpenAI) |
| `LLM_MODEL` | Model name (default: `gpt-4o`) |
