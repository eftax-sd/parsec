import { useState } from "react";
import type { ParseOptions } from "../types/data";

const ENCODINGS = [
  { label: "UTF-8", value: "UTF-8" },
  { label: "Windows-1252 (Western European)", value: "windows-1252" },
  { label: "ISO-8859-1 (Latin-1)", value: "ISO-8859-1" },
  { label: "GBK (Chinese Simplified)", value: "GBK" },
  { label: "Big5 (Chinese Traditional)", value: "Big5" },
  { label: "Shift-JIS (Japanese)", value: "Shift_JIS" },
  { label: "EUC-JP (Japanese)", value: "EUC-JP" },
  { label: "EUC-KR (Korean)", value: "EUC-KR" },
  { label: "UTF-16 LE", value: "UTF-16LE" },
  { label: "UTF-16 BE", value: "UTF-16BE" },
];

const DELIMITERS = [
  { label: "Comma (,)", value: "," },
  { label: "Tab", value: "\t" },
  { label: "Semicolon (;)", value: ";" },
  { label: "Pipe (|)", value: "|" },
];

interface Props {
  filePath: string;
  sheets: string[];
  isCsv: boolean;
  parseError?: string;
  onConfirm: (options: ParseOptions) => void;
  onCancel: () => void;
}

export function FileOptionsDialog({ filePath, sheets, isCsv, parseError, onConfirm, onCancel }: Props) {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";

  const [sheetName, setSheetName] = useState(sheets[0] ?? "");
  const [encoding, setEncoding] = useState("UTF-8");
  const [delimiter, setDelimiter] = useState(ext === "tsv" ? "\t" : ",");

  const handleConfirm = () => {
    const options: ParseOptions = {};
    if (sheets.length > 1) options.sheet_name = sheetName;
    if (isCsv) {
      options.encoding = encoding;
      options.delimiter = delimiter;
    }
    onConfirm(options);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Open File</h2>
          <p className="text-xs text-gray-400 mt-0.5 truncate" title={filePath}>
            {fileName}
          </p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Parse error hint */}
          {parseError && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <strong className="block mb-1">Could not open with default settings:</strong>
              <span className="font-mono whitespace-pre-wrap break-all">{parseError}</span>
            </div>
          )}

          {/* Sheet picker */}
          {sheets.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Sheet
              </label>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              >
                {sheets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* CSV options */}
          {isCsv && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Encoding
                </label>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value)}
                >
                  {ENCODINGS.map((enc) => (
                    <option key={enc.value} value={enc.value}>
                      {enc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Delimiter
                </label>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                >
                  {DELIMITERS.map((d) => (
                    <option key={d.label} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            onClick={handleConfirm}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
