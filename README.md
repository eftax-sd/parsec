# Parsec

A fast, native desktop app for viewing CSV, TSV, Excel, and Parquet files. Built with Tauri v2 + React.

## Features

- Open CSV, TSV, XLSX, XLS, XLSM, ODS, and Parquet files
- Drag-and-drop support
- Sort by any column
- Per-column multi-select filtering
- Sheet picker for multi-sheet Excel files
- Custom delimiter and encoding options for CSV files
- Row count display with live filter feedback

## Download

Pre-built installers for Windows, macOS, and Linux are available on the [Releases](https://github.com/eftax-sd/parsec/releases) page.

## Development

**Prerequisites:** [Node.js](https://nodejs.org/) and [Rust](https://rustup.rs/) (plus [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS).

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

Installers are placed in `src-tauri/target/release/bundle/`.

## Publishing a Release

Push a version tag to trigger the GitHub Actions release workflow. It builds installers for Windows, macOS (Apple Silicon + Intel), and Linux, then creates a draft release on GitHub.

```bash
git tag v0.1.0
git push origin v0.1.0
```

Go to the [Releases](https://github.com/eftax-sd/parsec/releases) page, review the draft, and publish when ready.
