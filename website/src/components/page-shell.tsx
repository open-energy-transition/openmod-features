import type { ReactNode } from 'react'

export function FeatureTable({
  children,
  minWidth,
}: {
  children: ReactNode
  minWidth: string
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function ColumnHead({ children }: { children: ReactNode }) {
  return (
    <th className="sticky top-0 z-10 border-b border-slate-200 bg-white px-3 py-3 text-center font-semibold">
      {children}
    </th>
  )
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      role="status"
      className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-10 text-center"
    >
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </div>
  )
}

