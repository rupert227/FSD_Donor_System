export function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-surface-soft rounded-button h-10 w-10" />
          <div className="space-y-2">
            <div className="bg-surface-soft rounded-button h-8 w-52" />
            <div className="bg-surface-soft rounded-button h-4 w-32" />
          </div>
        </div>
        <div className="bg-surface-soft rounded-button h-10 w-40" />
      </div>
      <div className="flex items-end gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="bg-surface-soft rounded-button h-3 w-20" />
            <div className="bg-surface-soft rounded-button h-9 w-40" />
          </div>
        ))}
        <div className="bg-surface-soft rounded-button h-9 w-20" />
        <div className="bg-surface-soft rounded-button h-9 w-28" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm"
          >
            <div className="bg-surface-soft rounded-button mb-3 h-4 w-24" />
            <div className="bg-surface-soft rounded-button h-9 w-32" />
            <div className="bg-surface-soft rounded-button mt-3 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-border-soft bg-surface-white rounded-panel flex min-h-50 flex-col border p-4 shadow-sm"
          >
            <div className="bg-surface-soft rounded-button mb-3 h-5 w-36" />
            <div className="bg-surface-soft rounded-button h-3 w-28" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 4 }).map((__, innerIndex) => (
                <div key={innerIndex} className="flex items-center gap-2">
                  <div className="bg-surface-soft rounded-button h-4 w-20" />
                  <div className="bg-surface-soft rounded-button h-4 flex-1" />
                  <div className="bg-surface-soft rounded-button h-4 w-10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-border-soft bg-surface-white rounded-panel border shadow-sm">
        <div className="border-border-soft border-b px-4 py-3">
          <div className="bg-surface-soft rounded-button h-5 w-36" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <div className="bg-surface-soft rounded-button h-5 flex-1" />
              <div className="bg-surface-soft rounded-button h-5 w-16" />
              <div className="bg-surface-soft rounded-button h-5 w-16" />
              <div className="bg-surface-soft rounded-button h-5 w-16" />
              <div className="bg-surface-soft rounded-button h-5 w-16" />
              <div className="bg-surface-soft rounded-button h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
