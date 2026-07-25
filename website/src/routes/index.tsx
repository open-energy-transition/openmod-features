import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import {
  FaArrowRight,
  FaChartSimple,
  FaCircleQuestion,
  FaClipboardCheck,
  FaCodeBranch,
  FaFileCircleCheck,
  FaListCheck,
  FaPenToSquare,
  FaRegCircleQuestion,
  FaScrewdriverWrench,
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
      <section className="grid gap-3 lg:grid-cols-3">
        <StartAction
          to="/tools"
          icon={<FaScrewdriverWrench aria-hidden="true" />}
          title="Compare Tools"
          detail="Review feature coverage across every model in the inventory."
        />
        <StartAction
          to="/use-cases"
          icon={<FaListCheck aria-hidden="true" />}
          title="Compare Use Cases"
          detail="Check how a selected tool fits built-in policy and planning cases."
        />
        <StartAction
          to="/builder"
          icon={<FaPenToSquare aria-hidden="true" />}
          title="Build Custom Use Case"
          detail="Compose requirements, compare fit, and share the result as a URL."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="What This Answers">
          <div className="grid gap-3 p-4">
            <AnswerItem text="Which tools support the modelling features I care about?" />
            <AnswerItem text="Which use cases require each feature row?" />
            <AnswerItem text="Which tool best fits a custom set of requirements?" />
          </div>
        </Panel>

        <Panel
          title="Data Provenance"
          description="The dashboard is generated from repository feature inventory files."
        >
          <dl className="grid gap-3 p-4 text-sm sm:grid-cols-3">
            <ProvenanceItem
              label="Generated"
              value={new Date(data.generatedAt).toLocaleString()}
            />
            <ProvenanceItem
              label="Coverage Rules"
              value="Header switches"
              detail="Percentages respond to source and development settings."
            />
            <ProvenanceItem
              label="Validation"
              value="Docs + source"
              detail="Linked evidence separates sourced and unsourced support."
            />
          </dl>
        </Panel>
      </section>

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

function StartAction({
  to,
  icon,
  title,
  detail,
}: {
  to: string
  icon: React.ReactNode
  title: string
  detail: string
}) {
  return (
    <Link
      to={to}
      className="group grid gap-3 rounded-md border border-slate-200 bg-white p-4 outline-none hover:border-teal-300 hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-700"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-teal-700 text-white">
          {icon}
        </span>
        <FaArrowRight
          className="text-slate-400 group-hover:text-teal-700"
          aria-hidden="true"
        />
      </span>
      <span>
        <span className="block font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-600">{detail}</span>
      </span>
    </Link>
  )
}

function AnswerItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <FaArrowRight className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
      <span>{text}</span>
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
      <dd className="mt-2 truncate text-2xl font-semibold text-slate-950">{value}</dd>
      {detail ? <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p> : null}
    </div>
  )
}

function ProvenanceItem({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-slate-900">{value}</dd>
      {detail ? <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p> : null}
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
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="flex min-w-0 items-center gap-2 text-slate-600">
        <span className="text-slate-400">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="font-semibold tabular-nums text-slate-950">{value}</dd>
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
