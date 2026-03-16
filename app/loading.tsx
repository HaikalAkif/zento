export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl animate-pulse">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 sm:p-9">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-5 w-44 bg-slate-800 rounded-lg" />
              <div className="h-3 w-28 bg-slate-800/60 rounded-lg" />
            </div>
            <div className="h-6 w-14 bg-slate-800 rounded-full" />
          </div>

          {/* Amount input */}
          <div className="mb-6">
            <div className="h-3 w-16 bg-slate-800 rounded mb-2.5" />
            <div className="h-16 bg-slate-800 rounded-xl" />
          </div>

          {/* Currency selectors */}
          <div className="flex items-end gap-3 mb-6">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-10 bg-slate-800 rounded" />
              <div className="h-16 bg-slate-800 rounded-xl" />
            </div>
            <div className="w-11 h-11 bg-slate-800 rounded-full mb-0.5" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-6 bg-slate-800 rounded" />
              <div className="h-16 bg-slate-800 rounded-xl" />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-800 mb-6" />

          {/* Result skeleton */}
          <div className="space-y-3">
            <div className="h-3.5 w-32 bg-slate-800 rounded-full" />
            <div className="h-14 w-64 bg-slate-800 rounded-xl" />
            <div className="h-3 w-40 bg-slate-800/70 rounded-full" />
            <div className="h-px bg-slate-800 mt-4" />
            <div className="flex justify-between pt-1">
              <div className="h-3 w-36 bg-slate-800/60 rounded" />
              <div className="h-3 w-28 bg-slate-800/60 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
