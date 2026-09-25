// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

export type FeatureValue = 'y' | 'n' | 'dev' | '?'

export type TaxonomyFeature = {
  id: string
  key: string
  categoryId: string
  label: string
  displayName: string
  description: string
  baseline: FeatureValue
  pathIds: string[]
  pathLabels: string[]
  depth: number
}

export type TaxonomyGroup = {
  id: string
  key: string
  label: string
  displayName: string
  description: string
  pathIds: string[]
  pathLabels: string[]
  depth: number
  memberIds: string[]
}

export type TaxonomyCategory = {
  id: string
  label: string
  description: string
  members: TaxonomyFeature[]
  groups?: TaxonomyGroup[]
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
  version?: string
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
