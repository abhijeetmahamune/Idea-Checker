export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in max-w-5xl">
      {/* Profile Header Card Skeleton */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border/60 bg-card/60 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar Skeleton */}
          <div className="h-24 w-24 rounded-full bg-muted skeleton-shimmer flex-shrink-0" />
          
          <div className="space-y-3 flex-1">
            <div className="h-7 w-48 rounded-lg bg-muted skeleton-shimmer mx-auto sm:mx-0" />
            <div className="h-4 w-64 rounded bg-muted skeleton-shimmer mx-auto sm:mx-0" />
            <div className="h-4 w-full max-w-md rounded bg-muted skeleton-shimmer mx-auto sm:mx-0" />
          </div>

          <div className="h-10 w-28 rounded-xl bg-muted skeleton-shimmer" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border/60 bg-card/60 text-center space-y-2">
            <div className="h-8 w-12 rounded bg-muted skeleton-shimmer mx-auto" />
            <div className="h-3 w-20 rounded bg-muted skeleton-shimmer mx-auto" />
          </div>
        ))}
      </div>

      {/* Featured Problems & Solutions Skeletons */}
      <div className="space-y-6 pt-4">
        <div className="space-y-4">
          <div className="h-6 w-44 rounded-lg bg-muted skeleton-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-3">
                <div className="h-5 w-3/4 rounded bg-muted skeleton-shimmer" />
                <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
                <div className="h-4 w-2/3 rounded bg-muted skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <div className="h-6 w-44 rounded-lg bg-muted skeleton-shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-3">
                <div className="h-5 w-3/4 rounded bg-muted skeleton-shimmer" />
                <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
                <div className="h-4 w-1/2 rounded bg-muted skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
