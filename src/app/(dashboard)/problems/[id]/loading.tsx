export default function ProblemDetailLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb / Title Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
        <div className="h-8 sm:h-10 w-3/4 max-w-2xl rounded-lg bg-muted skeleton-shimmer" />
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="h-6 w-20 rounded-full bg-muted skeleton-shimmer" />
          <div className="h-6 w-24 rounded-full bg-muted skeleton-shimmer" />
          <div className="h-6 w-16 rounded-full bg-muted skeleton-shimmer" />
        </div>
      </div>

      {/* Main Grid: Problem Details & Radar Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Problem & Solutions Description Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <div className="h-5 w-40 rounded bg-muted skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-5/6 rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-4/6 rounded bg-muted skeleton-shimmer" />
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <div className="h-5 w-48 rounded bg-muted skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-11/12 rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-3/4 rounded bg-muted skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Right: Score Badge & Pentagon Radar Chart Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-border/60 bg-card/60 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-3 w-28 rounded bg-muted skeleton-shimmer" />
            <div className="h-16 w-24 rounded-xl bg-muted skeleton-shimmer" />
            <div className="h-4 w-36 rounded bg-muted skeleton-shimmer" />

            {/* Polygon / Pentagon radar chart placeholder */}
            <div className="w-64 h-64 rounded-full border border-border/40 bg-muted/30 flex items-center justify-center relative overflow-hidden my-4">
              <div className="w-48 h-48 rounded-full border border-border/40 skeleton-shimmer" />
              <div className="w-32 h-32 rounded-full border border-border/40 skeleton-shimmer" />
            </div>

            <div className="w-full space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3 w-24 rounded bg-muted skeleton-shimmer" />
                  <div className="h-3 w-8 rounded bg-muted skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Action Skeletons */}
      <div className="border-t border-border/60 pt-8 space-y-4">
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded-xl bg-muted skeleton-shimmer" />
          <div className="h-10 w-36 rounded-xl bg-muted skeleton-shimmer" />
          <div className="h-10 w-36 rounded-xl bg-muted skeleton-shimmer" />
        </div>
        <div className="h-48 w-full rounded-2xl border border-border/60 bg-card/40 skeleton-shimmer" />
      </div>
    </div>
  );
}
