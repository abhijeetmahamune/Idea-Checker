export default function CommunityLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-7xl space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border gap-4">
        <div className="space-y-2">
          <div className="h-8 w-52 rounded-xl bg-muted skeleton-shimmer" />
          <div className="h-4 w-80 rounded bg-muted skeleton-shimmer" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 rounded-lg bg-muted skeleton-shimmer" />
          <div className="h-9 w-28 rounded-lg bg-muted skeleton-shimmer" />
        </div>
      </div>

      {/* Community Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-border/60 bg-card/60 space-y-4"
          >
            {/* Tags */}
            <div className="flex gap-1.5">
              <div className="h-4 w-14 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-4 w-10 rounded-full bg-muted skeleton-shimmer" />
            </div>

            {/* Title + description */}
            <div className="space-y-1.5">
              <div className="h-5 w-4/5 rounded bg-muted skeleton-shimmer" />
              <div className="h-3.5 w-full rounded bg-muted skeleton-shimmer" />
              <div className="h-3.5 w-2/3 rounded bg-muted skeleton-shimmer" />
            </div>

            {/* Intelligence panel */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 flex items-start gap-3">
              {/* Left: score + rating */}
              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="h-3 w-20 rounded bg-muted skeleton-shimmer" />
                  <div className="h-6 w-14 rounded-md bg-muted skeleton-shimmer" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 w-20 rounded bg-muted skeleton-shimmer" />
                  <div className="h-3.5 w-28 rounded bg-muted skeleton-shimmer" />
                </div>
              </div>
              {/* Right: radar placeholder */}
              <div className="w-[110px] h-[100px] rounded-lg bg-muted skeleton-shimmer" />
            </div>

            {/* Meta row */}
            <div className="border-t border-border/60 pt-3 space-y-2">
              <div className="flex gap-3">
                <div className="h-3.5 w-20 rounded bg-muted skeleton-shimmer" />
                <div className="h-3.5 w-20 rounded bg-muted skeleton-shimmer" />
                <div className="h-3.5 w-20 rounded bg-muted skeleton-shimmer" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-32 rounded bg-muted skeleton-shimmer" />
                <div className="h-7 w-16 rounded-lg bg-muted skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
