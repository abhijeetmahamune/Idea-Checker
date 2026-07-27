export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg bg-muted skeleton-shimmer" />
          <div className="h-4 w-72 rounded bg-muted skeleton-shimmer" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-muted skeleton-shimmer" />
      </div>

      {/* Stats Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 rounded bg-muted skeleton-shimmer" />
              <div className="h-8 w-8 rounded-lg bg-muted skeleton-shimmer" />
            </div>
            <div className="h-8 w-16 rounded bg-muted skeleton-shimmer" />
            <div className="h-3 w-32 rounded bg-muted skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Main Problems List Skeleton */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center">
          <div className="h-6 w-36 rounded bg-muted skeleton-shimmer" />
          <div className="h-8 w-24 rounded-lg bg-muted skeleton-shimmer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/60 bg-card/60 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-3/4 rounded bg-muted skeleton-shimmer" />
                  <div className="h-3 w-1/2 rounded bg-muted skeleton-shimmer" />
                </div>
                <div className="h-6 w-12 rounded-full bg-muted skeleton-shimmer" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
                <div className="h-4 w-4/5 rounded bg-muted skeleton-shimmer" />
              </div>
              <div className="pt-2 flex justify-between items-center">
                <div className="h-4 w-20 rounded bg-muted skeleton-shimmer" />
                <div className="h-8 w-24 rounded-lg bg-muted skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
