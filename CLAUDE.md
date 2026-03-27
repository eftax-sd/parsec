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
