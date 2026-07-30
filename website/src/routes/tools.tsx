import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useDashboardContext } from '../components/dashboard-layout'
import {
  CategoryRows,
  LegendActions,
  StickyHead,
  TableToolbar,
} from '../components/table'
import { ColumnHead, EmptyState, FeatureTable } from '../components/page-shell'
import { CoverageBadge, StatusLegend, ToolName } from '../components/ui'
import { StatusCell } from '../components/status-cells'
import {
  calculateCategoryCoverage,
  calculateToolCoverage,
  getToolFeature,
} from '../data/coverage'
import {
  filterTaxonomy,
  filterTaxonomyByUseCases,
  sortTaxonomyAlphabetically,
  syncSelectedIds,
  toggleSetValue,
} from '../lib/dashboard-utils'

export const Route = createFileRoute('/tools')({
  component: ToolMatrixPage,
})

function ToolMatrixPage() {
  const { data, coverageOptions } = useDashboardContext()
  const [query, setQuery] = useState('')
  const [selectedToolIds, setSelectedToolIds] = useState(
    new Set(data.tools.map((tool) => tool.id)),
  )
  const [selectedUseCaseIds, setSelectedUseCaseIds] = useState(
    new Set(data.useCases.map((useCase) => useCase.id)),
  )
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSelectedToolIds((current) => syncSelectedIds(current, data.tools))
  }, [data.tools])

  useEffect(() => {
    setSelectedUseCaseIds((current) => syncSelectedIds(current, data.useCases))
  }, [data.useCases])

  const selectedTools = data.tools.filter((tool) => selectedToolIds.has(tool.id))
  const scopedTaxonomy = filterTaxonomyByUseCases(
    data.taxonomy,
    data.useCases,
    selectedUseCaseIds,
  )
  const filteredTaxonomy = sortTaxonomyAlphabetically(
    filterTaxonomy(scopedTaxonomy, query),
  )
  const allExpanded =
    filteredTaxonomy.length > 0 &&
    filteredTaxonomy.every((category) => expanded.has(category.id))

  return (
    <div className="grid gap-4">
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
      {filteredTaxonomy.length === 0 ? (
        <EmptyState
          title="No matching features"
          detail={
            selectedUseCaseIds.size === 0
              ? 'Select at least one use case to scope feature rows.'
              : 'Clear the search or adjust filters to show more features.'
          }
        />
      ) : selectedTools.length === 0 ? (
        <EmptyState
          title="No tools selected"
          detail="Select at least one tool to compare feature coverage."
        />
      ) : (
        <FeatureTable minWidth="1100px">
          <thead>
            <tr>
              <StickyHead>Feature</StickyHead>
              {selectedTools.map((tool) => (
                <ColumnHead key={tool.id}>
                  <ToolName tool={tool} compact />
                </ColumnHead>
              ))}
            </tr>
            <tr>
              <StickyHead>Overall</StickyHead>
              {selectedTools.map((tool) => (
                <td
                  key={tool.id}
                  className="atlas-cell-border px-3 py-2 text-center"
                >
                  <CoverageBadge
                    coverage={calculateToolCoverage(
                      scopedTaxonomy,
                      tool,
                      coverageOptions,
                    )}
                  />
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTaxonomy.map((category) => (
              <CategoryRows
                key={category.id}
                category={category}
                expanded={expanded.has(category.id)}
                onToggle={() => toggleSetValue(expanded, setExpanded, category.id)}
                columns={selectedTools}
                renderCategoryCell={(tool) => (
                  <CoverageBadge
                    coverage={calculateCategoryCoverage(
                      category,
                      tool,
                      coverageOptions,
                    )}
                  />
                )}
                renderFeatureCell={(tool, featureId) => (
                  <StatusCell
                    feature={getToolFeature(tool, category.id, featureId)}
                    options={coverageOptions}
                  />
                )}
              />
            ))}
          </tbody>
        </FeatureTable>
      )}
    </div>
  )
}
