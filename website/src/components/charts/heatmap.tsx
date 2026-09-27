// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Link } from '@tanstack/react-router'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { ChartTooltip } from './chart-card'
import type { ChartLinkTarget } from './chart-card'

export type HeatmapRow = {
  id: string
  label: string
  swatch?: string
}

export type HeatmapColumn = {
  id: string
  label: string
  title?: string
}

export type HeatmapCell = {
  value: number | null
  valueLabel: string
  tooltip: ReactNode
  link?: ChartLinkTarget
}

export function Heatmap({
  label,
  rows,
  columns,
  cell,
}: {
  label: string
  rows: HeatmapRow[]
  columns: HeatmapColumn[]
  cell: (row: HeatmapRow, column: HeatmapColumn) => HeatmapCell
}) {
  return (
    <div className="atlas-heatmap-frame">
      <table className="atlas-heatmap" aria-label={label}>
        <thead>
          <tr>
            <th scope="col" className="atlas-heatmap-corner">
              <span className="sr-only">Tool</span>
            </th>
            {columns.map((column) => (
              <th key={column.id} scope="col" title={column.title} className="atlas-heatmap-col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row" className="atlas-heatmap-row">
                <span className="inline-flex items-center gap-1.5">
                  {row.swatch ? (
                    <span
                      className="atlas-chart-swatch"
                      style={{ backgroundColor: row.swatch }}
                      aria-hidden="true"
                    />
                  ) : null}
                  {row.label}
                </span>
              </th>
              {columns.map((column) => (
                <HeatmapCellView key={column.id} cell={cell(row, column)} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function HeatmapScale() {
  return (
    <span className="inline-flex items-center gap-2">
      <span>0%</span>
      <span className="atlas-heatmap-scale" aria-hidden="true" />
      <span>100%</span>
    </span>
  )
}

function HeatmapCellView({ cell }: { cell: HeatmapCell }) {
  // Fill strength is capped at 70% so the regular ink stays >= 4.5:1 in both themes.
  const style = { '--cell': `${(cell.value ?? 0) * 0.7}%` } as CSSProperties
  const className = 'atlas-heatmap-value atlas-focus outline-none'
  const render: ReactElement<Record<string, unknown>> = cell.link ? (
    <Link
      to={cell.link.to}
      search={cell.link.search as never}
      className={className}
      data-empty={cell.value === null || undefined}
      style={style}
    />
  ) : (
    <div
      tabIndex={0}
      className={className}
      data-empty={cell.value === null || undefined}
      style={style}
    />
  )

  return (
    <td className="atlas-heatmap-cell">
      <ChartTooltip content={cell.tooltip} render={render}>
        {cell.valueLabel}
      </ChartTooltip>
    </td>
  )
}
