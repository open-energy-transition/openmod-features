import { createFileRoute, Link } from '@tanstack/react-router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { FaLink, FaPenToSquare, FaRegCopy } from 'react-icons/fa6'
import { useDashboardContext } from '../components/dashboard-layout'
import {
  CategoryRows,
  LegendActions,
  StickyCell,
  StickyHead,
  TableToolbar,
} from '../components/table'
import { ColumnHead, EmptyState, FeatureTable } from '../components/page-shell'
import { CoverageBadge, Hint, StatusLegend, ToolName } from '../components/ui'
import {
  RequirementCell,
  useCaseRequirementCount,
} from '../components/status-cells'
import {
  calculateCategoryUseCaseCoverage,
  calculateUseCaseCoverage,
  getToolFeature,
  getUseCaseValue,
} from '../data/coverage'
import {
  CUSTOM_USE_CASE_ID,
  CUSTOM_USE_CASE_PARAM,
  encodeCustomUseCase,
} from '../data/custom-use-case'
import {
  filterTaxonomy,
  sortTaxonomyAlphabetically,
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
  const selectedUseCases = data.useCases.filter((useCase) =>
    selectedUseCaseIds.has(useCase.id),
  )
  const filteredTaxonomy = sortTaxonomyAlphabetically(
    filterTaxonomy(data.taxonomy, query),
  )
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
              Comparing the shareable custom use case. Add built-in use cases from
              the filter when you need a side-by-side review.
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
      />
      {selectedUseCases.length === 0 ? (
        <EmptyState
          title="No use cases selected"
          detail="Select at least one use case to compare requirements."
        />
      ) : selectedTools.length === 0 ? (
        <EmptyState
          title="No tools selected"
          detail="Select at least one tool to compare use-case fit."
        />
      ) : filteredTaxonomy.length === 0 ? (
        <EmptyState
          title="No matching features"
          detail="Clear the search to show the full taxonomy."
        />
      ) : (
        <FeatureTable minWidth="980px">
          <thead>
            <tr>
              <StickyHead>Feature</StickyHead>
              {selectedUseCases.map((useCase) => (
                <ColumnHead key={useCase.id}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex max-w-full items-center gap-1">
                      <Hint label={useCase.description}>{useCase.name}</Hint>
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
            {selectedTools.map((tool) => (
              <Fragment key={tool.id}>
                <tr className="atlas-tool-section-row">
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
                    onToggle={() => toggleSetValue(expanded, setExpanded, category.id)}
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
                    renderFeatureCell={(useCase, featureId) => (
                      <RequirementCell
                        value={getUseCaseValue(useCase, category.id, featureId)}
                        toolFeature={getToolFeature(tool, category.id, featureId)}
                        options={coverageOptions}
                        hasTool
                      />
                    )}
                  />
                ))}
              </Fragment>
            ))}
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
