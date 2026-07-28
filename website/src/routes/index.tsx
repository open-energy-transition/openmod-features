import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  FaChartSimple,
  FaCircleQuestion,
  FaClipboardCheck,
  FaCodeBranch,
  FaFileCircleCheck,
  FaRegCircleQuestion,
  FaTableList,
} from 'react-icons/fa6'
import { useDashboardContext } from '../components/dashboard-layout'
import { Panel } from '../components/page-shell'
import { CoverageBadge, StatusLegend, ToolName } from '../components/ui'
import {
  calculateToolCoverage,
  calculateUseCaseCoverage,
  countFeatures,
} from '../data/coverage'
import type { CoverageResult, ToolRecord, UseCaseRecord } from '../data/types'
import { calculateValidation, compareCoverage } from '../lib/dashboard-utils'

export const Route = createFileRoute('/')({
  component: OverviewPage,
})

function OverviewPage() {
  const { data, coverageOptions: options } = useDashboardContext()
  const validation = useMemo(() => calculateValidation(data), [data])
  const toolCoverages = data.tools
    .map((tool) => ({
      tool,
      coverage: calculateToolCoverage(data.taxonomy, tool, options),
    }))
    .sort((left, right) => compareCoverage(right.coverage, left.coverage))
  const useCaseFits = data.useCases
    .flatMap((useCase) =>
      data.tools.map((tool) => ({
        tool,
        useCase,
        coverage: calculateUseCaseCoverage(data.taxonomy, tool, useCase, options),
      })),
    )
    .sort((left, right) => compareCoverage(right.coverage, left.coverage))
  const quality = useMemo(() => calculateQuality(data), [data])
  const strongestTool = toolCoverages[0]
  const strongestFit = useCaseFits[0]
  const totalRequiredRows = data.useCases.reduce(
    (total, useCase) => total + countRequiredRows(useCase),
    0,
  )

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Most Complete Tool"
          value={strongestTool?.tool.shortname ?? 'N/A'}
          detail={
            strongestTool
              ? `${Math.round(strongestTool.coverage.percentage ?? 0)}% taxonomy coverage`
              : undefined
          }
          icon={<FaChartSimple aria-hidden="true" />}
        />
        <Metric
          label="Strongest Use-Case Fit"
          value={strongestFit?.tool.shortname ?? 'N/A'}
          detail={
            strongestFit
              ? `${strongestFit.useCase.name}: ${Math.round(strongestFit.coverage.percentage ?? 0)}%`
              : undefined
          }
          icon={<FaClipboardCheck aria-hidden="true" />}
        />
        <Metric
          label="Source Validation"
          value={`${Math.round(validation)}%`}
          detail="Implemented or in-development values with at least one source."
          icon={<FaFileCircleCheck aria-hidden="true" />}
        />
        <Metric
          label="Required Rows"
          value={totalRequiredRows.toString()}
          detail={`Across ${data.useCases.length} built-in use cases.`}
          icon={<FaTableList aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid gap-4">
          <Panel title="Data Quality" description="Maintenance signals for the feature inventory.">
            <dl className="grid gap-3 p-4 text-sm sm:grid-cols-3 xl:grid-cols-1">
              <QualityItem
                icon={<FaRegCircleQuestion aria-hidden="true" />}
                label="Unknown values"
                value={quality.unknown.toString()}
              />
              <QualityItem
                icon={<FaCircleQuestion aria-hidden="true" />}
                label="Unsourced implemented values"
                value={quality.unsourced.toString()}
              />
              <QualityItem
                icon={<FaCodeBranch aria-hidden="true" />}
                label="In-development values"
                value={quality.development.toString()}
              />
            </dl>
          </Panel>

          <Panel title="Coverage Legend">
            <div className="p-4">
              <StatusLegend />
            </div>
          </Panel>
        </div>

        <Panel title="Tool Coverage" description="Share of taxonomy rows met by each tool.">
          <div className="divide-y divide-slate-100">
            {toolCoverages.map(({ tool, coverage }) => (
              <div
                key={tool.id}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(180px,260px)_1fr_72px] sm:items-center"
              >
                <ToolName tool={tool} />
                <Bar percentage={coverage.percentage ?? 0} />
                <CoverageBadge coverage={coverage} />
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string
  detail?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="atlas-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <dt className="atlas-caption text-xs font-semibold uppercase tracking-[0.14em]">
          {label}
        </dt>
        {icon ? <span className="atlas-muted">{icon}</span> : null}
      </div>
      <dd className="mt-2 truncate text-2xl font-semibold tabular-nums text-[var(--atlas-ink)]">{value}</dd>
      {detail ? <p className="atlas-caption mt-2 text-xs leading-5">{detail}</p> : null}
    </div>
  )
}

function QualityItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="atlas-subtle-card flex items-center justify-between gap-3 px-3 py-2">
      <dt className="flex min-w-0 items-center gap-2 text-[var(--atlas-ink-soft)]">
        <span className="atlas-muted">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="font-semibold tabular-nums text-[var(--atlas-ink)]">{value}</dd>
    </div>
  )
}

function Bar({ percentage }: { percentage: number }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[var(--atlas-surface-inset)]"
      aria-label={`${Math.round(percentage)} percent coverage`}
    >
      <div
        className="h-full rounded-full bg-[var(--atlas-hydro)]"
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
    </div>
  )
}

function countRequiredRows(useCase: UseCaseRecord) {
  return Object.values(useCase.features).reduce(
    (total, category) =>
      total +
      Object.values(category).filter((feature) => feature.value === 'y').length,
    0,
  )
}

function calculateQuality(data: {
  tools: ToolRecord[]
}) {
  let unknown = 0
  let unsourced = 0
  let development = 0

  for (const tool of data.tools) {
    for (const category of Object.values(tool.features)) {
      for (const feature of Object.values(category)) {
        if (feature.value === '?') {
          unknown += 1
        }

        if (feature.value === 'y' && feature.sources.length === 0) {
          unsourced += 1
        }

        if (feature.value === 'dev') {
          development += 1
        }
      }
    }
  }

  return { unknown, unsourced, development }
}
