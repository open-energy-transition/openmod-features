// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import type {
  CoverageOptions,
  CoverageResult,
  DashboardData,
  FeatureValue,
  StatusBreakdown,
  TaxonomyCategory,
  TaxonomyFeature,
  TaxonomyGroup,
  ToolFeature,
  ToolRecord,
  UseCaseRecord,
} from './types'

export const defaultCoverageOptions: CoverageOptions = {
  countUnsourced: true,
  countDev: false,
}

export function isImplemented(feature: ToolFeature | undefined, options: CoverageOptions) {
  if (!feature) {
    return false
  }

  if (feature.value === 'y') {
    return feature.sources.length > 0 || options.countUnsourced
  }

  return feature.value === 'dev' && options.countDev
}

export function getToolFeature(
  tool: ToolRecord,
  categoryId: string,
  featureId: string,
): ToolFeature | undefined {
  return (
    tool.features[categoryId]?.[featureId] ??
    tool.features[categoryId]?.[featureId.split('/').at(-1) ?? featureId]
  )
}

export function getUseCaseValue(
  useCase: UseCaseRecord,
  categoryId: string,
  featureId: string,
): FeatureValue {
  return (
    useCase.features[categoryId]?.[featureId]?.value ??
    useCase.features[categoryId]?.[featureId.split('/').at(-1) ?? featureId]?.value ??
    'n'
  )
}

export function calculateToolCoverage(
  taxonomy: TaxonomyCategory[],
  tool: ToolRecord,
  options: CoverageOptions,
): CoverageResult {
  let met = 0
  let total = 0

  for (const category of taxonomy) {
    for (const feature of category.members) {
      total += 1
      if (isImplemented(getToolFeature(tool, category.id, feature.id), options)) {
        met += 1
      }
    }
  }

  return toCoverage(met, total)
}

export function calculateUseCaseCoverage(
  taxonomy: TaxonomyCategory[],
  tool: ToolRecord,
  useCase: UseCaseRecord,
  options: CoverageOptions,
): CoverageResult {
  let met = 0
  let total = 0

  for (const category of taxonomy) {
    for (const feature of category.members) {
      if (getUseCaseValue(useCase, category.id, feature.id) !== 'y') {
        continue
      }

      total += 1
      if (isImplemented(getToolFeature(tool, category.id, feature.id), options)) {
        met += 1
      }
    }
  }

  return toCoverage(met, total)
}

export function calculateCategoryCoverage(
  category: TaxonomyCategory,
  tool: ToolRecord,
  options: CoverageOptions,
): CoverageResult {
  let met = 0

  for (const feature of category.members) {
    if (isImplemented(getToolFeature(tool, category.id, feature.id), options)) {
      met += 1
    }
  }

  return toCoverage(met, category.members.length)
}

export function calculateFeatureSetCoverage(
  features: TaxonomyFeature[],
  tool: ToolRecord,
  options: CoverageOptions,
): CoverageResult {
  let met = 0

  for (const feature of features) {
    if (isImplemented(getToolFeature(tool, feature.categoryId, feature.id), options)) {
      met += 1
    }
  }

  return toCoverage(met, features.length)
}

export function calculateGroupCoverage(
  group: TaxonomyGroup,
  category: TaxonomyCategory,
  tool: ToolRecord,
  options: CoverageOptions,
): CoverageResult {
  const features = category.members.filter((feature) => group.memberIds.includes(feature.id))
  return calculateFeatureSetCoverage(features, tool, options)
}

export function calculateCategoryUseCaseCoverage(
  category: TaxonomyCategory,
  tool: ToolRecord,
  useCase: UseCaseRecord,
  options: CoverageOptions,
): CoverageResult {
  let met = 0
  let total = 0

  for (const feature of category.members) {
    if (getUseCaseValue(useCase, category.id, feature.id) !== 'y') {
      continue
    }

    total += 1
    if (isImplemented(getToolFeature(tool, category.id, feature.id), options)) {
      met += 1
    }
  }

  return toCoverage(met, total)
}

export function calculateFeatureSetUseCaseCoverage(
  features: TaxonomyFeature[],
  tool: ToolRecord,
  useCase: UseCaseRecord,
  options: CoverageOptions,
): CoverageResult {
  let met = 0
  let total = 0

  for (const feature of features) {
    if (getUseCaseValue(useCase, feature.categoryId, feature.id) !== 'y') {
      continue
    }

    total += 1
    if (isImplemented(getToolFeature(tool, feature.categoryId, feature.id), options)) {
      met += 1
    }
  }

  return toCoverage(met, total)
}

export function calculateGroupUseCaseCoverage(
  group: TaxonomyGroup,
  category: TaxonomyCategory,
  tool: ToolRecord,
  useCase: UseCaseRecord,
  options: CoverageOptions,
): CoverageResult {
  const features = category.members.filter((feature) => group.memberIds.includes(feature.id))
  return calculateFeatureSetUseCaseCoverage(features, tool, useCase, options)
}

/** Count every taxonomy feature of a tool by its raw status, ignoring coverage options. */
export function calculateStatusBreakdown(
  taxonomy: TaxonomyCategory[],
  tool: ToolRecord,
): StatusBreakdown {
  const breakdown: StatusBreakdown = {
    sourced: 0,
    unsourced: 0,
    dev: 0,
    missing: 0,
    unknown: 0,
    total: 0,
  }

  for (const category of taxonomy) {
    for (const feature of category.members) {
      breakdown.total += 1
      const value = getToolFeature(tool, category.id, feature.id)

      if (value?.value === 'y') {
        breakdown[value.sources.length > 0 ? 'sourced' : 'unsourced'] += 1
      } else if (value?.value === 'dev') {
        breakdown.dev += 1
      } else if (value?.value === 'n') {
        breakdown.missing += 1
      } else {
        breakdown.unknown += 1
      }
    }
  }

  return breakdown
}

/** Share of a tool's implemented features that cite at least one source. */
export function calculateEvidenceRate(
  taxonomy: TaxonomyCategory[],
  tool: ToolRecord,
): CoverageResult {
  const { sourced, unsourced } = calculateStatusBreakdown(taxonomy, tool)
  return toCoverage(sourced, sourced + unsourced)
}

export const UNIFIED_USE_CASE_ID = 'unified-default-use-cases'

/** A use case requiring every feature that any of the given use cases requires. */
export function createUnifiedUseCase(useCases: UseCaseRecord[]): UseCaseRecord | null {
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
    id: UNIFIED_USE_CASE_ID,
    name: 'All default use cases',
    shortname: 'All default',
    description: 'Combined required features from all built-in use cases.',
    maintainers: [],
    assumptions: [],
    features,
  }
}

export function countFeatures(data: DashboardData) {
  return data.taxonomy.reduce((total, category) => total + category.members.length, 0)
}

function toCoverage(met: number, total: number): CoverageResult {
  return {
    met,
    total,
    percentage: total > 0 ? (met / total) * 100 : null,
  }
}
