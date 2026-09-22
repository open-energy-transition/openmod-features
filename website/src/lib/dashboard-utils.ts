import type {
  CoverageResult,
  DashboardData,
  TaxonomyCategory,
  UseCaseRecord,
} from '../data/types'

export function filterTaxonomy(taxonomy: TaxonomyCategory[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return taxonomy
  }

  return taxonomy
    .map((category) => {
      const categoryMatches =
        category.label.toLowerCase().includes(normalized) ||
        category.id.toLowerCase().includes(normalized)
      const members = categoryMatches
        ? category.members
        : category.members.filter(
            (feature) =>
              feature.label.toLowerCase().includes(normalized) ||
              feature.id.toLowerCase().includes(normalized),
          )

      return { ...category, members }
    })
    .filter((category) => category.members.length > 0)
}

export function filterTaxonomyByUseCases(
  taxonomy: TaxonomyCategory[],
  useCases: UseCaseRecord[],
  selectedUseCaseIds: Set<string>,
) {
  if (selectedUseCaseIds.size === 0) {
    return []
  }

  const selectedUseCases = useCases.filter((useCase) =>
    selectedUseCaseIds.has(useCase.id),
  )

  return taxonomy
    .map((category) => {
      const members = category.members.filter((feature) =>
        selectedUseCases.some(
          (useCase) => useCase.features[category.id]?.[feature.id]?.value === 'y',
        ),
      )

      return { ...category, members }
    })
    .filter((category) => category.members.length > 0)
}

export function sortTaxonomyAlphabetically(taxonomy: TaxonomyCategory[]) {
  return [...taxonomy]
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((category) => ({
      ...category,
      members: [...category.members].sort((left, right) =>
        left.label.localeCompare(right.label),
      ),
    }))
}

export function coverageColor(percentage: number) {
  if (percentage < 50) {
    const ratio = percentage / 50
    return `rgb(255, ${Math.round(180 + 55 * ratio)}, ${Math.round(180 + 20 * ratio)})`
  }

  const ratio = (percentage - 50) / 50
  return `rgb(${Math.round(255 - 75 * ratio)}, ${Math.round(235 - 15 * ratio)}, ${Math.round(200 - 20 * ratio)})`
}

export function compareCoverage(left: CoverageResult, right: CoverageResult) {
  return (left.percentage ?? -1) - (right.percentage ?? -1)
}

export function calculateValidation(data: DashboardData) {
  let implemented = 0
  let sourced = 0

  for (const tool of data.tools) {
    for (const category of Object.values(tool.features)) {
      for (const feature of Object.values(category)) {
        if (feature.value === 'y' || feature.value === 'dev') {
          implemented += 1
          if (feature.sources.length > 0) {
            sourced += 1
          }
        }
      }
    }
  }

  return implemented > 0 ? (sourced / implemented) * 100 : 0
}

export function toggleSetValue<T>(
  current: Set<T>,
  update: (next: Set<T>) => void,
  value: T,
) {
  const next = new Set(current)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  update(next)
}

export function syncSelectedIds<T extends { id: string }>(
  current: Set<string>,
  records: T[],
) {
  const validIds = new Set(records.map((record) => record.id))
  const next = new Set([...current].filter((id) => validIds.has(id)))
  let changed = next.size !== current.size

  for (const record of records) {
    if (!next.has(record.id)) {
      next.add(record.id)
      changed = true
    }
  }

  return changed ? next : current
}
