import { Combobox } from '@base-ui/react/combobox'
import { Select } from '@base-ui/react/select'
import type { ReactNode } from 'react'
import {
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaMagnifyingGlass,
} from 'react-icons/fa6'
import { CUSTOM_USE_CASE_ID } from '../data/custom-use-case'
import type { TaxonomyCategory, ToolRecord, UseCaseRecord } from '../data/types'
import { Hint } from './ui'

export function TableToolbar({
  query,
  onQueryChange,
  toolId,
  onToolChange,
  tools,
  selectedUseCaseIds,
  onUseCaseChange,
  useCases,
  resultCount,
  toolMode = 'all',
}: {
  query: string
  onQueryChange: (query: string) => void
  toolId: string
  onToolChange: (toolId: string) => void
  tools: ToolRecord[]
  selectedUseCaseIds: Set<string>
  onUseCaseChange: (useCaseIds: string[]) => void
  useCases: UseCaseRecord[]
  resultCount?: number
  toolMode?: 'all' | 'optional-none'
}) {
  return (
    <section className="atlas-toolbar grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
      <label className="atlas-label grid gap-1 text-sm font-medium">
        <span className="flex items-center justify-between gap-2">
          <span>Search</span>
          {typeof resultCount === 'number' ? (
            <span className="atlas-caption text-xs font-normal">
              {resultCount} categories
            </span>
          ) : null}
        </span>
        <span className="relative block">
          <span className="sr-only">Search features</span>
          <FaMagnifyingGlass
            className="atlas-muted absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search feature names or keys"
            className="atlas-control h-10 w-full pl-9 pr-3 text-sm"
          />
        </span>
      </label>

      <ToolSelect
        toolId={toolId}
        onToolChange={onToolChange}
        tools={tools}
        toolMode={toolMode}
      />

      <UseCaseCombobox
        useCases={useCases}
        selectedUseCaseIds={selectedUseCaseIds}
        onUseCaseChange={onUseCaseChange}
      />
    </section>
  )
}

function ToolSelect({
  toolId,
  onToolChange,
  tools,
  toolMode,
}: {
  toolId: string
  onToolChange: (toolId: string) => void
  tools: ToolRecord[]
  toolMode: 'all' | 'optional-none'
}) {
  const items = [
    ...(toolMode === 'all'
      ? [{ value: '__all__', label: 'All tools' }]
      : [{ value: '', label: 'Requirements only' }]),
    ...tools.map((tool) => ({ value: tool.id, label: tool.name })),
  ]

  return (
    <Select.Root
      items={items}
      value={toolId}
      onValueChange={(value) => {
        if (typeof value === 'string') {
          onToolChange(value)
        }
      }}
      modal={false}
    >
      <div className="atlas-label grid gap-1 text-sm font-medium">
        <Select.Label>Tool</Select.Label>
        <Select.Trigger className="atlas-control flex h-10 min-w-0 items-center justify-between gap-3 px-3 text-left text-sm font-normal">
          <Select.Value className="min-w-0 flex-1 truncate" />
          <Select.Icon className="atlas-caption shrink-0">
            <FaChevronDown aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
      </div>
      <Select.Portal>
        <Select.Positioner sideOffset={6} className="z-50">
          <Select.Popup className="atlas-popup max-h-72 min-w-[var(--anchor-width)] max-w-[calc(100vw-2rem)] overflow-hidden outline-none lg:w-max">
            <Select.List className="max-h-72 overflow-y-auto py-1">
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  className="atlas-option grid cursor-default grid-cols-[1rem_minmax(0,max-content)] items-center gap-2 px-3 py-2 text-sm outline-none"
                >
                  <Select.ItemIndicator
                    keepMounted
                    className="invisible col-start-1 text-[var(--atlas-hydro)] data-[selected]:visible"
                  >
                    <FaCheck className="text-[10px]" aria-hidden="true" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="col-start-2 line-clamp-1">
                    {item.label}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

export function LegendActions({
  legend,
  allExpanded,
  onFoldAll,
  onUnfoldAll,
}: {
  legend: ReactNode
  allExpanded: boolean
  onFoldAll: () => void
  onUnfoldAll: () => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {legend ? legend : null}
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={allExpanded ? onFoldAll : onUnfoldAll}
          className="atlas-secondary-button atlas-focus inline-flex h-9 min-w-36 items-center justify-center gap-2 px-3 text-sm font-medium"
        >
          <FaChevronDown
            className={allExpanded ? '-rotate-90' : undefined}
            aria-hidden="true"
          />
          {allExpanded ? 'Fold all' : 'Unfold all'}
        </button>
      </div>
    </div>
  )
}

export function UseCaseCombobox({
  useCases,
  selectedUseCaseIds,
  onUseCaseChange,
}: {
  useCases: UseCaseRecord[]
  selectedUseCaseIds: Set<string>
  onUseCaseChange: (useCaseIds: string[]) => void
}) {
  const selectedUseCaseList = useCases.filter((useCase) =>
    selectedUseCaseIds.has(useCase.id),
  )
  const inputId = 'use-case-combobox'

  return (
    <Combobox.Root
      multiple
      items={useCases.map((useCase) => ({
        value: useCase.id,
        label: useCase.name,
        custom: useCase.id === CUSTOM_USE_CASE_ID,
      }))}
      value={[...selectedUseCaseIds]}
      onValueChange={(value) => onUseCaseChange(value)}
      modal={false}
    >
      <div className="atlas-label grid gap-1 text-sm font-medium">
        <label htmlFor={inputId}>Use cases</label>
        <Combobox.InputGroup className="atlas-control flex min-h-10 items-center gap-2 px-3 py-1.5 focus-within:border-[var(--atlas-hydro)] focus-within:shadow-[0_0_0_3px_rgb(13_118_111_/_0.14),inset_0_1px_1px_rgb(15_23_21_/_0.03)]">
          <FaMagnifyingGlass
            className="atlas-muted shrink-0"
            aria-hidden="true"
          />
          <Combobox.Input
            id={inputId}
            placeholder={
              selectedUseCaseList.length === 0
                ? 'Search use cases'
                : `${selectedUseCaseList.length} selected`
            }
            className="min-w-32 flex-1 border-0 bg-transparent text-sm text-[var(--atlas-ink)] outline-none placeholder:text-[var(--atlas-ink-muted)]"
          />
          <Combobox.Trigger className="atlas-focus inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--atlas-ink-muted)] outline-none hover:bg-[var(--atlas-hydro-wash)]">
            <Combobox.Icon>
              <FaChevronDown aria-hidden="true" />
            </Combobox.Icon>
          </Combobox.Trigger>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-50">
          <Combobox.Popup className="atlas-popup max-h-72 w-[min(var(--anchor-width),calc(100vw-2rem))] overflow-hidden outline-none">
            <Combobox.Empty className="atlas-caption px-3 py-2 text-sm">
              No use cases found.
            </Combobox.Empty>
            <Combobox.List className="max-h-72 overflow-y-auto py-1">
              {(item: { value: string; label: string; custom: boolean }, index: number) => (
                <Combobox.Item
                  key={item.value}
                  value={item.value}
                  index={index}
                  className="atlas-option group grid cursor-default grid-cols-[1rem_minmax(0,1fr)] items-start gap-2 px-3 py-2 text-sm outline-none"
                >
                  <span className="col-start-1 mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-[var(--atlas-line-strong)] text-white group-data-[selected]:border-[var(--atlas-hydro)] group-data-[selected]:bg-[var(--atlas-hydro)]">
                    <Combobox.ItemIndicator
                      keepMounted
                      className="invisible data-[selected]:visible"
                    >
                      <FaCheck className="text-[10px]" aria-hidden="true" />
                    </Combobox.ItemIndicator>
                  </span>
                  <span className="col-start-2 flex min-w-0 items-center gap-2">
                    <span className="min-w-0 truncate">{item.label}</span>
                    {item.custom ? <CustomOptionBadge /> : null}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

function CustomOptionBadge() {
  return (
    <span className="shrink-0 rounded border border-[rgb(13_118_111_/_0.24)] bg-[var(--atlas-hydro-wash)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--atlas-hydro-strong)]">
      Custom
    </span>
  )
}

export function CategoryRows<T extends { id: string }>({
  category,
  expanded,
  onToggle,
  columns,
  renderCategoryCell,
  renderFeatureCell,
}: {
  category: TaxonomyCategory
  expanded: boolean
  onToggle: () => void
  columns: T[]
  renderCategoryCell: (column: T) => ReactNode
  renderFeatureCell: (column: T, featureId: string) => ReactNode
}) {
  return (
    <>
      <tr className="atlas-category-row">
        <StickyCell>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="atlas-focus flex w-full items-center gap-2 text-left font-semibold text-[var(--atlas-ink)] outline-none"
          >
            {expanded ? (
              <FaChevronDown className="shrink-0" aria-hidden="true" />
            ) : (
              <FaChevronRight className="shrink-0" aria-hidden="true" />
            )}
            <Hint label={category.description}>{category.label}</Hint>
          </button>
        </StickyCell>
        {columns.map((column) => (
          <td
            key={column.id}
            className="atlas-cell-border px-3 py-2 text-center"
          >
            {renderCategoryCell(column)}
          </td>
        ))}
      </tr>
      {expanded
        ? category.members.map((feature) => (
            <tr key={feature.id} className="atlas-feature-row">
              <StickyCell>
                <span className="block pl-7 text-[var(--atlas-ink-soft)]">
                  <Hint label={feature.description}>{feature.label}</Hint>
                </span>
              </StickyCell>
              {columns.map((column) => (
                <td
                  key={column.id}
                  className="atlas-cell-border px-3 py-2 text-center"
                >
                  {renderFeatureCell(column, feature.id)}
                </td>
              ))}
            </tr>
          ))
        : null}
    </>
  )
}

export function StickyHead({ children }: { children: ReactNode }) {
  return (
    <th className="atlas-sticky-head sticky left-0 top-0 z-20 w-72 min-w-72 px-3 py-3 text-left font-semibold sm:w-80 sm:min-w-80">
      {children}
    </th>
  )
}

export function StickyCell({ children }: { children: ReactNode }) {
  return (
    <td className="atlas-sticky-cell sticky left-0 z-10 w-72 min-w-72 bg-inherit px-3 py-2 text-left sm:w-80 sm:min-w-80">
      {children}
    </td>
  )
}
