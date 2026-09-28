// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

export type Scale = {
  max: number
  ticks: number[]
  tickFormat: (value: number) => string
}

export const percentScale: Scale = {
  max: 100,
  ticks: [0, 25, 50, 75, 100],
  tickFormat: (value) => `${value}%`,
}

export function countScale(maxValue: number): Scale {
  const step = niceStep(maxValue / 4)
  const max = Math.max(step, Math.ceil(maxValue / step) * step)
  const ticks: number[] = []
  for (let tick = 0; tick <= max; tick += step) {
    ticks.push(tick)
  }
  return { max, ticks, tickFormat: (value) => value.toLocaleString() }
}

function niceStep(raw: number) {
  if (raw <= 1) {
    return 1
  }
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const residual = raw / magnitude
  const nice = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10
  return nice * magnitude
}

/** A 0-100 percentage domain padded around the data and snapped to tens. */
export function percentDomain(values: number[]): [number, number] {
  if (values.length === 0) {
    return [0, 100]
  }
  const low = Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10)
  const high = Math.min(100, Math.ceil((Math.max(...values) + 5) / 10) * 10)
  return high - low < 20 ? [Math.max(0, high - 20), Math.max(20, high)] : [low, high]
}

export function domainTicks([low, high]: [number, number], step = 10) {
  const ticks: number[] = []
  for (let tick = low; tick <= high; tick += step) {
    ticks.push(tick)
  }
  return ticks
}

export function median(values: number[]) {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

/** Points not beaten on both axes by any other point, ordered by x. Higher is better on both. */
export function paretoFrontier<T extends { x: number; y: number }>(points: T[]) {
  return points
    .filter(
      (point) =>
        !points.some(
          (other) =>
            other !== point &&
            other.x >= point.x &&
            other.y >= point.y &&
            (other.x > point.x || other.y > point.y),
        ),
    )
    .sort((left, right) => left.x - right.x || right.y - left.y)
}

export function toCsv(rows: Array<Array<string | number>>) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = String(cell)
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
        })
        .join(','),
    )
    .join('\n')
}

export const toolTypeLegend = [
  { label: 'Open source', color: 'var(--chart-open-source)' },
  { label: 'Proprietary reference', color: 'var(--chart-proprietary)' },
]

export function toolTypeColor(tool: { openSource: boolean }) {
  return tool.openSource ? 'var(--chart-open-source)' : 'var(--chart-proprietary)'
}

export function toolTypeLabel(tool: { openSource: boolean }) {
  return tool.openSource ? 'Open source' : 'Proprietary reference'
}

export type LabelSide = 'right' | 'left' | 'above' | 'below'

type Box = { left: number; top: number; right: number; bottom: number }

/**
 * Greedy label placement for scatter points in pixel space: each label takes the first side
 * that stays inside the plot and clears every dot and every label already placed.
 */
export function placeScatterLabels(
  points: Array<{ x: number; y: number; text: string }>,
  width: number,
  height: number,
  { charWidth = 6.4, labelHeight = 12, dotRadius = 7, gap = 4 } = {},
): LabelSide[] {
  const dots: Box[] = points.map(({ x, y }) => ({
    left: x - dotRadius,
    right: x + dotRadius,
    top: y - dotRadius,
    bottom: y + dotRadius,
  }))
  const placed: Box[] = []

  return points.map(({ x, y, text }) => {
    const labelWidth = text.length * charWidth
    const candidates: Array<[LabelSide, Box]> = [
      ['right', { left: x + dotRadius + gap, right: x + dotRadius + gap + labelWidth, top: y - labelHeight / 2, bottom: y + labelHeight / 2 }],
      ['left', { left: x - dotRadius - gap - labelWidth, right: x - dotRadius - gap, top: y - labelHeight / 2, bottom: y + labelHeight / 2 }],
      ['above', { left: x - labelWidth / 2, right: x + labelWidth / 2, top: y - dotRadius - gap - labelHeight, bottom: y - dotRadius - gap }],
      ['below', { left: x - labelWidth / 2, right: x + labelWidth / 2, top: y + dotRadius + gap, bottom: y + dotRadius + gap + labelHeight }],
    ]
    const fits = ([, box]: [LabelSide, Box]) =>
      box.left >= 0 &&
      box.right <= width &&
      box.top >= 0 &&
      box.bottom <= height &&
      ![...dots, ...placed].some((other) => overlaps(box, other))
    const [side, box] = candidates.find(fits) ?? candidates[0]
    placed.push(box)
    return side
  })
}

function overlaps(a: Box, b: Box) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}
