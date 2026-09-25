// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Drawer } from '@base-ui/react/drawer'
import {
  FaArrowUpRightFromSquare,
  FaCircleInfo,
  FaMinus,
  FaXmark,
} from 'react-icons/fa6'
import { getUseCaseValue, isImplemented } from '../data/coverage'
import type {
  CoverageOptions,
  FeatureValue,
  TaxonomyCategory,
  TaxonomyFeature,
  ToolFeature,
  ToolRecord,
  UseCaseRecord,
} from '../data/types'
import { StatusIcon } from './ui'

export function StatusCell({
  feature,
  options,
  tool,
  category,
  taxonomyFeature,
}: {
  feature: ToolFeature | undefined
  options: CoverageOptions
  tool: ToolRecord
  category: TaxonomyCategory
  taxonomyFeature: TaxonomyFeature
}) {
  const value = feature?.value ?? '?'
  const sourced = Boolean(feature?.sources.length)
  const implemented = isImplemented(feature, options)

  return (
    <EvidenceStatus
      value={value}
      sourced={sourced}
      muted={!implemented}
      sources={feature?.sources ?? []}
      tool={tool}
      category={category}
      taxonomyFeature={taxonomyFeature}
    />
  )
}

export function RequirementCell({
  value,
  toolFeature,
  options,
  hasTool,
  tool,
  category,
  taxonomyFeature,
  useCase,
}: {
  value: FeatureValue
  toolFeature: ToolFeature | undefined
  options: CoverageOptions
  hasTool: boolean
  tool: ToolRecord
  category: TaxonomyCategory
  taxonomyFeature: TaxonomyFeature
  useCase: UseCaseRecord
}) {
  if (value !== 'y') {
    return (
      <span className="atlas-muted inline-flex items-center justify-center">
        <FaMinus aria-hidden="true" />
        <span className="sr-only">Not required</span>
      </span>
    )
  }

  if (!hasTool) {
    return <StatusIcon value="y" sourced />
  }

  return (
    <EvidenceStatus
      value={toolFeature?.value ?? 'n'}
      sourced={Boolean(toolFeature?.sources.length)}
      muted={!isImplemented(toolFeature, options)}
      sources={toolFeature?.sources ?? []}
      tool={tool}
      category={category}
      taxonomyFeature={taxonomyFeature}
      useCase={useCase}
    />
  )
}

function EvidenceStatus({
  value,
  sourced,
  muted,
  sources,
  tool,
  category,
  taxonomyFeature,
  useCase,
}: {
  value: FeatureValue
  sourced: boolean
  muted: boolean
  sources: string[]
  tool: ToolRecord
  category: TaxonomyCategory
  taxonomyFeature: TaxonomyFeature
  useCase?: UseCaseRecord
}) {
  if (sources.length === 0) {
    return <StatusIcon value={value} sourced={sourced} muted={muted} />
  }

  return (
    <Drawer.Root modal={false}>
      <Drawer.Trigger
        aria-label={`View validation evidence for ${tool.shortname} ${taxonomyFeature.displayName}`}
        className="atlas-evidence-trigger atlas-focus inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-[6px] outline-none"
      >
        <StatusIcon value={value} sourced={sourced} muted={muted} />
        <span className="atlas-evidence-dot" aria-hidden="true" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Viewport>
          <Drawer.Popup className="atlas-evidence-drawer">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--atlas-line-soft)] px-5 py-4">
              <div className="min-w-0">
                <p className="atlas-eyebrow">Validation Evidence</p>
                <Drawer.Title className="mt-1 text-lg font-semibold leading-6 text-[var(--atlas-ink)]">
                  {taxonomyFeature.displayName}
                </Drawer.Title>
                <Drawer.Description className="atlas-copy mt-2 text-sm leading-6">
                  {tool.name}
                  {useCase ? ` / ${useCase.name}` : null}
                </Drawer.Description>
              </div>
              <Drawer.Close
                aria-label="Close validation evidence drawer"
                className="atlas-secondary-button atlas-focus inline-flex h-9 w-9 shrink-0 items-center justify-center"
              >
                <FaXmark aria-hidden="true" />
              </Drawer.Close>
            </div>

            <div className="grid gap-4 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="atlas-subtle-card px-3 py-2">
                  <p className="atlas-caption text-xs">Category</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--atlas-ink)]">
                    {taxonomyFeature.pathLabels.slice(0, -1).join(' / ') || category.label}
                  </p>
                </div>
                <div className="atlas-subtle-card px-3 py-2">
                  <p className="atlas-caption text-xs">Status</p>
                  <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[var(--atlas-ink)]">
                    <StatusIcon value={value} sourced={sourced} muted={muted} />
                    {statusText(value, sourced)}
                  </p>
                </div>
              </div>

              <div className="atlas-subtle-card px-3 py-3">
                <p className="atlas-caption text-xs">Feature Description</p>
                <p className="mt-1 text-sm leading-6 text-[var(--atlas-ink-soft)]">
                  {taxonomyFeature.description}
                </p>
              </div>

              <section className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--atlas-ink)]">
                    Validation links
                  </h3>
                  <span className="atlas-caption text-xs tabular-nums">
                    {sources.length} {sources.length === 1 ? 'source' : 'sources'}
                  </span>
                </div>
                <ol className="grid gap-2">
                  {sources.map((source, index) => {
                    const reference = formatReference(source)

                    return (
                      <li key={`${index}-${source}`}>
                        <a
                          href={source}
                          target="_blank"
                          rel="noreferrer"
                          className="atlas-evidence-link atlas-focus grid gap-1 px-3 py-3 text-left outline-none"
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0 truncate text-sm font-semibold text-[var(--atlas-ink)]">
                              {reference.label}
                            </span>
                            <FaArrowUpRightFromSquare
                              className="mt-1 shrink-0 text-xs text-[var(--atlas-hydro)]"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="break-all text-xs leading-5 text-[var(--atlas-ink-muted)]">
                            {source}
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ol>
              </section>

              {tool.docs || tool.source ? (
                <section className="grid gap-2">
                  <h3 className="text-sm font-semibold text-[var(--atlas-ink)]">
                    Tool references
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tool.docs ? (
                      <ToolReference href={tool.docs} label="Docs" />
                    ) : null}
                    {tool.source ? (
                      <ToolReference href={tool.source} label="Source" />
                    ) : null}
                  </div>
                </section>
              ) : null}
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function ToolReference({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="atlas-secondary-button atlas-focus inline-flex h-9 items-center gap-2 px-3 text-sm font-medium outline-none"
    >
      <FaCircleInfo aria-hidden="true" />
      {label}
      <FaArrowUpRightFromSquare className="text-[10px]" aria-hidden="true" />
    </a>
  )
}

function statusText(value: FeatureValue, sourced: boolean) {
  if (value === 'y') {
    return sourced ? 'Implemented with source' : 'Implemented, unvalidated'
  }
  if (value === 'dev') {
    return 'In development'
  }
  if (value === 'n') {
    return 'Missing'
  }
  return 'Unknown'
}

function formatReference(source: string) {
  try {
    const url = new URL(source)
    const path = url.pathname.replace(/\/$/, '')
    const leaf = path.split('/').filter(Boolean).at(-1)
    return {
      label: leaf ? `${url.hostname} / ${decodeURIComponent(leaf)}` : url.hostname,
    }
  } catch {
    return { label: source }
  }
}

export function useCaseRequirementCount(useCase: UseCaseRecord) {
  let required = 0
  for (const category of Object.values(useCase.features)) {
    for (const feature of Object.values(category)) {
      if (feature.value === 'y') {
        required += 1
      }
    }
  }
  return required
}

export function getToolRequirementFeature(
  tool: ToolRecord | undefined,
  useCase: UseCaseRecord,
  categoryId: string,
  featureId: string,
) {
  const required = getUseCaseValue(useCase, categoryId, featureId) === 'y'
  if (!required || !tool) {
    return undefined
  }
  return tool.features[categoryId]?.[featureId]
}
