// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Drawer } from '@base-ui/react/drawer'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  FaCircleQuestion,
  FaLink,
  FaPenToSquare,
  FaRegCopy,
  FaXmark,
} from 'react-icons/fa6'
import { useDashboardContext } from '../components/dashboard-layout'
import {
  CategoryRows,
  LegendActions,
  StickyCell,
  StickyHead,
  TableToolbar,
} from '../components/table'
import { ColumnHead, EmptyState, FeatureTable } from '../components/page-shell'
import { CheckPill, CoverageBadge, Hint, StatusLegend, ToolName } from '../components/ui'
import {
  RequirementCell,
  useCaseRequirementCount,
} from '../components/status-cells'
import {
  calculateCategoryUseCaseCoverage,
  calculateGroupUseCaseCoverage,
  calculateUseCaseCoverage,
  getToolFeature,
  getUseCaseValue,
} from '../data/coverage'
import {
  CUSTOM_USE_CASE_ID,
  CUSTOM_USE_CASE_PARAM,
  encodeCustomUseCase,
} from '../data/custom-use-case'
import type { UseCaseRecord } from '../data/types'
import {
  filterTaxonomy,
  syncSelectedIds,
  toggleSetValue,
} from '../lib/dashboard-utils'

export const Route = createFileRoute('/use-cases')({
  component: UseCaseFitPage,
})

function UseCaseFitPage() {
  const { data, coverageOptions, customUseCase } = useDashboardContext()
  const [query, setQuery] = useState('')
  const [selectedToolIds, setSelectedToolIds] = useState(
    () => new Set(data.tools[0] ? [data.tools[0].id] : []),
  )
  const [copied, setCopied] = useState(false)
  const [selectedUseCaseIds, setSelectedUseCaseIds] = useState(
    () =>
      new Set(
        customUseCase
          ? [CUSTOM_USE_CASE_ID]
          : data.useCases.map((useCase) => useCase.id),
      ),
  )
  const [hideInactiveTools, setHideInactiveTools] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const customFeatures = useMemo(
    () => (customUseCase ? encodeCustomUseCase(customUseCase) : null),
    [customUseCase],
  )

  useEffect(() => {
    setSelectedToolIds((current) => syncSelectedToolIds(current, data.tools))
  }, [data.tools])

  useEffect(() => {
    setSelectedUseCaseIds((current) =>
      customUseCase
        ? new Set([CUSTOM_USE_CASE_ID])
        : syncSelectedIds(current, data.useCases),
    )
  }, [customUseCase, data.useCases])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  const selectedTools = data.tools.filter((tool) => selectedToolIds.has(tool.id))
  const inactiveTools = data.tools.filter((tool) => !selectedToolIds.has(tool.id))
  const displayedTools = hideInactiveTools
    ? selectedTools
    : [...selectedTools, ...inactiveTools]
  const selectedUseCases = data.useCases.filter((useCase) =>
    selectedUseCaseIds.has(useCase.id),
  )
  const filteredTaxonomy = filterTaxonomy(data.taxonomy, query)
  const allExpanded =
    filteredTaxonomy.length > 0 &&
    filteredTaxonomy.every((category) => expanded.has(category.id))

  const shareCustomUseCase = async () => {
    if (!customFeatures) {
      return
    }

    const url = new URL(window.location.href)
    url.pathname = '/use-cases'
    url.searchParams.set(CUSTOM_USE_CASE_PARAM, customFeatures)
    await navigator.clipboard.writeText(url.toString())
    setCopied(true)
  }

  return (
    <div className="grid gap-4">
      {customUseCase && customFeatures ? (
        <section className="atlas-tint-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--atlas-ink)]">
                {customUseCase.name}
              </h2>
              <CustomBadge />
            </div>
            <p className="mt-1 text-sm text-[var(--atlas-hydro-strong)]">
              Comparing a shareable custom benchmark. Add built-in use cases when
              you need a side-by-side workflow review.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              to="/builder"
              search={
                {
                  [CUSTOM_USE_CASE_PARAM]: customFeatures,
                } as never
              }
              className="atlas-secondary-button atlas-focus inline-flex h-9 items-center justify-center gap-2 px-3 text-sm font-medium"
            >
              <FaPenToSquare aria-hidden="true" />
              Edit
            </Link>
            <button
              type="button"
              onClick={() => void shareCustomUseCase()}
              className="atlas-primary-button atlas-focus inline-flex h-9 items-center justify-center gap-2 px-3 text-sm font-medium"
            >
              {copied ? (
                <FaLink aria-hidden="true" />
              ) : (
                <FaRegCopy aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Share URL'}
            </button>
          </div>
        </section>
      ) : null}
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        selectedToolIds={selectedToolIds}
        onToolChange={(ids) => setSelectedToolIds(new Set(ids))}
        tools={data.tools}
        selectedUseCaseIds={selectedUseCaseIds}
        onUseCaseChange={(ids) => setSelectedUseCaseIds(new Set(ids))}
        useCases={data.useCases}
        resultCount={filteredTaxonomy.length}
      />
      <LegendActions
        legend={<StatusLegend />}
        allExpanded={allExpanded}
        onUnfoldAll={() => setExpanded(new Set(filteredTaxonomy.map((c) => c.id)))}
        onFoldAll={() => setExpanded(new Set())}
        actions={
          <CheckPill
            checked={hideInactiveTools}
            onCheckedChange={setHideInactiveTools}
          >
            Hide inactive
          </CheckPill>
        }
      />
      {selectedUseCases.length === 0 ? (
        <EmptyState
          title="No use cases selected"
          detail="Select at least one workflow to compare tool fit."
        />
      ) : displayedTools.length === 0 ? (
        <EmptyState
          title="No tools selected"
          detail="Select at least one tool to rank against the selected workflows."
        />
      ) : filteredTaxonomy.length === 0 ? (
        <EmptyState
          title="No matching features"
          detail="Clear the search to show the feature rows behind each fit score."
        />
      ) : (
        <FeatureTable minWidth="980px">
          <thead>
            <tr>
              <StickyHead>Feature</StickyHead>
              {selectedUseCases.map((useCase) => (
                <ColumnHead key={useCase.id}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex max-w-full items-center justify-center gap-1">
                      <Hint label={useCase.description}>{useCase.name}</Hint>
                      <UseCaseAssumptionsDrawer useCase={useCase} />
                    </span>
                    {useCase.id === CUSTOM_USE_CASE_ID ? <CustomBadge /> : null}
                  </div>
                  <span className="atlas-caption mt-1 block text-xs font-normal">
                    {useCaseRequirementCount(useCase)} required
                  </span>
                </ColumnHead>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedTools.map((tool) => {
              const toolActive = selectedToolIds.has(tool.id)

              return (
                <Fragment key={tool.id}>
                  <tr
                    className={`atlas-tool-section-row ${toolActive ? '' : 'atlas-filter-muted'}`}
                  >
                    <StickyCell>
                      <ToolName tool={tool} />
                    </StickyCell>
                    {selectedUseCases.map((useCase) => (
                      <td
                        key={useCase.id}
                        className="atlas-cell-border px-3 py-2 text-center"
                      >
                        <CoverageBadge
                          coverage={calculateUseCaseCoverage(
                            data.taxonomy,
                            tool,
                            useCase,
                            coverageOptions,
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                  {filteredTaxonomy.map((category) => (
                    <CategoryRows
                      key={`${tool.id}-${category.id}`}
                      category={category}
                      expanded={expanded.has(category.id)}
                      onToggle={() =>
                        toggleSetValue(expanded, setExpanded, category.id)
                      }
                      columns={selectedUseCases}
                      renderCategoryCell={(useCase) => (
                        <CoverageBadge
                          coverage={calculateCategoryUseCaseCoverage(
                            category,
                            tool,
                            useCase,
                            coverageOptions,
                          )}
                        />
                      )}
                      renderGroupCell={(useCase, group) => (
                        <CoverageBadge
                          coverage={calculateGroupUseCaseCoverage(
                            group,
                            category,
                            tool,
                            useCase,
                            coverageOptions,
                          )}
                        />
                      )}
                      renderFeatureCell={(useCase, feature) => (
                        <RequirementCell
                          value={getUseCaseValue(useCase, category.id, feature.id)}
                          toolFeature={getToolFeature(tool, category.id, feature.id)}
                          options={coverageOptions}
                          hasTool
                          tool={tool}
                          category={category}
                          taxonomyFeature={feature}
                          useCase={useCase}
                        />
                      )}
                      muted={!toolActive}
                      isFeatureMuted={() => !toolActive}
                    />
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </FeatureTable>
      )}
    </div>
  )
}

function syncSelectedToolIds(current: Set<string>, tools: { id: string }[]) {
  const validIds = new Set(tools.map((tool) => tool.id))
  const next = new Set([...current].filter((id) => validIds.has(id)))

  if (next.size === 0 && tools[0]) {
    next.add(tools[0].id)
  }

  return next.size === current.size && [...next].every((id) => current.has(id))
    ? current
    : next
}

function CustomBadge() {
  return (
    <span className="inline-flex h-5 items-center rounded border border-[rgb(13_118_111_/_0.24)] bg-[var(--atlas-surface-raised)] px-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--atlas-hydro-strong)]">
      Custom
    </span>
  )
}

function UseCaseAssumptionsDrawer({
  useCase,
}: {
  useCase: UseCaseRecord
}) {
  const assumptionCount = useCase.assumptions.length

  return (
    <Drawer.Root modal={false}>
      <Drawer.Trigger
        aria-label={`View assumptions for ${useCase.name}`}
        className="atlas-usecase-info-trigger atlas-focus inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
      >
        <FaCircleQuestion aria-hidden="true" />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Viewport>
          <Drawer.Popup className="atlas-usecase-drawer">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--atlas-line-soft)] px-5 py-4">
              <div className="min-w-0">
                <p className="atlas-eyebrow">Use Case Assumptions</p>
                <Drawer.Title className="mt-1 text-lg font-semibold leading-6 text-[var(--atlas-ink)]">
                  {useCase.name}
                </Drawer.Title>
                {useCase.description ? (
                  <Drawer.Description className="atlas-copy mt-2 text-sm leading-6">
                    {useCase.description}
                  </Drawer.Description>
                ) : null}
              </div>
              <Drawer.Close
                aria-label="Close assumptions drawer"
                className="atlas-secondary-button atlas-focus inline-flex h-9 w-9 shrink-0 items-center justify-center"
              >
                <FaXmark aria-hidden="true" />
              </Drawer.Close>
            </div>

            <div
              className="atlas-drawer-scroll grid gap-4 overflow-y-auto px-5 py-4"
              onScroll={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
              onWheel={(event) => event.stopPropagation()}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="atlas-subtle-card px-3 py-2">
                  <p className="atlas-caption text-xs">Assumptions</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--atlas-ink)]">
                    {assumptionCount}
                  </p>
                </div>
                <div className="atlas-subtle-card px-3 py-2">
                  <p className="atlas-caption text-xs">Required Features</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--atlas-ink)]">
                    {useCaseRequirementCount(useCase)}
                  </p>
                </div>
              </div>

              {assumptionCount > 0 ? (
                <ol className="grid gap-2">
                  {useCase.assumptions.map((assumption, index) => (
                    <li
                      key={`${index}-${assumption}`}
                      className="atlas-assumption-item grid grid-cols-[1.75rem_1fr] gap-3 px-3 py-3 text-left"
                    >
                      <span className="atlas-assumption-index flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-[var(--atlas-ink-soft)]">
                        {assumption}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="atlas-subtle-card px-3 py-3 text-sm text-[var(--atlas-ink-muted)]">
                  No assumptions are recorded for this use case.
                </div>
              )}
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
