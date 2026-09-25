// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

const FEATURE_COLUMN_MIN = 176
const FEATURE_COLUMN_MAX = 560

type FeatureTableContextValue = {
  featureColumnWidth: number | null
  setFeatureColumnWidth: Dispatch<SetStateAction<number | null>>
  minFeatureColumnWidth: number
  maxFeatureColumnWidth: number
}

const FeatureTableContext = createContext<FeatureTableContextValue | null>(null)

export function FeatureTable({
  children,
  minWidth,
}: {
  children: ReactNode
  minWidth: string
}) {
  const [featureColumnWidth, setFeatureColumnWidth] = useState<number | null>(null)
  const contextValue = useMemo(
    () => ({
      featureColumnWidth,
      setFeatureColumnWidth,
      minFeatureColumnWidth: FEATURE_COLUMN_MIN,
      maxFeatureColumnWidth: FEATURE_COLUMN_MAX,
    }),
    [featureColumnWidth],
  )
  const tableStyle = {
    minWidth,
    ...(featureColumnWidth
      ? { '--atlas-feature-column-width': `${featureColumnWidth}px` }
      : null),
  } as CSSProperties

  return (
    <FeatureTableContext.Provider value={contextValue}>
      <div className="atlas-table-frame">
        <table className="atlas-table w-full border-collapse text-sm" style={tableStyle}>
          {children}
        </table>
      </div>
    </FeatureTableContext.Provider>
  )
}

export function useFeatureTableContext() {
  return useContext(FeatureTableContext)
}

export function ColumnHead({ children }: { children: ReactNode }) {
  return (
    <th className="atlas-table-head sticky top-0 z-10 px-3 py-3 text-center font-semibold">
      {children}
    </th>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="atlas-panel">
      <div className="atlas-panel-header flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="atlas-panel-title text-base font-semibold">{title}</h2>
          {description ? (
            <p className="atlas-panel-description mt-1 text-sm">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      role="status"
      className="atlas-panel px-4 py-10 text-center"
    >
      <h2 className="text-sm font-semibold text-[var(--atlas-ink)]">{title}</h2>
      <p className="atlas-caption mt-1 text-sm">{detail}</p>
    </div>
  )
}
