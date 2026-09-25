// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import type { FeatureValue, TaxonomyCategory, UseCaseRecord } from './types'

export const CUSTOM_USE_CASE_PARAM = 'custom_features'
export const CUSTOM_USE_CASE_ID = 'custom-use-case'

export function featureSelectionKey(categoryId: string, featureId: string) {
  return `${categoryId}::${featureId}`
}

export function splitFeatureSelectionKey(key: string) {
  const [categoryId, ...featureParts] = key.split('::')
  return {
    categoryId,
    featureId: featureParts.join('::'),
  }
}

export function createSelectionFromUseCase(useCase: UseCaseRecord) {
  const selected = new Set<string>()

  for (const [categoryId, features] of Object.entries(useCase.features)) {
    for (const [featureId, feature] of Object.entries(features)) {
      if (feature.value === 'y') {
        selected.add(featureSelectionKey(categoryId, featureId))
      }
    }
  }

  return selected
}

export function createCustomUseCase(
  name: string,
  taxonomy: TaxonomyCategory[],
  selectedFeatureKeys: Set<string>,
): UseCaseRecord {
  const features: UseCaseRecord['features'] = {}

  for (const category of taxonomy) {
    for (const feature of category.members) {
      if (!selectedFeatureKeys.has(featureSelectionKey(category.id, feature.id))) {
        continue
      }

      features[category.id] ??= {}
      features[category.id][feature.id] = { value: 'y' }
    }
  }

  const trimmedName = name.trim() || 'My Use Case'

  return {
    id: CUSTOM_USE_CASE_ID,
    name: trimmedName,
    shortname: trimmedName,
    description: `Custom use case: ${trimmedName}`,
    maintainers: [],
    assumptions: [],
    features,
  }
}

export function countSelectedFeatures(selectedFeatureKeys: Set<string>) {
  return selectedFeatureKeys.size
}

export function countSelectedCategories(selectedFeatureKeys: Set<string>) {
  return new Set(
    [...selectedFeatureKeys].map((key) => splitFeatureSelectionKey(key).categoryId),
  ).size
}

export function serializeUseCaseYaml(useCase: UseCaseRecord) {
  const lines = ['assumptions: []', 'features:']
  const tree: Record<string, unknown> = {}

  for (const features of Object.values(useCase.features)) {
    for (const featureId of Object.keys(features)) {
      assignNestedFeature(tree, featureId.split('/'), 'y')
    }
  }

  writeYamlObject(lines, tree, 1)
  return `${lines.join('\n')}\n`
}

export async function createSelectionFromUseCaseYaml(
  yamlText: string,
  taxonomy: TaxonomyCategory[],
) {
  const { parse } = await import('yaml')
  const parsed = parse(yamlText) as unknown
  if (!isRecord(parsed)) {
    return new Set<string>()
  }

  const features = isRecord(parsed.features) ? parsed.features : parsed
  const validFeatureKeys = new Set(
    taxonomy.flatMap((category) =>
      category.members.map((feature) => featureSelectionKey(category.id, feature.id)),
    ),
  )
  const selected = new Set<string>()

  collectSelectedYamlFeatures(features, [], validFeatureKeys, selected)

  return selected
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function formatYamlKey(key: string) {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key)
}

function assignNestedFeature(
  target: Record<string, unknown>,
  pathIds: string[],
  value: FeatureValue,
) {
  const [currentId, ...remainingIds] = pathIds
  if (!currentId) {
    return
  }

  if (remainingIds.length === 0) {
    target[currentId] = { value }
    return
  }

  if (!isRecord(target[currentId])) {
    target[currentId] = {}
  }

  assignNestedFeature(target[currentId] as Record<string, unknown>, remainingIds, value)
}

function writeYamlObject(lines: string[], value: unknown, depth: number) {
  if (!isRecord(value)) {
    return
  }

  const indent = '  '.repeat(depth)
  const childIndent = '  '.repeat(depth + 1)
  for (const [key, child] of Object.entries(value)) {
    if (isRecord(child) && 'value' in child) {
      lines.push(`${indent}${formatYamlKey(key)}:`)
      lines.push(`${childIndent}value: ${String(child.value)}`)
      continue
    }

    lines.push(`${indent}${formatYamlKey(key)}:`)
    writeYamlObject(lines, child, depth + 1)
  }
}

function collectSelectedYamlFeatures(
  node: unknown,
  pathIds: string[],
  validFeatureKeys: Set<string>,
  selected: Set<string>,
) {
  if (!isRecord(node)) {
    return
  }

  if ('value' in node) {
    if (node.value !== 'y') {
      return
    }

    const [categoryId] = pathIds
    const featureId = pathIds.join('/')
    const key = categoryId ? featureSelectionKey(categoryId, featureId) : ''
    if (validFeatureKeys.has(key)) {
      selected.add(key)
      return
    }

    const legacyFeatureId = pathIds.at(-1)
    const legacyKey =
      categoryId && legacyFeatureId
        ? featureSelectionKey(categoryId, legacyFeatureId)
        : ''
    if (validFeatureKeys.has(legacyKey)) {
      selected.add(legacyKey)
    }
    return
  }

  for (const [childId, child] of Object.entries(node)) {
    collectSelectedYamlFeatures(child, [...pathIds, childId], validFeatureKeys, selected)
  }
}

export function encodeCustomUseCase(useCase: UseCaseRecord) {
  const compact: Record<string, string[] | string> = {
    _name: useCase.name,
  }

  for (const [categoryId, features] of Object.entries(useCase.features)) {
    const selectedFeatureIds = Object.entries(features)
      .filter(([, feature]) => feature.value === 'y')
      .map(([featureId]) => featureId)

    if (selectedFeatureIds.length > 0) {
      compact[categoryId] = selectedFeatureIds
    }
  }

  return toBase64Url(JSON.stringify(compact))
}

export function decodeCustomUseCase(value: string | null) {
  if (!value) {
    return null
  }

  try {
    const compact = JSON.parse(fromBase64Url(value)) as Record<string, unknown>
    const name =
      typeof compact._name === 'string' && compact._name.trim()
        ? compact._name
        : 'My Use Case'
    const features: UseCaseRecord['features'] = {}

    for (const [categoryId, featureIds] of Object.entries(compact)) {
      if (categoryId === '_name' || !Array.isArray(featureIds)) {
        continue
      }

      for (const featureId of featureIds) {
        if (typeof featureId !== 'string') {
          continue
        }

        features[categoryId] ??= {}
        features[categoryId][featureId] = { value: 'y' }
      }
    }

    if (Object.keys(features).length === 0) {
      return null
    }

    return {
      id: CUSTOM_USE_CASE_ID,
      name,
      shortname: name,
      description: `Custom use case: ${name}`,
      maintainers: [],
      assumptions: [],
      features,
    }
  } catch {
    return null
  }
}

function toBase64Url(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  return decodeURIComponent(escape(atob(padded)))
}
