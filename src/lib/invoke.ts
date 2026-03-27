import { invoke } from "@tauri-apps/api/core";
import type { FileMeta, ParseOptions, ParseResult } from "../types/data";

export async function getFileMeta(path: string): Promise<FileMeta> {
  return invoke<FileMeta>("get_file_meta", { path });
}

export async function parseFile(path: string, options?: ParseOptions): Promise<ParseResult> {
  return invoke<ParseResult>("parse_file", { path, options: options ?? null });
}
