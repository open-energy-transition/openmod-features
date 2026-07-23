import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useDashboardContext } from '../components/dashboard-layout'
import {
  CategoryRows,
  LegendActions,
  StickyHead,
  TableToolbar,
} from '../components/table'
import { ColumnHead, EmptyState, FeatureTable } from '../components/page-shell'
import { CoverageBadge, Hint, StatusLegend } from '../components/ui'
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
  filterTaxonomy,
  sortTaxonomyAlphabetically,
  toggleSetValue,
} from '../lib/dashboard-utils'

export const Route = createFileRoute('/use-cases')({
  component: UseCaseFitPage,
})

function UseCaseFitPage() {
  const { data, coverageOptions } = useDashboardContext()
  const [query, setQuery] = useState('')
  const [toolId, setToolId] = useState(data.tools[0]?.id ?? '')
  const [selectedUseCaseIds, setSelectedUseCaseIds] = useState(
    new Set(data.useCases.map((useCase) => useCase.id)),
  )
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const selectedTool = data.tools.find((tool) => tool.id === toolId)
  const selectedUseCases = data.useCases.filter((useCase) =>
    selectedUseCaseIds.has(useCase.id),
  )
  const filteredTaxonomy = sortTaxonomyAlphabetically(
    filterTaxonomy(data.taxonomy, query),
  )
  const allExpanded =
    filteredTaxonomy.length > 0 &&
    filteredTaxonomy.every((category) => expanded.has(category.id))

  return (
    <div className="grid gap-4">
      <TableToolbar
        query={query}
        onQueryChange={setQuery}
        toolId={toolId}
        onToolChange={setToolId}
        tools={data.tools}
        selectedUseCaseIds={selectedUseCaseIds}
        onUseCaseChange={(ids) => setSelectedUseCaseIds(new Set(ids))}
        useCases={data.useCases}
        resultCount={filteredTaxonomy.length}
        toolMode="optional-none"
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
                  <Hint label={useCase.description}>{useCase.name}</Hint>
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {useCaseRequirementCount(useCase)} required
                  </span>
                </ColumnHead>
              ))}
            </tr>
            <tr>
              <StickyHead>Overall</StickyHead>
              {selectedUseCases.map((useCase) => (
                <td key={useCase.id} className="border-b border-slate-200 px-3 py-2">
                  {selectedTool ? (
                    <CoverageBadge
                      coverage={calculateUseCaseCoverage(
                        data.taxonomy,
                        selectedTool,
                        useCase,
                        coverageOptions,
                      )}
                    />
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
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
                columns={selectedUseCases}
                renderCategoryCell={(useCase) =>
                  selectedTool ? (
                    <CoverageBadge
                      coverage={calculateCategoryUseCaseCoverage(
                        category,
                        selectedTool,
                        useCase,
                        coverageOptions,
                      )}
                    />
                  ) : (
                    <span className="text-slate-400">-</span>
                  )
                }
                renderFeatureCell={(useCase, featureId) => (
                  <RequirementCell
                    value={getUseCaseValue(useCase, category.id, featureId)}
                    toolFeature={
                      selectedTool
                        ? getToolFeature(selectedTool, category.id, featureId)
                        : undefined
                    }
                    options={coverageOptions}
                    hasTool={Boolean(selectedTool)}
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
