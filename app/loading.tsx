export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-xl animate-pulse">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 sm:p-9">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-44 rounded-lg bg-slate-800" />
              <div className="h-3 w-28 rounded-lg bg-slate-800/60" />
            </div>
            <div className="h-6 w-14 rounded-full bg-slate-800" />
          </div>

          {/* Amount input */}
          <div className="mb-6">
            <div className="mb-2.5 h-3 w-16 rounded bg-slate-800" />
            <div className="h-16 rounded-xl bg-slate-800" />
          </div>

          {/* Currency selectors */}
          <div className="mb-6 flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-10 rounded bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-800" />
            </div>
            <div className="mb-0.5 h-11 w-11 rounded-full bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-6 rounded bg-slate-800" />
              <div className="h-16 rounded-xl bg-slate-800" />
            </div>
          </div>

          {/* Divider */}
          <div className="mb-6 h-px bg-slate-800" />

          {/* Result skeleton */}
          <div className="space-y-3">
            <div className="h-3.5 w-32 rounded-full bg-slate-800" />
            <div className="h-14 w-64 rounded-xl bg-slate-800" />
            <div className="h-3 w-40 rounded-full bg-slate-800/70" />
            <div className="mt-4 h-px bg-slate-800" />
            <div className="flex justify-between pt-1">
              <div className="h-3 w-36 rounded bg-slate-800/60" />
              <div className="h-3 w-28 rounded bg-slate-800/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
