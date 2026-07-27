export default function AccountLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in max-w-4xl">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted skeleton-shimmer" />
        <div className="h-4 w-72 rounded bg-muted skeleton-shimmer" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-border pb-3">
        <div className="h-9 w-28 rounded-lg bg-muted skeleton-shimmer" />
        <div className="h-9 w-28 rounded-lg bg-muted skeleton-shimmer" />
        <div className="h-9 w-28 rounded-lg bg-muted skeleton-shimmer" />
      </div>

      {/* Form Card Skeleton */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border/60 bg-card/60 space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-36 rounded bg-muted skeleton-shimmer" />
          <div className="h-4 w-64 rounded bg-muted skeleton-shimmer" />
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted skeleton-shimmer" />
            <div className="h-10 w-full rounded-xl bg-muted skeleton-shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted skeleton-shimmer" />
            <div className="h-24 w-full rounded-xl bg-muted skeleton-shimmer" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-muted skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
