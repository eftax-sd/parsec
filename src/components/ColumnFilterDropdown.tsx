import { useEffect, useMemo, useRef, useState } from "react";
import type { Column } from "@tanstack/react-table";
import type { Row } from "../types/data";

interface Props {
  column: Column<Row, unknown>;
  allRows: Row[];
  columnIndex: number;
}

export function ColumnFilterDropdown({ column, allRows, columnIndex }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Compute unique values from the full unfiltered dataset
  const uniqueValues = useMemo(() => {
    const seen = new Set<string>();
    for (const row of allRows) {
      const val = row[columnIndex];
      seen.add(val === null || val === undefined ? "(empty)" : String(val));
    }
    return Array.from(seen).sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );
  }, [allRows, columnIndex]);

  const currentFilter = (column.getFilterValue() as string[] | undefined) ?? [];
  const isFiltered = currentFilter.length > 0;

  const filteredUniqueValues = useMemo(() => {
    if (!search) return uniqueValues;
    const q = search.toLowerCase();
    return uniqueValues.filter((v) => v.toLowerCase().includes(q));
  }, [uniqueValues, search]);

  const toggleValue = (val: string) => {
    const next = currentFilter.includes(val)
      ? currentFilter.filter((v) => v !== val)
      : [...currentFilter, val];
    column.setFilterValue(next.length > 0 ? next : undefined);
  };

  const selectAll = () => {
    column.setFilterValue(undefined);
  };

  const clearAll = () => {
    column.setFilterValue(filteredUniqueValues);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`ml-1 p-0.5 rounded hover:bg-gray-200 transition-colors ${
          isFiltered ? "text-blue-600" : "text-gray-400"
        }`}
        title="Filter column"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M1.5 2h13l-5 6v5l-3-1.5V8L1.5 2z" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-white border border-gray-200 rounded shadow-lg text-sm">
          {/* Sort controls */}
          <div className="border-b border-gray-100 p-1">
            <button
              className="w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2"
              onClick={() => { column.toggleSorting(false); setOpen(false); }}
            >
              <span>↑</span> Sort A → Z
            </button>
            <button
              className="w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded flex items-center gap-2"
              onClick={() => { column.toggleSorting(true); setOpen(false); }}
            >
              <span>↓</span> Sort Z → A
            </button>
            {column.getIsSorted() && (
              <button
                className="w-full text-left px-2 py-1.5 hover:bg-gray-100 rounded text-gray-500"
                onClick={() => { column.clearSorting(); setOpen(false); }}
              >
                ✕ Clear sort
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search values..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          </div>

          {/* Select all / Clear */}
          <div className="flex gap-2 px-2 py-1 border-b border-gray-100">
            <button
              className="text-blue-600 hover:underline text-xs"
              onClick={selectAll}
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              className="text-blue-600 hover:underline text-xs"
              onClick={clearAll}
            >
              Clear
            </button>
          </div>

          {/* Values list */}
          <div className="overflow-y-auto max-h-48">
            {filteredUniqueValues.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 text-xs">No values found</div>
            ) : (
              filteredUniqueValues.map((val) => {
                const checked = currentFilter.length === 0 || currentFilter.includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleValue(val)}
                      className="accent-blue-600"
                    />
                    <span className="truncate text-gray-800">{val}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
