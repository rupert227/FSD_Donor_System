export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex items-center gap-3">
        <div className="bg-skeleton-primary rounded-button h-10 w-10" />
        <div className="space-y-2">
          <div className="bg-skeleton-primary rounded-button h-8 w-52" />
          <div className="bg-skeleton-primary rounded-button h-4 w-32" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="space-y-2">
          <div className="bg-skeleton-primary rounded-button h-3 w-12" />
          <div className="bg-skeleton-primary rounded-button h-9 w-36" />
        </div>
        <div className="bg-skeleton-primary rounded-button h-9 w-20" />
        <div className="bg-skeleton-primary rounded-button h-9 w-28" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm"
          >
            <div className="bg-skeleton-primary rounded-button h-4 w-32" />
            <div className="bg-skeleton-primary rounded-button mt-3 h-7 w-24" />
            <div className="bg-skeleton-primary rounded-button mt-3 h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="border-border-soft bg-surface-white rounded-panel flex flex-col overflow-hidden border shadow-sm"
          >
            <div className="border-border-soft flex items-center justify-between border-b px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-skeleton-primary rounded-button h-8 w-8" />
                <div className="space-y-2">
                  <div className="bg-skeleton-primary rounded-button h-4 w-44" />
                  <div className="bg-skeleton-primary rounded-button h-3 w-32" />
                </div>
              </div>
              {index === 0 ? (
                <div className="flex gap-3">
                  <div className="bg-skeleton-primary rounded-button h-4 w-20" />
                  <div className="bg-skeleton-primary rounded-button h-4 w-20" />
                </div>
              ) : (
                <div className="bg-skeleton-primary rounded-button h-9 w-24" />
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              {index === 0 ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 6 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-2">
                      <div className="bg-skeleton-primary rounded-l-button h-10 w-25" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="bg-skeleton-primary rounded-r-button h-4 w-[70%]" />
                        <div className="bg-skeleton-primary rounded-r-button h-4 w-[55%]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="border-border-soft/50 flex items-center gap-4 rounded-[8px] border px-4 py-3"
                    >
                      <div className="space-y-2">
                        <div className="bg-skeleton-primary rounded-button h-4 w-36" />
                        <div className="bg-skeleton-primary rounded-button h-3 w-24" />
                      </div>
                      <div className="ml-auto flex-1 space-y-2">
                        <div className="bg-skeleton-primary rounded-button ml-auto h-3 w-28" />
                        <div className="bg-skeleton-primary/25 rounded-button h-2 w-full" />
                      </div>
                    </div>
                  ))}
                  <div className="mt-auto flex justify-end gap-2 pt-2">
                    {Array.from({ length: 5 }).map((_, pageIndex) => (
                      <div
                        key={pageIndex}
                        className="bg-skeleton-primary rounded-button h-8 w-8"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="border-border-soft bg-surface-white rounded-panel h-fit border p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <div className="bg-skeleton-primary rounded-button h-4 w-4" />
              <div className="bg-skeleton-primary rounded-button h-4 w-32" />
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {Array.from({ length: 2 }).map((_, targetIndex) => (
                <div key={targetIndex} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="bg-skeleton-primary rounded-button h-3 w-36" />
                    <div className="bg-skeleton-primary rounded-button h-3 w-28" />
                  </div>
                  <div className="bg-skeleton-primary/25 rounded-button h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
