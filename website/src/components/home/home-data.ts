// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { useMemo } from 'react'
import { useDashboardContext } from '../dashboard-layout'
import {
  calculateCategoryCoverage,
  calculateEvidenceRate,
  calculateStatusBreakdown,
  calculateToolCoverage,
  calculateUseCaseCoverage,
  countFeatures,
  createUnifiedUseCase,
} from '../../data/coverage'
import {
  CUSTOM_USE_CASE_ID,
  CUSTOM_USE_CASE_PARAM,
  encodeCustomUseCase,
} from '../../data/custom-use-case'
import type {
  CoverageOptions,
  CoverageResult,
  DashboardData,
  StatusBreakdown,
  TaxonomyCategory,
  ToolRecord,
  UseCaseRecord,
} from '../../data/types'
import { compareCoverage } from '../../lib/dashboard-utils'

export type ToolSummary = {
  tool: ToolRecord
  coverage: CoverageResult
  breakdown: StatusBreakdown
  evidence: CoverageResult
}

export type UseCaseSummary = {
  useCase: UseCaseRecord
  label: string
  search: Record<string, string>
  required: number
  scores: Map<string, CoverageResult>
}

export type CategorySummary = {
  category: TaxonomyCategory
  scores: Map<string, CoverageResult>
}

export type HomeData = {
  data: DashboardData
  options: CoverageOptions
  featureCount: number
  builtInUseCaseCount: number
  /** Tools ranked by coverage of the entire taxonomy; every chart without its own ranking uses this order. */
  tools: ToolSummary[]
  /** The unified default use case first, then built-in use cases, then any custom use case. */
  useCases: UseCaseSummary[]
  categories: CategorySummary[]
}

export function useHomeData(): HomeData {
  const { data, coverageOptions } = useDashboardContext()
  return useMemo(() => buildHomeData(data, coverageOptions), [data, coverageOptions])
}

function buildHomeData(data: DashboardData, options: CoverageOptions): HomeData {
  const builtIn = data.useCases.filter((useCase) => useCase.id !== CUSTOM_USE_CASE_ID)
  const custom = data.useCases.find((useCase) => useCase.id === CUSTOM_USE_CASE_ID)
  const unified = createUnifiedUseCase(builtIn)

  const tools = data.tools
    .map((tool) => ({
      tool,
      coverage: calculateToolCoverage(data.taxonomy, tool, options),
      breakdown: calculateStatusBreakdown(data.taxonomy, tool),
      evidence: calculateEvidenceRate(data.taxonomy, tool),
    }))
    .sort((left, right) => compareCoverage(right.coverage, left.coverage))

  const summarise = (
    useCase: UseCaseRecord,
    search: Record<string, string>,
    label = shortUseCaseLabel(useCase.name),
  ): UseCaseSummary => {
    const scores = new Map(
      data.tools.map((tool) => [
        tool.id,
        calculateUseCaseCoverage(data.taxonomy, tool, useCase, options),
      ]),
    )
    return {
      useCase,
      label,
      search,
      required: scores.values().next().value?.total ?? 0,
      scores,
    }
  }

  const useCases = [
    ...(unified ? [summarise(unified, { use_cases: 'default' }, 'All default')] : []),
    ...builtIn.map((useCase) => summarise(useCase, { use_cases: useCase.id })),
    ...(custom
      ? [
          summarise(
            custom,
            {
              use_cases: custom.id,
              [CUSTOM_USE_CASE_PARAM]: encodeCustomUseCase(custom),
            },
            'Custom',
          ),
        ]
      : []),
  ]

  const categories = data.taxonomy.map((category) => ({
    category,
    scores: new Map(
      data.tools.map((tool) => [tool.id, calculateCategoryCoverage(category, tool, options)]),
    ),
  }))

  return {
    data,
    options,
    featureCount: countFeatures(data),
    builtInUseCaseCount: builtIn.length,
    tools,
    useCases,
    categories,
  }
}

/** "Network Development Plan (NDP) / Transmission Planning Process (TPP)" -> "NDP / TPP". */
export function shortUseCaseLabel(name: string) {
  const acronyms = [...name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1])
  return acronyms.length > 0 ? acronyms.join(' / ') : name
}

export function formatPercent(coverage: CoverageResult | undefined) {
  return coverage?.percentage == null ? 'N/A' : `${Math.round(coverage.percentage)}%`
}

export function sentenceCase(text: string) {
  // Two-letter labels are acronyms (e.g. "io").
  return text.length <= 2 ? text.toUpperCase() : text.charAt(0).toUpperCase() + text.slice(1)
}

export function scoringNote(options: CoverageOptions) {
  const sourced = options.countUnsourced
    ? 'Implemented features count as met, with or without a source link'
    : 'Implemented features count as met only when they cite a source'
  return `${sourced}${options.countDev ? '; in-development features also count' : ''}. Change this under Scoring.`
}
