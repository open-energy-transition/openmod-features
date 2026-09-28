// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Link } from '@tanstack/react-router'
import type { CSSProperties, ReactElement, ReactNode } from 'react'
import { ChartTooltip } from './chart-card'
import type { ChartLinkTarget } from './chart-card'
import { percentScale } from '../../lib/chart-utils'
import type { Scale } from '../../lib/chart-utils'

export type ColumnDatum = {
  id: string
  label: string
  value: number
  valueLabel: string
  color: string
  tooltip: ReactNode
  link?: ChartLinkTarget
}

export type StackedColumnDatum = {
  id: string
  label: string
  segments: Record<string, number>
  valueLabel: string
  tooltip: ReactNode
  link?: ChartLinkTarget
}

export type StackSeries = {
  key: string
  label: string
  color: string
}

export function ColumnChart({
  data,
  label,
  scale = percentScale,
  size = 'md',
}: {
  data: ColumnDatum[]
  label: string
  scale?: Scale
  size?: 'sm' | 'md'
}) {
  return (
    <ColumnFrame label={label} scale={scale} size={size} labels={data.map((d) => d.label)}>
      {data.map((datum) => (
        <ColumnSlot key={datum.id} datum={datum}>
          <span
            className="atlas-column-bar"
            style={{
              height: toHeight(datum.value, scale.max),
              backgroundColor: datum.color,
            }}
          />
          <ColumnCap value={datum.value} max={scale.max}>
            {datum.valueLabel}
          </ColumnCap>
        </ColumnSlot>
      ))}
    </ColumnFrame>
  )
}

export function StackedColumnChart({
  data,
  series,
  label,
  scale = percentScale,
  size = 'md',
}: {
  data: StackedColumnDatum[]
  series: StackSeries[]
  label: string
  scale?: Scale
  size?: 'sm' | 'md'
}) {
  return (
    <ColumnFrame label={label} scale={scale} size={size} labels={data.map((d) => d.label)}>
      {data.map((datum) => {
        const total = series.reduce((sum, item) => sum + (datum.segments[item.key] ?? 0), 0)

        return (
          <ColumnSlot key={datum.id} datum={datum}>
            <span
              className="atlas-column-bar atlas-column-stack"
              style={{ height: toHeight(total, scale.max) }}
            >
              {series.map((item) => {
                const value = datum.segments[item.key] ?? 0
                return value > 0 ? (
                  <span
                    key={item.key}
                    className="atlas-column-segment"
                    style={{ flexGrow: value, backgroundColor: item.color }}
                  />
                ) : null
              })}
            </span>
            <ColumnCap value={total} max={scale.max}>
              {datum.valueLabel}
            </ColumnCap>
          </ColumnSlot>
        )
      })}
    </ColumnFrame>
  )
}

function ColumnFrame({
  label,
  scale,
  size,
  labels,
  children,
}: {
  label: string
  scale: Scale
  size: 'sm' | 'md'
  labels: string[]
  children: ReactNode
}) {
  return (
    <figure className="atlas-columns" data-size={size} aria-label={label}>
      <div className="atlas-columns-axis" aria-hidden="true">
        {scale.ticks.map((tick) => (
          <span key={tick} style={{ bottom: toHeight(tick, scale.max) }}>
            {scale.tickFormat(tick)}
          </span>
        ))}
      </div>
      <div className="atlas-columns-plot">
        {scale.ticks.map((tick) => (
          <span
            key={tick}
            className="atlas-columns-gridline"
            data-baseline={tick === 0 || undefined}
            style={{ bottom: toHeight(tick, scale.max) }}
            aria-hidden="true"
          />
        ))}
        <div className="atlas-columns-slots">{children}</div>
      </div>
      <div className="atlas-columns-labels" aria-hidden="true">
        {labels.map((text, index) => (
          <span key={`${text}-${index}`}>{text}</span>
        ))}
      </div>
    </figure>
  )
}

function ColumnSlot({
  datum,
  children,
}: {
  datum: { label: string; valueLabel: string; tooltip: ReactNode; link?: ChartLinkTarget }
  children: ReactNode
}) {
  const ariaLabel = `${datum.label}: ${datum.valueLabel}`
  const render: ReactElement<Record<string, unknown>> = datum.link ? (
    <Link
      to={datum.link.to}
      search={datum.link.search as never}
      aria-label={ariaLabel}
      className="atlas-column-slot atlas-focus outline-none"
    />
  ) : (
    <div
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      className="atlas-column-slot atlas-focus outline-none"
    />
  )

  return (
    <ChartTooltip content={datum.tooltip} render={render}>
      {children}
    </ChartTooltip>
  )
}

function ColumnCap({
  value,
  max,
  children,
}: {
  value: number
  max: number
  children: ReactNode
}) {
  return (
    <span
      className="atlas-column-cap"
      style={{ '--cap': toHeight(value, max) } as CSSProperties}
    >
      {children}
    </span>
  )
}

function toHeight(value: number, max: number) {
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`
}
