export default function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <div className="skeleton h-48 w-full rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="skeleton h-6 w-20 rounded" />
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}
