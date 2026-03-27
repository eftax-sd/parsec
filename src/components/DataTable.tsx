import { useRef, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type FilterFn,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ColumnMeta, Row } from "../types/data";
import { ColumnFilterDropdown } from "./ColumnFilterDropdown";
import { useState } from "react";

interface Props {
  columns: ColumnMeta[];
  rows: Row[];
  filteredCount: (count: number) => void;
}

// Custom filter function: empty filter = show all; otherwise cell value must be in array
const multiSelectFilter: FilterFn<Row> = (row, columnId, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true;
  const cell = row.getValue(columnId);
  const str = cell === null || cell === undefined ? "(empty)" : String(cell);
  return filterValue.includes(str);
};
multiSelectFilter.autoRemove = (val: unknown) =>
  !val || (Array.isArray(val) && val.length === 0);

export function DataTable({ columns, rows, filteredCount }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columnDefs = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map((col, index) => ({
        id: col.name,
        accessorFn: (row: Row) => row[index],
        header: col.name,
        filterFn: multiSelectFilter,
        enableSorting: true,
        enableColumnFilter: true,
        size: 150,
      })),
    [columns]
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFns: { multiSelect: multiSelectFilter },
  });

  const { rows: tableRows } = table.getRowModel();

  // Report filtered count to parent
  useMemo(() => {
    filteredCount(tableRows.length);
  }, [tableRows.length, filteredCount]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Scrollable table area */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: columns.length * 120 }}>
          {/* Sticky header */}
          <thead className="sticky top-0 z-10 bg-gray-100 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="border-b border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap select-none"
                      style={{ width: header.getSize() }}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className="cursor-pointer hover:text-gray-900"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {isSorted && (
                          <span className="text-blue-500 text-xs">
                            {isSorted === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                        <ColumnFilterDropdown
                          column={header.column}
                          allRows={rows}
                          columnIndex={columns.findIndex((c) => c.name === header.id)}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Virtual body */}
          <tbody>
            {/* Top spacer */}
            {virtualItems.length > 0 && virtualItems[0].start > 0 && (
              <tr style={{ height: virtualItems[0].start }}>
                <td colSpan={columns.length} />
              </tr>
            )}

            {virtualItems.map((virtualRow) => {
              const row = tableRows[virtualRow.index];
              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className={
                    virtualRow.index % 2 === 0
                      ? "bg-white hover:bg-blue-50"
                      : "bg-gray-50 hover:bg-blue-50"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="border-b border-gray-100 px-3 py-1.5 text-gray-800 truncate max-w-xs"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* Bottom spacer */}
            {virtualItems.length > 0 && (
              <tr
                style={{
                  height:
                    totalSize -
                    (virtualItems[virtualItems.length - 1]?.end ?? 0),
                }}
              >
                <td colSpan={columns.length} />
              </tr>
            )}
          </tbody>
        </table>

        {tableRows.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No rows match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
