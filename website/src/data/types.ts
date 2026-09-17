// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

export type FeatureValue = 'y' | 'n' | 'dev' | '?'

export type TaxonomyFeature = {
  id: string
  label: string
  description: string
  baseline: FeatureValue
}

export type TaxonomyCategory = {
  id: string
  label: string
  description: string
  members: TaxonomyFeature[]
}

export type ToolFeature = {
  value: FeatureValue
  sources: string[]
}

export type ToolRecord = {
  id: string
  name: string
  shortname: string
  docs?: string
  source?: string
  maintainers: string[]
  features: Record<string, Record<string, ToolFeature>>
}

export type UseCaseRecord = {
  id: string
  name: string
  shortname: string
  description: string
  maintainers: string[]
  assumptions: string[]
  features: Record<string, Record<string, { value: FeatureValue }>>
}

export type DashboardData = {
  generatedAt: string
  taxonomy: TaxonomyCategory[]
  tools: ToolRecord[]
  useCases: UseCaseRecord[]
}

export type CoverageOptions = {
  countUnsourced: boolean
  countDev: boolean
}

export type CoverageResult = {
  met: number
  total: number
  percentage: number | null
}
