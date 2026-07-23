import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const websiteRoot = path.resolve(scriptDir, '..')
const repoRoot = path.resolve(websiteRoot, '..')

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

function normalizeToolFeatures(raw) {
  const features = {}

  for (const [categoryId, members] of Object.entries(raw ?? {})) {
    features[categoryId] = {}
    for (const [featureId, feature] of Object.entries(members ?? {})) {
      features[categoryId][featureId] = {
        value: normalizeValue(feature?.value, '?'),
        sources: asList(feature?.source),
      }
    }
  }

  return features
}

function normalizeUseCaseFeatures(raw) {
  const features = {}

  for (const [categoryId, members] of Object.entries(raw ?? {})) {
    features[categoryId] = {}
    for (const [featureId, feature] of Object.entries(members ?? {})) {
      features[categoryId][featureId] = {
        value: normalizeValue(feature?.value, 'n'),
      }
    }
  }

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

function collectFeatureIds(records) {
  const categories = new Map()

  for (const record of records) {
    for (const [categoryId, members] of Object.entries(record.features)) {
      if (!categories.has(categoryId)) {
        categories.set(categoryId, new Set())
      }

      for (const featureId of Object.keys(members)) {
        categories.get(categoryId)?.add(featureId)
      }
    }
  }

  return categories
}

function buildTaxonomy(schema, tools, useCases) {
  const observed = collectFeatureIds([...tools, ...useCases])
  const orderedCategoryIds = [
    ...Object.keys(schema),
    ...[...observed.keys()].filter((categoryId) => !(categoryId in schema)).sort(),
  ]

  return orderedCategoryIds
    .map((categoryId) => {
      const schemaCategory = schema[categoryId] ?? {}
      const schemaMembers = schemaCategory.members ?? {}
      const observedMembers = observed.get(categoryId) ?? new Set()
      const memberIds = [
        ...Object.keys(schemaMembers),
        ...[...observedMembers].filter((featureId) => !(featureId in schemaMembers)).sort(),
      ]

      return {
        id: categoryId,
        label: formatLabel(categoryId),
        description: String(schemaCategory.description ?? ''),
        members: memberIds.map((featureId) => ({
          id: featureId,
          label: formatLabel(featureId),
          description: String(schemaMembers[featureId]?.description ?? ''),
          baseline: normalizeValue(schemaMembers[featureId]?.baseline, '?'),
        })),
      }
    })
    .filter((category) => category.members.length > 0)
}

async function main() {
  const [schema, tools, useCases] = await Promise.all([
    readYaml(path.join(repoRoot, 'schema', 'features.yaml')),
    loadTools(),
    loadUseCases(),
  ])

  const output = {
    generatedAt: new Date().toISOString(),
    taxonomy: buildTaxonomy(schema, tools, useCases),
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
