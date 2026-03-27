import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getFileMeta, parseFile } from "../lib/invoke";
import type { ParseOptions, ParseResult } from "../types/data";

const CSV_EXTS = new Set(["csv", "tsv"]);
const EXCEL_EXTS = new Set(["xlsx", "xls", "xlsm", "ods"]);

function getExt(path: string): string {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export interface PendingFile {
  path: string;
  sheets: string[];
  isCsv: boolean;
  parseError?: string;
}

export function useFileOpen() {
  const [data, setData] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);

  const loadPath = async (path: string, options?: ParseOptions) => {
    setLoading(true);
    setError(null);
    setPendingFile(null);

    try {
      const ext = getExt(path);

      // For Excel without an explicit sheet choice, check sheet count first
      if (EXCEL_EXTS.has(ext) && !options?.sheet_name) {
        const meta = await getFileMeta(path);
        if (meta.sheets.length > 1) {
          setPendingFile({ path, sheets: meta.sheets, isCsv: false });
          return;
        }
      }

      const result = await parseFile(path, options);
      setData(result);
      setFilePath(path);
    } catch (e) {
      const msg = String(e);
      setError(msg);
      if (CSV_EXTS.has(getExt(path))) {
        setPendingFile({ path, sheets: [], isCsv: true, parseError: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const openFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "Data Files",
          extensions: ["csv", "tsv", "xlsx", "xls", "xlsm", "ods", "parquet"],
        },
      ],
    });
    if (!selected) return;
    await loadPath(selected);
  };

  const submitOptions = async (options: ParseOptions) => {
    if (!pendingFile) return;
    await loadPath(pendingFile.path, options);
  };

  const dismissOptions = () => {
    setPendingFile(null);
  };

  return { data, loading, error, filePath, pendingFile, openFile, loadPath, submitOptions, dismissOptions };
}
