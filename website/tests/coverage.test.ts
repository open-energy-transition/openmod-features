import { describe, expect, it } from 'vitest'
import {
  calculateToolCoverage,
  calculateUseCaseCoverage,
  isImplemented,
} from '../src/data/coverage'
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
