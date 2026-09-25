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
import { filterTaxonomy } from '../src/lib/dashboard-utils'

function feature(id: string, label: string) {
  return {
    id,
    key: id,
    categoryId: 'category',
    label,
    displayName: label,
    description: '',
    baseline: 'n' as const,
    pathIds: ['category', id],
    pathLabels: ['Category', label],
    depth: 2,
  }
}

const taxonomy: TaxonomyCategory[] = [
  {
    id: 'category',
    label: 'Category',
    description: '',
    members: [
      feature('sourced', 'Sourced'),
      feature('unsourced', 'Unsourced'),
      feature('dev', 'Dev'),
      feature('missing', 'Missing'),
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

    expect(data.taxonomyVersion).toBe('v0.3.0')
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

describe('taxonomy display order', () => {
  it('preserves source taxonomy order when filtering', () => {
    const orderedTaxonomy: TaxonomyCategory[] = [
      {
        id: 'z-category',
        label: 'Z Category',
        description: '',
        members: [
          feature('z-last', 'Z Last'),
          feature('a-first', 'A First'),
        ],
      },
      {
        id: 'a-category',
        label: 'A Category',
        description: '',
        members: [feature('a-feature', 'A Feature')],
      },
    ]

    const filtered = filterTaxonomy(orderedTaxonomy, 'category')

    expect(filtered.map((category) => category.id)).toEqual([
      'z-category',
      'a-category',
    ])
    expect(filtered[0]?.members.map((item) => item.id)).toEqual([
      'z-last',
      'a-first',
    ])
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
