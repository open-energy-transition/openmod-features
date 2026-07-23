import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  FaClipboardCheck,
  FaListCheck,
  FaScrewdriverWrench,
  FaTableList,
} from 'react-icons/fa6'
import { useDashboardContext } from '../components/dashboard-layout'
import { Panel } from '../components/page-shell'
import { CoverageBadge, StatusLegend, ToolName } from '../components/ui'
import { calculateToolCoverage, countFeatures } from '../data/coverage'
import type { ToolRecord } from '../data/types'
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
  const strongest = toolCoverages[0]
  const weakest = toolCoverages[toolCoverages.length - 1]

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Tools"
          value={data.tools.length.toString()}
          icon={<FaScrewdriverWrench aria-hidden="true" />}
        />
        <Metric
          label="Use cases"
          value={data.useCases.length.toString()}
          icon={<FaListCheck aria-hidden="true" />}
        />
        <Metric
          label="Feature rows"
          value={countFeatures(data).toString()}
          icon={<FaTableList aria-hidden="true" />}
        />
        <Metric
          label="Sourced entries"
          value={`${Math.round(validation)}%`}
          detail="Implemented or in-development values with at least one source."
          icon={<FaClipboardCheck aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
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

        <Panel title="Coverage Range">
          <dl className="grid gap-4 p-4 text-sm">
            <RangeItem label="Highest" tool={strongest?.tool} value={strongest?.coverage} />
            <RangeItem label="Lowest" tool={weakest?.tool} value={weakest?.coverage} />
          </dl>
          <div className="border-t border-slate-100 p-4">
            <StatusLegend />
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
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </dt>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <dd className="mt-2 text-3xl font-semibold text-slate-950">{value}</dd>
      {detail ? <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p> : null}
    </div>
  )
}

function RangeItem({
  label,
  tool,
  value,
}: {
  label: string
  tool?: ToolRecord
  value?: ReturnType<typeof calculateToolCoverage>
}) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 flex items-center justify-between gap-3 font-medium">
        <span>{tool?.name ?? 'N/A'}</span>
        {value ? <CoverageBadge coverage={value} /> : null}
      </dd>
    </div>
  )
}

function Bar({ percentage }: { percentage: number }) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-slate-100"
      aria-label={`${Math.round(percentage)} percent coverage`}
    >
      <div
        className="h-full rounded-full bg-teal-700"
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
    </div>
  )
}
