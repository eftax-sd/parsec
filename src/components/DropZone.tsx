export function DropZone() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm pointer-events-none">
      <div className="bg-white border-2 border-dashed border-blue-500 rounded-xl px-12 py-8 flex flex-col items-center gap-3 shadow-xl">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-blue-600 font-semibold text-lg">Drop file to open</p>
        <p className="text-gray-500 text-sm">CSV, Excel, or Parquet</p>
      </div>
    </div>
  );
}
