// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { FaArrowRight } from 'react-icons/fa6'
import { ChartCard, TooltipBody } from '../components/charts/chart-card'
import type { ChartLinkTarget } from '../components/charts/chart-card'
import { ColumnChart } from '../components/charts/column-chart'
import type { ColumnDatum } from '../components/charts/column-chart'
import { useDashboardContext } from '../components/dashboard-layout'
import {
  calculateToolCoverage,
  calculateUseCaseCoverage,
  countFeatures,
  createUnifiedUseCase,
} from '../data/coverage'
import { CUSTOM_USE_CASE_ID } from '../data/custom-use-case'
import type { CoverageResult, ToolRecord } from '../data/types'
import { compareCoverage } from '../lib/dashboard-utils'

export const Route = createFileRoute('/')({
  component: HomePage,
})

type ToolScore = { tool: ToolRecord; coverage: CoverageResult }

function HomePage() {
  const { data, coverageOptions } = useDashboardContext()
  const featureCount = countFeatures(data)
  const builtInUseCases = useMemo(
    () => data.useCases.filter((useCase) => useCase.id !== CUSTOM_USE_CASE_ID),
    [data.useCases],
  )
  const toolBenchmarks = useMemo(
    () =>
      rankTools(data.tools, (tool) =>
        calculateToolCoverage(data.taxonomy, tool, coverageOptions),
      ),
    [coverageOptions, data.taxonomy, data.tools],
  )
  const useCaseBenchmarks = useMemo(() => {
    const unifiedUseCase = createUnifiedUseCase(builtInUseCases)
    const scored = builtInUseCases.map((useCase) => ({ useCase, search: useCase.id }))
    if (unifiedUseCase) {
      scored.push({ useCase: unifiedUseCase, search: 'default' })
    }

    return scored.map(({ useCase, search }) => ({
      useCase,
      search: { use_cases: search },
      tools: rankTools(data.tools, (tool) =>
        calculateUseCaseCoverage(data.taxonomy, tool, useCase, coverageOptions),
      ),
    }))
  }, [builtInUseCases, coverageOptions, data.taxonomy, data.tools])

  return (
    <div className="grid gap-6">
      <section className="atlas-hero grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="atlas-eyebrow">Energy system modelling tools</p>
          <h1 className="atlas-hero-title mt-2 text-3xl font-semibold sm:text-4xl">
            How well does each tool fit your modelling workflow?
          </h1>
          <p className="atlas-copy mt-3 text-sm leading-6 sm:text-base">
            A community-maintained feature inventory for energy system modelling
            tools and common planning use cases. Each chart scores tools by the
            share of features they support; select a column to see the evidence
            behind it. PLEXOS® is included as a proprietary reference point.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <HeroLink to="/use-cases" variant="primary">
            Compare use-case fit
          </HeroLink>
          <HeroLink to="/builder">Build a custom use case</HeroLink>
        </div>
      </section>

      <ChartCard
        title="Feature coverage"
        subtitle={`Share of all ${featureCount} taxonomy features implemented`}
        direction="higher"
        link={{ to: '/tools', label: 'Tool matrix' }}
        csv={coverageCsv('feature-coverage', toolBenchmarks)}
      >
        <ColumnChart
          label="Feature coverage by tool"
          data={toColumns(toolBenchmarks, { to: '/tools' })}
        />
      </ChartCard>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {useCaseBenchmarks.map(({ useCase, search, tools }) => (
          <ChartCard
            key={useCase.id}
            compact
            title={useCase.name}
            subtitle="Share of required features met"
            direction="higher"
            info={useCase.description || undefined}
            link={{ to: '/tools', search, label: 'Matrix' }}
            csv={coverageCsv(`${useCase.id}-fit`, tools)}
          >
            <ColumnChart
              size="sm"
              label={`${useCase.name} fit by tool`}
              data={toColumns(tools, { to: '/tools', search })}
            />
          </ChartCard>
        ))}
      </section>
    </div>
  )
}

function rankTools(
  tools: ToolRecord[],
  score: (tool: ToolRecord) => CoverageResult,
): ToolScore[] {
  return tools
    .map((tool) => ({ tool, coverage: score(tool) }))
    .sort((left, right) => compareCoverage(right.coverage, left.coverage))
}

function toColumns(items: ToolScore[], link: ChartLinkTarget): ColumnDatum[] {
  return items.map(({ tool, coverage }) => ({
    id: tool.id,
    label: tool.shortname,
    value: coverage.percentage ?? 0,
    valueLabel: formatPercent(coverage),
    color: 'var(--chart-series-1)',
    link,
    tooltip: (
      <TooltipBody
        title={tool.name}
        rows={[
          ['Score', formatPercent(coverage)],
          ['Features met', `${coverage.met} of ${coverage.total}`],
        ]}
      />
    ),
  }))
}

function coverageCsv(filename: string, items: ToolScore[]) {
  return {
    filename,
    rows: [
      ['tool', 'score_percent', 'features_met', 'features_total'],
      ...items.map(({ tool, coverage }) => [
        tool.shortname,
        coverage.percentage === null ? '' : coverage.percentage.toFixed(1),
        coverage.met,
        coverage.total,
      ]),
    ],
  }
}

function formatPercent(coverage: CoverageResult) {
  return coverage.percentage === null ? 'N/A' : `${Math.round(coverage.percentage)}%`
}

function HeroLink({
  to,
  variant = 'secondary',
  children,
}: {
  to: string
  variant?: 'primary' | 'secondary'
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className={`${variant === 'primary' ? 'atlas-primary-button' : 'atlas-secondary-button'} atlas-focus inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold outline-none`}
    >
      {children}
      <FaArrowRight aria-hidden="true" />
    </Link>
  )
}
