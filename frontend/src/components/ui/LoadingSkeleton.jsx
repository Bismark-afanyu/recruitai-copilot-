export function SkeletonLine({ className = "" }) {
  return <div className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />;
}

export function SkeletonCircle({ className = "" }) {
  return <div className={`rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />;
}

export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-3 ${className}`}>
      <SkeletonLine className="w-1/3 h-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={i === lines - 1 ? "w-2/3" : "w-full"} />
      ))}
    </div>
  );
}

export function SkeletonStatCard({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <SkeletonCircle className="w-12 h-12" />
        <div className="flex items-end gap-1 h-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLine key={i} className="w-1.5 rounded-full" style={{ height: `${Math.random() * 24 + 8}px` }} />
          ))}
        </div>
      </div>
      <SkeletonLine className="w-16 h-8 mb-2" />
      <SkeletonLine className="w-24 h-4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 ${className}`}>
      <div className="flex gap-8 pb-4 border-b border-gray-100 dark:border-gray-700">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="w-20 h-4" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-8 py-4 border-b border-gray-50 dark:border-gray-700/50">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} className={`h-4 ${j === 0 ? "w-32" : "w-16"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 ${className}`}>
      <SkeletonLine className="w-24 h-5 mb-4" />
      <div className="flex items-end justify-between h-48 pt-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <SkeletonLine className="w-12 rounded-t" style={{ height: `${Math.random() * 120 + 40}px` }} />
            <SkeletonLine className="w-8 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ type = "card", count = 1, className = "" }) {
  if (type === "table") return <SkeletonTable rows={count} className={className} />;
  if (type === "stat") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    );
  }
  if (type === "chart") return <SkeletonChart className={className} />;

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
