export default function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-skeleton-primary rounded-button h-10 w-10" />
          <div className="space-y-2">
            <div className="bg-skeleton-primary rounded-button h-8 w-52" />
            <div className="bg-skeleton-primary rounded-button h-4 w-32" />
          </div>
        </div>
        <div className="bg-skeleton-primary rounded-button h-10 w-40" />
      </div>
      <div className="flex items-end gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="bg-skeleton-primary rounded-button h-3 w-20" />
            <div className="bg-skeleton-primary rounded-button h-9 w-40" />
          </div>
        ))}
        <div className="bg-skeleton-primary rounded-button h-9 w-20" />
        <div className="bg-skeleton-primary rounded-button h-9 w-28" />
      </div>
      <div className="border-border-soft bg-skeleton-secondary rounded-panel border shadow-sm">
        <div className="border-border-soft border-b px-4 py-3">
          <div className="bg-skeleton-primary rounded-button h-5 w-36" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <div className="bg-skeleton-primary rounded-button h-5 flex-1" />
              <div className="bg-skeleton-primary rounded-button h-5 w-16" />
              <div className="bg-skeleton-primary rounded-button h-5 w-16" />
              <div className="bg-skeleton-primary rounded-button h-5 w-16" />
              <div className="bg-skeleton-primary rounded-button h-5 w-16" />
              <div className="bg-skeleton-primary rounded-button h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
