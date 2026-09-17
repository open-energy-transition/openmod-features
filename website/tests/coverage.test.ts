// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import {
  calculateToolCoverage,
  calculateUseCaseCoverage,
  isImplemented,
} from '../src/data/coverage'
import {
  createSelectionFromUseCaseYaml,
  decodeCustomUseCase,
  encodeCustomUseCase,
} from '../src/data/custom-use-case'
import type { DashboardData, TaxonomyCategory, ToolRecord, UseCaseRecord } from '../src/data/types'

const taxonomy: TaxonomyCategory[] = [
  {
    id: 'category',
    label: 'Category',
    description: '',
    members: [
      { id: 'sourced', label: 'Sourced', description: '', baseline: 'n' },
      { id: 'unsourced', label: 'Unsourced', description: '', baseline: 'n' },
      { id: 'dev', label: 'Dev', description: '', baseline: 'n' },
      { id: 'missing', label: 'Missing', description: '', baseline: 'n' },
    ],
  },
]

const tool: ToolRecord = {
  id: 'tool',
  name: 'Tool',
  shortname: 'tool',
  maintainers: [],
  features: {
    category: {
      sourced: { value: 'y', sources: ['https://example.com'] },
      unsourced: { value: 'y', sources: [] },
      dev: { value: 'dev', sources: [] },
      missing: { value: 'n', sources: [] },
    },
  },
}

const useCase: UseCaseRecord = {
  id: 'use-case',
  name: 'Use Case',
  shortname: 'use-case',
  description: '',
  maintainers: [],
  assumptions: [],
  features: {
    category: {
      sourced: { value: 'y' },
      unsourced: { value: 'y' },
      dev: { value: 'y' },
      missing: { value: 'n' },
    },
  },
}

describe('coverage calculations', () => {
  it('distinguishes sourced, unsourced, and in-development features', () => {
    expect(isImplemented(tool.features.category.sourced, {
      countUnsourced: false,
      countDev: false,
    })).toBe(true)
    expect(isImplemented(tool.features.category.unsourced, {
      countUnsourced: false,
      countDev: false,
    })).toBe(false)
    expect(isImplemented(tool.features.category.dev, {
      countUnsourced: true,
      countDev: true,
    })).toBe(true)
  })

  it('calculates whole-tool coverage from taxonomy rows', () => {
    expect(calculateToolCoverage(taxonomy, tool, {
      countUnsourced: true,
      countDev: false,
    })).toMatchObject({ met: 2, total: 4, percentage: 50 })
  })

  it('keeps whole-tool coverage independent from use-case-scoped rows', () => {
    const useCaseScopedTaxonomy = taxonomy.map((category) => ({
      ...category,
      members: category.members.filter(
        (feature) => useCase.features[category.id]?.[feature.id]?.value === 'y',
      ),
    }))

    expect(calculateToolCoverage(useCaseScopedTaxonomy, tool, {
      countUnsourced: true,
      countDev: false,
    })).toMatchObject({ met: 2, total: 3 })
    expect(calculateToolCoverage(taxonomy, tool, {
      countUnsourced: true,
      countDev: false,
    })).toMatchObject({ met: 2, total: 4, percentage: 50 })
  })

  it('calculates use-case coverage from required rows only', () => {
    expect(calculateUseCaseCoverage(taxonomy, tool, useCase, {
      countUnsourced: true,
      countDev: true,
    })).toMatchObject({ met: 3, total: 3, percentage: 100 })
  })
})

describe('generated dashboard data', () => {
  it('contains current repository tools and use cases', async () => {
    const data = (await import('../public/data/features.json')) as DashboardData

    expect(data.tools.map((item) => item.id).sort()).toEqual([
      'GenX',
      'OSeMOSYS',
      'calliope',
      'pypsa',
      'times',
    ])
    expect(data.useCases).toHaveLength(5)
    expect(data.taxonomy.reduce((total, category) => total + category.members.length, 0)).toBeGreaterThan(0)
  })
})

describe('custom use case URL payloads', () => {
  it('round-trips a compact custom use case payload', () => {
    const encoded = encodeCustomUseCase(useCase)
    const decoded = decodeCustomUseCase(encoded)

    expect(decoded).toMatchObject({
      id: 'custom-use-case',
      name: 'Use Case',
      features: {
        category: {
          sourced: { value: 'y' },
          unsourced: { value: 'y' },
          dev: { value: 'y' },
        },
      },
    })
    expect(decoded?.features.category).not.toHaveProperty('missing')
  })

  it('ignores empty or malformed custom use case payloads', () => {
    expect(decodeCustomUseCase(null)).toBeNull()
    expect(decodeCustomUseCase('not-valid-base64')).toBeNull()
  })

  it('imports selected features from YAML', async () => {
    await expect(createSelectionFromUseCaseYaml(`
features:
  category:
    sourced:
      value: y
    missing:
      value: n
    unknown:
      value: y
`, taxonomy)).resolves.toEqual(new Set(['category::sourced']))
  })
})
