export function ShimmerCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-2 w-16 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 h-2 w-full rounded bg-slate-100" />
      <div className="mt-3 flex gap-4">
        <div className="h-2 w-14 rounded bg-slate-100" />
        <div className="h-2 w-14 rounded bg-slate-100" />
        <div className="h-2 w-14 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function ShimmerList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerCard key={i} />
      ))}
    </div>
  );
}
