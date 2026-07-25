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
    <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)]">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        <span className="flex items-center justify-between gap-2">
          <span>Search</span>
          {typeof resultCount === 'number' ? (
            <span className="text-xs font-normal text-slate-500">
              {resultCount} categories
            </span>
          ) : null}
        </span>
        <span className="relative block">
          <span className="sr-only">Search features</span>
          <FaMagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search feature names or keys"
            className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
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
      <div className="grid gap-1 text-sm font-medium text-slate-700">
        <Select.Label>Tool</Select.Label>
        <Select.Trigger className="flex h-10 min-w-0 items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 text-left text-sm font-normal text-slate-800 outline-none hover:bg-slate-50 focus-visible:border-teal-700 focus-visible:ring-2 focus-visible:ring-teal-100 data-[popup-open]:border-teal-700 data-[popup-open]:ring-2 data-[popup-open]:ring-teal-100">
          <Select.Value className="min-w-0 flex-1 truncate" />
          <Select.Icon className="shrink-0 text-slate-500">
            <FaChevronDown aria-hidden="true" />
          </Select.Icon>
        </Select.Trigger>
      </div>
      <Select.Portal>
        <Select.Positioner sideOffset={6} className="z-50">
          <Select.Popup className="max-h-72 min-w-[var(--anchor-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg outline-none lg:w-max">
            <Select.List className="max-h-72 overflow-y-auto py-1">
              {items.map((item) => (
                <Select.Item
                  key={item.value}
                  value={item.value}
                  className="grid cursor-default grid-cols-[1rem_minmax(0,max-content)] items-center gap-2 px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-teal-50 data-[selected]:font-medium"
                >
                  <Select.ItemIndicator
                    keepMounted
                    className="invisible col-start-1 text-teal-700 data-[selected]:visible"
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
          className="inline-flex h-9 min-w-36 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
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
      <div className="grid gap-1 text-sm font-medium text-slate-700">
        <label htmlFor={inputId}>Use cases</label>
        <Combobox.InputGroup className="flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-100">
          <FaMagnifyingGlass
            className="shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <Combobox.Input
            id={inputId}
            placeholder={
              selectedUseCaseList.length === 0
                ? 'Search use cases'
                : `${selectedUseCaseList.length} selected`
            }
            className="min-w-32 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
          <Combobox.Trigger className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700">
            <Combobox.Icon>
              <FaChevronDown aria-hidden="true" />
            </Combobox.Icon>
          </Combobox.Trigger>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-50">
          <Combobox.Popup className="max-h-72 w-[min(var(--anchor-width),calc(100vw-2rem))] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg outline-none">
            <Combobox.Empty className="px-3 py-2 text-sm text-slate-500">
              No use cases found.
            </Combobox.Empty>
            <Combobox.List className="max-h-72 overflow-y-auto py-1">
              {(item: { value: string; label: string; custom: boolean }, index: number) => (
                <Combobox.Item
                  key={item.value}
                  value={item.value}
                  index={index}
                  className="group grid cursor-default grid-cols-[1rem_minmax(0,1fr)] items-start gap-2 px-3 py-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-teal-50 data-[selected]:font-medium"
                >
                  <span className="col-start-1 mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-slate-300 text-white group-data-[selected]:border-teal-700 group-data-[selected]:bg-teal-700">
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
    <span className="shrink-0 rounded border border-teal-300 bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-teal-800">
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
      <tr className="bg-slate-100">
        <StickyCell>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex w-full items-center gap-2 text-left font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
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
            className="border-b border-slate-200 px-3 py-2 text-center"
          >
            {renderCategoryCell(column)}
          </td>
        ))}
      </tr>
      {expanded
        ? category.members.map((feature) => (
            <tr key={feature.id} className="hover:bg-slate-50">
              <StickyCell>
                <span className="block pl-7 text-slate-700">
                  <Hint label={feature.description}>{feature.label}</Hint>
                </span>
              </StickyCell>
              {columns.map((column) => (
                <td
                  key={column.id}
                  className="border-b border-slate-100 px-3 py-2 text-center"
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
    <th className="sticky left-0 top-0 z-20 w-72 min-w-72 border-b border-r border-slate-200 bg-white px-3 py-3 text-left font-semibold sm:w-80 sm:min-w-80">
      {children}
    </th>
  )
}

export function StickyCell({ children }: { children: ReactNode }) {
  return (
    <td className="sticky left-0 z-10 w-72 min-w-72 border-b border-r border-slate-200 bg-inherit px-3 py-2 text-left sm:w-80 sm:min-w-80">
      {children}
    </td>
  )
}
