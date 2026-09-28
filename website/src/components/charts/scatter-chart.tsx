// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Link } from '@tanstack/react-router'
import type { ReactElement, ReactNode } from 'react'
import { ChartTooltip } from './chart-card'
import type { ChartLinkTarget } from './chart-card'
import { domainTicks, paretoFrontier } from '../../lib/chart-utils'

export type ScatterDatum = {
  id: string
  label: string
  x: number
  y: number
  color: string
  tooltip: ReactNode
  link?: ChartLinkTarget
}

type Domain = [number, number]

export function ScatterChart({
  data,
  label,
  xLabel,
  yLabel,
  xDomain = [0, 100],
  yDomain = [0, 100],
  quadrant,
  frontier = false,
  tickFormat = (value) => `${value}%`,
}: {
  data: ScatterDatum[]
  label: string
  xLabel: string
  yLabel: string
  xDomain?: Domain
  yDomain?: Domain
  quadrant?: { x: number; y: number; label: string }
  frontier?: boolean
  tickFormat?: (value: number) => string
}) {
  const toX = (value: number) => toPercent(value, xDomain)
  const toY = (value: number) => toPercent(value, yDomain)
  const groups = groupCoincident(data)
  const frontierPoints = frontier ? paretoFrontier(groups) : []

  return (
    <figure className="atlas-scatter" aria-label={label}>
      <div className="atlas-scatter-ylabel" aria-hidden="true">
        <span>{yLabel}</span>
      </div>
      <div className="atlas-scatter-yaxis" aria-hidden="true">
        {domainTicks(yDomain).map((tick) => (
          <span key={tick} style={{ bottom: `${toY(tick)}%` }}>
            {tickFormat(tick)}
          </span>
        ))}
      </div>
      <div className="atlas-scatter-plot">
        {domainTicks(yDomain).map((tick) => (
          <span
            key={`y-${tick}`}
            className="atlas-scatter-gridline"
            data-axis="y"
            data-baseline={tick === yDomain[0] || undefined}
            style={{ bottom: `${toY(tick)}%` }}
            aria-hidden="true"
          />
        ))}
        {domainTicks(xDomain).map((tick) => (
          <span
            key={`x-${tick}`}
            className="atlas-scatter-gridline"
            data-axis="x"
            data-baseline={tick === xDomain[0] || undefined}
            style={{ left: `${toX(tick)}%` }}
            aria-hidden="true"
          />
        ))}
        {quadrant ? (
          <div
            className="atlas-scatter-quadrant"
            style={{ left: `${toX(quadrant.x)}%`, bottom: `${toY(quadrant.y)}%` }}
            aria-hidden="true"
          >
            <span>{quadrant.label}</span>
          </div>
        ) : null}
        {frontierPoints.length > 1 ? (
          <svg
            className="atlas-scatter-frontier"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              points={frontierPoints
                .map((point) => `${toX(point.x)} ${100 - toY(point.y)}`)
                .join(' ')}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
        {groups.map((group) => (
          <ScatterPoint
            key={group.id}
            group={group}
            left={toX(group.x)}
            bottom={toY(group.y)}
            labelSide={labelSide(group, groups, toX, toY)}
          />
        ))}
      </div>
      <div />
      <div />
      <div className="atlas-scatter-xaxis" aria-hidden="true">
        {domainTicks(xDomain).map((tick) => (
          <span key={tick} style={{ left: `${toX(tick)}%` }}>
            {tickFormat(tick)}
          </span>
        ))}
      </div>
      <div />
      <div />
      <p className="atlas-scatter-xlabel" aria-hidden="true">
        {xLabel}
      </p>
    </figure>
  )
}

type PointGroup = {
  id: string
  x: number
  y: number
  members: ScatterDatum[]
}

function ScatterPoint({
  group,
  left,
  bottom,
  labelSide,
}: {
  group: PointGroup
  left: number
  bottom: number
  labelSide: 'left' | 'right'
}) {
  const [first] = group.members
  const text = group.members.map((member) => member.label).join(', ')
  const ariaLabel = group.members
    .map((member) => `${member.label}: ${Math.round(member.x)}%, ${Math.round(member.y)}%`)
    .join('; ')
  const className = 'atlas-scatter-point atlas-focus outline-none'
  const style = { left: `${left}%`, bottom: `${bottom}%` }
  const render: ReactElement<Record<string, unknown>> =
    group.members.length === 1 && first.link ? (
      <Link
        to={first.link.to}
        search={first.link.search as never}
        aria-label={ariaLabel}
        className={className}
        style={style}
      />
    ) : (
      <div tabIndex={0} role="img" aria-label={ariaLabel} className={className} style={style} />
    )

  return (
    <ChartTooltip
      content={
        <div className="grid gap-2">
          {group.members.map((member) => (
            <div key={member.id}>{member.tooltip}</div>
          ))}
        </div>
      }
      render={render}
    >
      <span
        className="atlas-scatter-dot"
        style={{ backgroundColor: first.color }}
        aria-hidden="true"
      />
      <span className="atlas-scatter-label" data-side={labelSide} aria-hidden="true">
        {text}
      </span>
    </ChartTooltip>
  )
}

function groupCoincident(data: ScatterDatum[]): PointGroup[] {
  const groups = new Map<string, PointGroup>()

  for (const datum of data) {
    const key = `${datum.x.toFixed(2)}:${datum.y.toFixed(2)}`
    const group = groups.get(key)
    if (group) {
      group.members.push(datum)
    } else {
      groups.set(key, { id: datum.id, x: datum.x, y: datum.y, members: [datum] })
    }
  }

  return [...groups.values()]
}

// Put the label on the side away from the plot edge and away from any close neighbour.
function labelSide(
  group: PointGroup,
  groups: PointGroup[],
  toX: (value: number) => number,
  toY: (value: number) => number,
): 'left' | 'right' {
  const x = toX(group.x)
  if (x > 80) {
    return 'left'
  }
  const crowdedRight = groups.some(
    (other) =>
      other !== group &&
      toX(other.x) > x &&
      toX(other.x) - x < 18 &&
      Math.abs(toY(other.y) - toY(group.y)) < 7,
  )
  return crowdedRight && x > 15 ? 'left' : 'right'
}

function toPercent(value: number, [low, high]: Domain) {
  return high === low ? 0 : Math.max(0, Math.min(100, ((value - low) / (high - low)) * 100))
}
