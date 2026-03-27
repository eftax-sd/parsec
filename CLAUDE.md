# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Parsec is a native desktop app (Tauri v2) for viewing CSV, TSV, Excel, and Parquet files. All file parsing happens in Rust; the frontend renders the result.

## Commands

### Development
```bash
npm run tauri dev       # Run full app (Rust backend + React frontend)
npm run dev             # Frontend only (no Tauri backend)
```

### Build
```bash
npm run tauri build     # Production build + bundle
npm run build           # Frontend build only (tsc + vite)
```

### Rust
```bash
cd src-tauri && cargo build          # Compile Rust backend
cd src-tauri && cargo check          # Type-check without linking
cd src-tauri && cargo test           # Run Rust tests
```

## Architecture

### Data flow

1. User opens or drops a file
2. For multi-sheet Excel files, frontend calls `get_file_meta(path)` first to fetch sheet names, then shows `FileOptionsDialog`
3. Frontend calls `parse_file(path, options)` via `src/lib/invoke.ts` with optional `ParseOptions` (sheet name, encoding, delimiter)
4. Rust (`src-tauri/src/commands.rs`) dispatches to the appropriate parser based on file extension
5. Parser returns `ParseResult { columns, rows, total_rows }` serialized as JSON
6. Frontend renders the full result in `DataTable`

**All data is loaded into memory at once** — there is no streaming or pagination.

### Rust backend (`src-tauri/src/`)

| File | Responsibility |
|------|---------------|
| `lib.rs` | Tauri app entry point; registers commands and plugins |
| `commands.rs` | Two `#[tauri::command]`s: `get_file_meta` (sheet names) and `parse_file` (dispatches by extension) |
| `parser.rs` | Shared types: `ColumnMeta`, `ParseResult`, `ParseOptions` |
| `csv_parser.rs` | CSV/TSV via `csv` crate; supports custom delimiter and encoding (via `encoding_rs`); auto-detects int/float/null |
| `excel_parser.rs` | Excel/ODS via `calamine`; supports sheet selection |
| `parquet_parser.rs` | Parquet via `parquet` + `arrow` crates; maps Arrow types to `data_type` strings |

`data_type` values emitted by parsers: `"string"`, `"number"`, `"boolean"`, `"date"`, `"datetime"`. CSV always emits `"string"` for column type; Excel always emits `"string"`; only Parquet emits typed column metadata.

### Frontend (`src/`)

| Path | Responsibility |
|------|---------------|
| `App.tsx` | Root — wires file open/drop hooks, renders `Toolbar`, `DataTable`, `EmptyState`, `DropZone`, or `FileOptionsDialog` |
| `hooks/useFileOpen.ts` | Manages loading/error/pendingFile state; exposes `openFile()`, `loadPath()`, `submitOptions()`, `dismissOptions()` |
| `hooks/useFileDrop.ts` | Listens for drag-and-drop onto the window; calls `loadPath` |
| `components/DataTable.tsx` | TanStack Table (sorting + multi-select filter) + TanStack Virtual (row virtualization) |
| `components/ColumnFilterDropdown.tsx` | Per-column multi-select filter UI; values derived from all rows |
| `components/FileOptionsDialog.tsx` | Modal for choosing sheet (Excel), encoding, and delimiter (CSV) before parsing |
| `components/DropZone.tsx` | Full-screen overlay shown while dragging a file over the window |
| `lib/invoke.ts` | Typed wrappers around `@tauri-apps/api/core` invoke for `getFileMeta` and `parseFile` |
| `types/data.ts` | TypeScript mirrors of Rust types: `ColumnMeta`, `ParseResult`, `FileMeta`, `ParseOptions` |

### Key frontend patterns

- **File options flow** — when a CSV parse fails or an Excel file has multiple sheets, `useFileOpen` sets `pendingFile` state instead of erroring, causing `App` to render `FileOptionsDialog`. On confirm, `submitOptions` retries `loadPath` with the selected `ParseOptions`.
- **Column filtering** uses a custom `multiSelectFilter` (empty selection = show all; otherwise cell must be in selected set). Null/empty cells are represented as `"(empty)"` in the filter dropdown.
- **Row virtualization** — `DataTable` uses `useVirtualizer` with spacer `<tr>` rows above and below the visible window. The estimated row height is 35px.
- `filteredCount` is reported up to `App` via a callback so the `Toolbar` can show "X of Y rows".

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->