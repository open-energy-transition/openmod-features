// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  FaArrowRight,
  FaChartColumn,
  FaClipboardCheck,
  FaWandMagicSparkles,
} from 'react-icons/fa6'
import { useDashboardContext } from '../components/dashboard-layout'
import { calculateToolCoverage, calculateUseCaseCoverage } from '../data/coverage'
import { CUSTOM_USE_CASE_ID } from '../data/custom-use-case'
import type {
  CoverageResult,
  FeatureValue,
  ToolRecord,
  UseCaseRecord,
} from '../data/types'
import { compareCoverage } from '../lib/dashboard-utils'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data, coverageOptions } = useDashboardContext()
  const builtInUseCases = useMemo(
    () => data.useCases.filter((useCase) => useCase.id !== CUSTOM_USE_CASE_ID),
    [data.useCases],
  )
  const unifiedUseCase = useMemo(
    () => createUnifiedUseCase(builtInUseCases),
    [builtInUseCases],
  )
  const toolBenchmarks = useMemo(
    () =>
      data.tools
        .map((tool) => ({
          tool,
          coverage: calculateToolCoverage(data.taxonomy, tool, coverageOptions),
        }))
        .sort((left, right) => compareCoverage(right.coverage, left.coverage)),
    [coverageOptions, data.taxonomy, data.tools],
  )
  const unifiedBenchmarks = useMemo(
    () =>
      unifiedUseCase
        ? data.tools
            .map((tool) => ({
              tool,
              coverage: calculateUseCaseCoverage(
                data.taxonomy,
                tool,
                unifiedUseCase,
                coverageOptions,
              ),
            }))
            .sort((left, right) => compareCoverage(right.coverage, left.coverage))
        : [],
    [coverageOptions, data.taxonomy, data.tools, unifiedUseCase],
  )
  const useCaseBenchmarks = useMemo(
    () =>
      builtInUseCases.map((useCase) => ({
        useCase,
        tools: data.tools
          .map((tool) => ({
            tool,
            coverage: calculateUseCaseCoverage(
              data.taxonomy,
              tool,
              useCase,
              coverageOptions,
            ),
          }))
          .sort((left, right) => compareCoverage(right.coverage, left.coverage)),
      })),
    [builtInUseCases, coverageOptions, data.taxonomy, data.tools],
  )
  return (
    <div className="grid gap-5">
      <section className="atlas-home-hero grid gap-5 p-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.45fr)] lg:items-end">
        <div className="max-w-4xl">
          <p className="atlas-eyebrow">Energy Model Benchmarks</p>
          <h2 className="atlas-home-title mt-2 text-3xl font-semibold sm:text-4xl lg:text-5xl">
            Compare use-case scores before opening the matrix.
          </h2>
          <p className="atlas-copy mt-3 max-w-3xl text-sm leading-6 sm:text-base">
            Start with workflow-relevant feature coverage. Each chart ranks
            energy models by fit, then links to the matrix rows and evidence
            behind the score.
          </p>
        </div>

        <div className="atlas-home-action-stack grid gap-2">
          <HomeAction
            to="/use-cases"
            icon={<FaClipboardCheck aria-hidden="true" />}
            description="Review workflow fit scores."
            variant="primary"
          >
            Compare
          </HomeAction>
          <HomeAction
            to="/builder"
            icon={<FaWandMagicSparkles aria-hidden="true" />}
            description="Create a custom benchmark."
          >
            Assemble
          </HomeAction>
          <HomeAction
            to="/tools"
            icon={<FaChartColumn aria-hidden="true" />}
            description="Inspect feature evidence."
          >
            Open
          </HomeAction>
        </div>
      </section>

      <BenchmarkPanel
        title="Feature inventory"
        description="Scored against the entire taxonomy. Use this as the broad capability inventory before narrowing to workflow-specific requirements."
        cta="Inspect tool matrix"
        to="/tools"
        icon={<FaChartColumn aria-hidden="true" />}
      >
        <BenchmarkBars
          items={toolBenchmarks}
          variant="wide"
          to="/tools"
        />
      </BenchmarkPanel>

      <section className="grid gap-4 xl:grid-cols-2">
        {useCaseBenchmarks.map(({ useCase, tools }) => (
          <BenchmarkPanel
            key={useCase.id}
            title={useCase.name}
            description={useCase.description || 'Use-case fit score by model.'}
            cta="Inspect tool matrix"
            to="/tools"
            search={{ use_cases: useCase.id }}
            icon={<FaClipboardCheck aria-hidden="true" />}
          >
            <BenchmarkBars
              items={tools}
              compact
              to="/tools"
              search={{ use_cases: useCase.id }}
            />
          </BenchmarkPanel>
        ))}
        <BenchmarkPanel
          title="Unified default use cases"
          description={`A broad benchmark across the combined required features from ${builtInUseCases.length} built-in use cases. Open the matrix to inspect the scoped rows.`}
          cta="Inspect tool matrix"
          to="/tools"
          search={{ use_cases: 'default' }}
          icon={<FaClipboardCheck aria-hidden="true" />}
        >
          <BenchmarkBars
            items={unifiedBenchmarks}
            compact
            to="/tools"
            search={{ use_cases: 'default' }}
          />
        </BenchmarkPanel>
      </section>
    </div>
  )
}

function HomeAction({
  to,
  icon,
  description,
  variant = 'secondary',
  children,
}: {
  to: string
  icon: ReactNode
  description: string
  variant?: 'primary' | 'secondary'
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      data-variant={variant}
      className="atlas-home-action atlas-focus grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left outline-none"
    >
      <span className="atlas-home-action-icon">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{children}</span>
        <span className="atlas-caption mt-0.5 block truncate text-xs font-normal">
          {description}
        </span>
      </span>
      <FaArrowRight className="atlas-home-action-arrow" aria-hidden="true" />
    </Link>
  )
}

function createUnifiedUseCase(useCases: UseCaseRecord[]): UseCaseRecord | null {
  if (useCases.length === 0) {
    return null
  }

  const features: UseCaseRecord['features'] = {}

  for (const useCase of useCases) {
    for (const [categoryId, categoryFeatures] of Object.entries(useCase.features)) {
      features[categoryId] ??= {}

      for (const [featureId, feature] of Object.entries(categoryFeatures)) {
        if (feature.value === 'y') {
          features[categoryId][featureId] = { value: 'y' satisfies FeatureValue }
        }
      }
    }
  }

  return {
    id: 'unified-default-use-cases',
    name: 'Unified default use cases',
    shortname: 'Unified',
    description: 'Combined required features from all built-in use cases.',
    maintainers: [],
    assumptions: [],
    features,
  }
}

function BenchmarkPanel({
  title,
  description,
  cta,
  to,
  search,
  icon,
  children,
}: {
  title: string
  description: string
  cta: string
  to: string
  search?: Record<string, string>
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <article className="atlas-benchmark-panel">
      <div className="grid gap-3 border-b border-[var(--atlas-line-soft)] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="min-w-0">
          <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-[var(--atlas-ink)]">
            <span className="atlas-benchmark-icon">{icon}</span>
            <span className="truncate">{title}</span>
          </h3>
          <p className="atlas-caption mt-1 line-clamp-2 text-xs leading-5">
            {description}
          </p>
        </div>
        <Link
          to={to}
          search={search as never}
          className="atlas-benchmark-link atlas-focus inline-flex items-center gap-2 justify-self-start px-2.5 py-1.5 text-xs font-semibold outline-none md:justify-self-end"
        >
          {cta}
          <FaArrowRight aria-hidden="true" />
        </Link>
      </div>
      <div className="p-4">{children}</div>
    </article>
  )
}

function BenchmarkBars({
  items,
  compact = false,
  variant = 'normal',
  to = '/tools',
  search,
}: {
  items: Array<{ tool: ToolRecord; coverage: CoverageResult }>
  compact?: boolean
  variant?: 'normal' | 'wide'
  to?: string
  search?: Record<string, string>
}) {
  const maxRows = compact ? 8 : items.length
  const visibleItems = items.slice(0, maxRows)

  return (
    <div
      className="atlas-benchmark-bars"
      data-variant={variant}
      aria-label="Sorted benchmark scores"
    >
      {visibleItems.map(({ tool, coverage }, index) => (
        <BenchmarkBar
          key={tool.id}
          tool={tool}
          coverage={coverage}
          rank={index + 1}
          to={to}
          search={search}
        />
      ))}
    </div>
  )
}

function BenchmarkBar({
  tool,
  coverage,
  rank,
  to,
  search,
}: {
  tool: ToolRecord
  coverage: CoverageResult
  rank: number
  to: string
  search?: Record<string, string>
}) {
  const percentage = coverage.percentage ?? 0

  return (
    <Link
      to={to}
      search={search as never}
      className="atlas-benchmark-bar atlas-focus group outline-none"
      aria-label={`${tool.name}: ${Math.round(percentage)} percent score`}
      style={{ '--score': `${Math.max(0, Math.min(100, percentage))}%` } as CSSProperties}
    >
      <span className="atlas-benchmark-rank">{rank}</span>
      <span className="atlas-benchmark-name min-w-0 truncate font-medium text-[var(--atlas-ink)]">
        {tool.shortname}
      </span>
      <span className="atlas-benchmark-track" aria-hidden="true">
        <span className="atlas-benchmark-fill" />
      </span>
      <span className="atlas-benchmark-score justify-self-end font-semibold tabular-nums text-[var(--atlas-ink)]">
        {Math.round(percentage)}%
      </span>
    </Link>
  )
}
