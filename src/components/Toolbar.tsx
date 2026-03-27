interface Props {
  filePath: string | null;
  totalRows: number;
  filteredRows: number;
  onOpenFile: () => void;
}

export function Toolbar({ filePath, totalRows, filteredRows, onOpenFile }: Props) {
  const fileName = filePath ? filePath.split(/[\\/]/).pop() : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-white shrink-0">
      <button
        onClick={onOpenFile}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors font-medium"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.08 1.35l.14.35H13.5A1.5 1.5 0 0 1 15 5.25v7.25A1.5 1.5 0 0 1 13.5 14h-11A1.5 1.5 0 0 1 1 12.5v-9z" />
        </svg>
        Open File
      </button>

      {fileName && (
        <>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-700 truncate max-w-xs" title={filePath ?? ""}>
            {fileName}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-500">
            {filteredRows === totalRows
              ? `${totalRows.toLocaleString()} rows`
              : `${filteredRows.toLocaleString()} of ${totalRows.toLocaleString()} rows`}
          </span>
        </>
      )}
    </div>
  );
}
