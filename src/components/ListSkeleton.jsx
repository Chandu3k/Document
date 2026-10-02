export default function ListSkeleton({ rows = 6 }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center justify-between py-4">
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-black/10" />
            <div className="h-3 w-24 rounded bg-black/5" />
          </div>
          <div className="h-6 w-28 rounded-full bg-black/5" />
        </div>
      ))}
    </div>
  )
}