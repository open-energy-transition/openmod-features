// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const websiteRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(websiteRoot, '..')
const taxonomyVersion = 'v0.3.0'

function formatLabel(value) {
  return value.replaceAll('__', ' > ').replaceAll('_', ' ')
}

function asList(value) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeValue(value, fallback) {
  return value === 'y' || value === 'n' || value === 'dev' || value === '?'
    ? value
    : fallback
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function readYaml(filePath) {
  return YAML.parse(await readFile(filePath, 'utf8'))
}

async function readDirectories(parent) {
  const entries = await readdir(parent, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

function makeFeatureKey(pathIds) {
  return pathIds.join('/')
}

function normalizeToolFeatures(raw) {
  const features = {}

  function visit(node, pathIds) {
    if (!isRecord(node)) {
      return
    }

    if ('value' in node) {
      const [categoryId] = pathIds
      if (!categoryId) {
        return
      }

      features[categoryId] ??= {}
      features[categoryId][makeFeatureKey(pathIds)] = {
        value: normalizeValue(node.value, '?'),
        sources: asList(node.source),
      }
      return
    }

    for (const [memberId, member] of Object.entries(node)) {
      visit(member, [...pathIds, memberId])
    }
  }

  visit(raw ?? {}, [])
  return features
}

function normalizeUseCaseFeatures(raw) {
  const features = {}

  function visit(node, pathIds) {
    if (!isRecord(node)) {
      return
    }

    if ('value' in node) {
      const [categoryId] = pathIds
      if (!categoryId) {
        return
      }

      features[categoryId] ??= {}
      features[categoryId][makeFeatureKey(pathIds)] = {
        value: normalizeValue(node.value, 'n'),
      }
      return
    }

    for (const [memberId, member] of Object.entries(node)) {
      visit(member, [...pathIds, memberId])
    }
  }

  visit(raw ?? {}, [])
  return features
}

async function loadTools() {
  const toolsRoot = path.join(repoRoot, 'tools')
  const toolIds = await readDirectories(toolsRoot)

  return Promise.all(
    toolIds.map(async (id) => {
      const dir = path.join(toolsRoot, id)
      const [metadata, data] = await Promise.all([
        readYaml(path.join(dir, '.metadata.yml')),
        readYaml(path.join(dir, 'features.yaml')),
      ])

      return {
        id,
        name: String(metadata.name ?? id),
        shortname: String(metadata.shortname ?? id),
        docs: metadata.docs ? String(metadata.docs) : undefined,
        source: metadata.source ? String(metadata.source) : undefined,
        version: data.version ? String(data.version) : undefined,
        maintainers: asList(metadata.maintainers),
        features: normalizeToolFeatures(data.features),
      }
    }),
  )
}

async function loadUseCases() {
  const useCasesRoot = path.join(repoRoot, 'use-cases')
  const useCaseIds = await readDirectories(useCasesRoot)

  return Promise.all(
    useCaseIds.map(async (id) => {
      const dir = path.join(useCasesRoot, id)
      const [metadata, data] = await Promise.all([
        readYaml(path.join(dir, '.metadata.yml')),
        readYaml(path.join(dir, 'features.yaml')),
      ])

      return {
        id,
        name: String(metadata.name ?? formatLabel(id)),
        shortname: String(metadata.shortname ?? id),
        description: String(metadata.description ?? ''),
        maintainers: asList(metadata.maintainers),
        assumptions: asList(data.assumptions),
        features: normalizeUseCaseFeatures(data.features),
      }
    }),
  )
}

function schemaDescription(node) {
  if (typeof node === 'string') {
    return node
  }

  if (isRecord(node)) {
    return String(node.description ?? '')
  }

  return ''
}

function schemaMembers(node) {
  return isRecord(node) && isRecord(node.members) ? node.members : null
}

function collectSchemaLeaves(node, pathIds, pathLabels, categoryId, leaves, groups) {
  const members = schemaMembers(node)

  if (!members) {
    leaves.push({
      id: makeFeatureKey(pathIds),
      key: makeFeatureKey(pathIds),
      categoryId,
      label: formatLabel(pathIds.at(-1) ?? ''),
      displayName: featureDisplayName(pathLabels),
      description: schemaDescription(node),
      baseline: '?',
      pathIds,
      pathLabels,
      depth: pathIds.length,
    })
    return
  }

  if (pathIds.length > 1) {
    const groupKey = makeFeatureKey(pathIds)
    const descendantKeys = []
    groups.push({
      id: groupKey,
      key: groupKey,
      label: formatLabel(pathIds.at(-1) ?? ''),
      displayName: groupDisplayName(pathLabels),
      description: schemaDescription(node),
      pathIds,
      pathLabels,
      depth: pathIds.length,
      memberIds: descendantKeys,
    })

    const before = leaves.length
    for (const [memberId, member] of Object.entries(members)) {
      collectSchemaLeaves(
        member,
        [...pathIds, memberId],
        [...pathLabels, formatLabel(memberId)],
        categoryId,
        leaves,
        groups,
      )
    }
    descendantKeys.push(...leaves.slice(before).map((feature) => feature.id))
    return
  }

  for (const [memberId, member] of Object.entries(members)) {
    collectSchemaLeaves(
      member,
      [...pathIds, memberId],
      [...pathLabels, formatLabel(memberId)],
      categoryId,
      leaves,
      groups,
    )
  }
}

function featureDisplayName(pathLabels) {
  if (pathLabels.length <= 3) {
    return pathLabels.at(-1) ?? ''
  }

  return pathLabels.slice(2).join(' > ')
}

function groupDisplayName(pathLabels) {
  if (pathLabels.length <= 2) {
    return pathLabels.at(-1) ?? ''
  }

  return pathLabels.slice(1).join(' > ')
}

function buildTaxonomy(schema) {
  return Object.entries(schema ?? {})
    .map(([categoryId, categoryNode]) => {
      const members = []
      const groups = []
      collectSchemaLeaves(
        categoryNode,
        [categoryId],
        [formatLabel(categoryId)],
        categoryId,
        members,
        groups,
      )

      return {
        id: categoryId,
        label: formatLabel(categoryId),
        description: schemaDescription(categoryNode),
        members,
        groups: groups.filter((group) => group.depth <= 2),
      }
    })
    .filter((category) => category.members.length > 0)
}

async function main() {
  const [schema, tools, useCases] = await Promise.all([
    readYaml(path.join(repoRoot, 'features.yaml')),
    loadTools(),
    loadUseCases(),
  ])

  const output = {
    generatedAt: new Date().toISOString(),
    taxonomyVersion,
    taxonomy: buildTaxonomy(schema),
    tools,
    useCases,
  }

  const outputDir = path.join(websiteRoot, 'public', 'data')
  await mkdir(outputDir, { recursive: true })
  await writeFile(
    path.join(outputDir, 'features.json'),
    `${JSON.stringify(output, null, 2)}\n`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
