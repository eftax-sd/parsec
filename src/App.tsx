import { useCallback, useState } from "react";
import { useFileOpen } from "./hooks/useFileOpen";
import { useFileDrop } from "./hooks/useFileDrop";
import { DataTable } from "./components/DataTable";
import { Toolbar } from "./components/Toolbar";
import { DropZone } from "./components/DropZone";
import { EmptyState } from "./components/EmptyState";
import { FileOptionsDialog } from "./components/FileOptionsDialog";

function App() {
  const { data, loading, error, filePath, pendingFile, openFile, loadPath, submitOptions, dismissOptions } = useFileOpen();
  const [filteredRows, setFilteredRows] = useState(0);

  const handleDrop = useCallback(
    (path: string) => {
      loadPath(path);
    },
    [loadPath]
  );

  const { isDragging } = useFileDrop(handleDrop);

  const handleFilteredCount = useCallback((count: number) => {
    setFilteredRows(count);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 overflow-hidden">
      <Toolbar
        filePath={filePath}
        totalRows={data?.total_rows ?? 0}
        filteredRows={filteredRows}
        onOpenFile={openFile}
      />

      {loading && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Parsing file...</span>
          </div>
        </div>
      )}

      {error && !loading && !pendingFile && (
        <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <span className="mt-0.5">⚠</span>
          <div>
            <strong>Failed to open file:</strong>
            <pre className="mt-1 text-xs whitespace-pre-wrap font-mono">{error}</pre>
          </div>
        </div>
      )}

      {!data && !loading && <EmptyState onOpenFile={openFile} />}

      {data && !loading && (
        <DataTable
          columns={data.columns}
          rows={data.rows}
          filteredCount={handleFilteredCount}
        />
      )}

      {isDragging && <DropZone />}

      {pendingFile && (
        <FileOptionsDialog
          filePath={pendingFile.path}
          sheets={pendingFile.sheets}
          isCsv={pendingFile.isCsv}
          parseError={pendingFile.parseError}
          onConfirm={submitOptions}
          onCancel={dismissOptions}
        />
      )}
    </div>
  );
}

export default App;
