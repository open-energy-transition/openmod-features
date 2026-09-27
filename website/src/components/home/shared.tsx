// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import type { ReactNode } from 'react'
import { TooltipBody } from '../charts/chart-card'
import type { ChartLinkTarget, CsvTable } from '../charts/chart-card'
import type { ColumnDatum } from '../charts/column-chart'
import type { CoverageResult, ToolRecord } from '../../data/types'
import { toolTypeColor, toolTypeLabel } from '../../lib/chart-utils'
import { formatPercent } from './home-data'

export function HomeSection({
  id,
  title,
  description,
  controls,
  children,
}: {
  id: string
  title: string
  description: ReactNode
  controls?: ReactNode
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="atlas-home-section grid gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h2 id={`${id}-title`} className="atlas-section-title">
            {title}
          </h2>
          <p className="atlas-caption mt-1 text-sm leading-6">{description}</p>
        </div>
        {controls}
      </div>
      {children}
    </section>
  )
}

export function toolScoreColumns(
  tools: ToolRecord[],
  score: (tool: ToolRecord) => CoverageResult | undefined,
  link: ChartLinkTarget,
  detailLabel = 'Features met',
): ColumnDatum[] {
  return tools.map((tool) => {
    const coverage = score(tool)
    return {
      id: tool.id,
      label: tool.shortname,
      value: coverage?.percentage ?? 0,
      valueLabel: formatPercent(coverage),
      color: toolTypeColor(tool),
      link,
      tooltip: (
        <TooltipBody
          title={tool.name}
          swatch={toolTypeColor(tool)}
          rows={[
            ['Score', formatPercent(coverage)],
            [detailLabel, coverage ? `${coverage.met} of ${coverage.total}` : 'N/A'],
            ['Type', toolTypeLabel(tool)],
          ]}
        />
      ),
    }
  })
}

export function scoreCsv(
  filename: string,
  tools: ToolRecord[],
  score: (tool: ToolRecord) => CoverageResult | undefined,
): CsvTable {
  return {
    filename,
    rows: [
      ['tool', 'open_source', 'score_percent', 'features_met', 'features_total'],
      ...tools.map((tool) => {
        const coverage = score(tool)
        return [
          tool.shortname,
          String(tool.openSource),
          coverage?.percentage == null ? '' : coverage.percentage.toFixed(1),
          coverage?.met ?? '',
          coverage?.total ?? '',
        ]
      }),
    ],
  }
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
