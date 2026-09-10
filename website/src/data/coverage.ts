// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import type {
  CoverageOptions,
  CoverageResult,
  DashboardData,
  FeatureValue,
  TaxonomyCategory,
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
  return tool.features[categoryId]?.[featureId]
}

export function getUseCaseValue(
  useCase: UseCaseRecord,
  categoryId: string,
  featureId: string,
): FeatureValue {
  return useCase.features[categoryId]?.[featureId]?.value ?? 'n'
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
