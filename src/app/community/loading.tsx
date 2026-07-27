export default function CommunityLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="h-4 w-32 rounded-full bg-muted skeleton-shimmer mx-auto" />
        <div className="h-9 w-64 rounded-xl bg-muted skeleton-shimmer mx-auto" />
        <div className="h-4 w-96 rounded bg-muted skeleton-shimmer mx-auto" />
      </div>

      {/* Filter / Search Bar Skeleton */}
      <div className="max-w-xl mx-auto flex gap-3">
        <div className="h-11 flex-1 rounded-xl bg-muted skeleton-shimmer" />
        <div className="h-11 w-28 rounded-xl bg-muted skeleton-shimmer" />
      </div>

      {/* Community Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border/60 bg-card/60 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 rounded bg-muted skeleton-shimmer" />
                <div className="h-3 w-1/3 rounded bg-muted skeleton-shimmer" />
              </div>
              <div className="h-8 w-16 rounded-xl bg-muted skeleton-shimmer" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-5/6 rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-2/3 rounded bg-muted skeleton-shimmer" />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <div className="h-5 w-24 rounded-full bg-muted skeleton-shimmer" />
              <div className="h-8 w-28 rounded-xl bg-muted skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
