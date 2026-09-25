// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { Combobox } from '@base-ui/react/combobox'
import {
  Fragment,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import {
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaMagnifyingGlass,
} from 'react-icons/fa6'
import { CUSTOM_USE_CASE_ID } from '../data/custom-use-case'
import type {
  TaxonomyCategory,
  TaxonomyFeature,
  TaxonomyGroup,
  ToolRecord,
  UseCaseRecord,
} from '../data/types'
import { Hint } from './ui'
import { useFeatureTableContext } from './page-shell'

export function TableToolbar({
  query,
  onQueryChange,
  selectedToolIds,
  onToolChange,
  tools,
  selectedUseCaseIds,
  onUseCaseChange,
  useCases,
  resultCount,
}: {
  query: string
  onQueryChange: (query: string) => void
  selectedToolIds: Set<string>
  onToolChange: (toolIds: string[]) => void
  tools: ToolRecord[]
  selectedUseCaseIds: Set<string>
  onUseCaseChange: (useCaseIds: string[]) => void
  useCases: UseCaseRecord[]
  resultCount?: number
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

      <ToolCombobox
        selectedToolIds={selectedToolIds}
        onToolChange={onToolChange}
        tools={tools}
      />

      <UseCaseCombobox
        useCases={useCases}
        selectedUseCaseIds={selectedUseCaseIds}
        onUseCaseChange={onUseCaseChange}
      />
    </section>
  )
}

function ToolCombobox({
  selectedToolIds,
  onToolChange,
  tools,
}: {
  selectedToolIds: Set<string>
  onToolChange: (toolIds: string[]) => void
  tools: ToolRecord[]
}) {
  const selectedToolList = tools.filter((tool) => selectedToolIds.has(tool.id))
  const inputId = 'tool-combobox'

  return (
    <Combobox.Root
      multiple
      items={tools.map((tool) => ({
        value: tool.id,
        label: tool.name,
      }))}
      value={[...selectedToolIds]}
      onValueChange={(value) => onToolChange(value)}
      modal={false}
    >
      <div className="atlas-label grid gap-1 text-sm font-medium">
        <label htmlFor={inputId}>Tools</label>
        <Combobox.InputGroup className="atlas-control flex min-h-10 items-center gap-2 px-3 py-1.5 focus-within:border-[var(--atlas-hydro)] focus-within:shadow-[0_0_0_3px_rgb(13_118_111_/_0.14),inset_0_1px_1px_rgb(15_23_21_/_0.03)]">
          <FaMagnifyingGlass
            className="atlas-muted shrink-0"
            aria-hidden="true"
          />
          <Combobox.Input
            id={inputId}
            placeholder={
              selectedToolList.length === 0
                ? 'Search tools'
                : selectedToolList.length === tools.length
                  ? 'All tools selected'
                  : `${selectedToolList.length} selected`
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
              No tools found.
            </Combobox.Empty>
            <Combobox.List className="max-h-72 overflow-y-auto py-1">
              {(item: { value: string; label: string }, index: number) => (
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
                  <span className="col-start-2 min-w-0 truncate">{item.label}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

export function LegendActions({
  legend,
  allExpanded,
  onFoldAll,
  onUnfoldAll,
  actions,
}: {
  legend: ReactNode
  allExpanded: boolean
  onFoldAll: () => void
  onUnfoldAll: () => void
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {legend ? legend : null}
      <div className="flex shrink-0 flex-wrap gap-2">
        {actions}
        <button
          type="button"
          onClick={allExpanded ? onFoldAll : onUnfoldAll}
          className="atlas-fold-button atlas-focus inline-flex h-9 min-w-36 items-center justify-center gap-2 px-3 text-sm font-medium"
        >
          <span
            className="atlas-fold-icon"
            data-expanded={allExpanded ? 'true' : 'false'}
            aria-hidden="true"
          >
            <FaChevronDown />
          </span>
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
  renderGroupCell,
  renderFeatureCell,
  muted = false,
  isFeatureMuted = () => false,
}: {
  category: TaxonomyCategory
  expanded: boolean
  onToggle: () => void
  columns: T[]
  renderCategoryCell: (column: T) => ReactNode
  renderGroupCell?: (column: T, group: TaxonomyGroup) => ReactNode
  renderFeatureCell: (column: T, feature: TaxonomyFeature) => ReactNode
  muted?: boolean
  isFeatureMuted?: (featureId: string) => boolean
}) {
  const groupedFeatureIds = new Set(
    category.groups?.flatMap((group) => group.memberIds) ?? [],
  )
  const directFeatures = category.members.filter(
    (feature) => !groupedFeatureIds.has(feature.id),
  )

  return (
    <>
      <tr className={`atlas-category-row ${muted ? 'atlas-filter-muted' : ''}`}>
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
      {expanded ? (
        <>
          {category.groups?.map((group) => {
            const groupFeatures = category.members.filter((feature) =>
              group.memberIds.includes(feature.id),
            )

            return (
              <Fragment key={group.id}>
                <tr className="atlas-group-row">
                  <StickyCell>
                    <span className="block pl-7 text-sm font-semibold text-[var(--atlas-ink)]">
                      <Hint label={group.description}>{group.displayName}</Hint>
                    </span>
                  </StickyCell>
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className="atlas-cell-border px-3 py-2 text-center"
                    >
                      {renderGroupCell ? renderGroupCell(column, group) : null}
                    </td>
                  ))}
                </tr>
                {groupFeatures.map((feature) => (
                  <FeatureRow
                    key={feature.id}
                    feature={feature}
                    columns={columns}
                    renderFeatureCell={renderFeatureCell}
                    muted={isFeatureMuted(feature.id)}
                    indentClassName="pl-10"
                  />
                ))}
              </Fragment>
            )
          })}
          {directFeatures.map((feature) => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              columns={columns}
              renderFeatureCell={renderFeatureCell}
              muted={isFeatureMuted(feature.id)}
              indentClassName="pl-7"
            />
          ))}
        </>
      ) : null}
    </>
  )
}

function FeatureRow<T extends { id: string }>({
  feature,
  columns,
  renderFeatureCell,
  muted,
  indentClassName,
}: {
  feature: TaxonomyFeature
  columns: T[]
  renderFeatureCell: (column: T, feature: TaxonomyFeature) => ReactNode
  muted: boolean
  indentClassName: string
}) {
  return (
    <tr className={`atlas-feature-row ${muted ? 'atlas-filter-muted' : ''}`}>
      <StickyCell>
        <span className={`block ${indentClassName} text-[var(--atlas-ink-soft)]`}>
          <Hint label={feature.description}>{feature.displayName}</Hint>
        </span>
      </StickyCell>
      {columns.map((column) => (
        <td
          key={column.id}
          className="atlas-cell-border px-3 py-2 text-center"
        >
          {renderFeatureCell(column, feature)}
        </td>
      ))}
    </tr>
  )
}

export function StickyHead({ children }: { children: ReactNode }) {
  const context = useFeatureTableContext()
  const cellRef = useRef<HTMLTableCellElement>(null)

  function resizeTo(width: number) {
    if (!context) {
      return
    }

    const nextWidth = Math.min(
      context.maxFeatureColumnWidth,
      Math.max(context.minFeatureColumnWidth, Math.round(width)),
    )
    context.setFeatureColumnWidth(nextWidth)
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!context || !cellRef.current) {
      return
    }

    event.preventDefault()
    const handle = event.currentTarget
    handle.setPointerCapture(event.pointerId)

    const startX = event.clientX
    const startWidth = cellRef.current.getBoundingClientRect().width

    function handlePointerMove(moveEvent: globalThis.PointerEvent) {
      resizeTo(startWidth + moveEvent.clientX - startX)
    }

    function handlePointerUp(upEvent: globalThis.PointerEvent) {
      if (handle.hasPointerCapture(upEvent.pointerId)) {
        handle.releasePointerCapture(upEvent.pointerId)
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!context || !cellRef.current) {
      return
    }

    const currentWidth =
      context.featureColumnWidth ?? cellRef.current.getBoundingClientRect().width

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      resizeTo(currentWidth - (event.shiftKey ? 48 : 16))
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      resizeTo(currentWidth + (event.shiftKey ? 48 : 16))
    } else if (event.key === 'Home') {
      event.preventDefault()
      resizeTo(context.minFeatureColumnWidth)
    } else if (event.key === 'End') {
      event.preventDefault()
      resizeTo(context.maxFeatureColumnWidth)
    }
  }

  return (
    <th
      ref={cellRef}
      className="atlas-sticky-head sticky left-0 top-0 z-20 px-3 py-3 text-left font-semibold"
    >
      {children}
      {context ? (
        <button
          type="button"
          aria-label="Resize feature column"
          aria-orientation="vertical"
          aria-valuemin={context.minFeatureColumnWidth}
          aria-valuemax={context.maxFeatureColumnWidth}
          aria-valuenow={Math.round(
            context.featureColumnWidth ??
              cellRef.current?.getBoundingClientRect().width ??
              320,
          )}
          role="separator"
          className="atlas-column-resizer atlas-focus"
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
        />
      ) : null}
    </th>
  )
}

export function StickyCell({ children }: { children: ReactNode }) {
  return (
    <td className="atlas-sticky-cell sticky left-0 z-10 bg-inherit px-3 py-2 text-left">
      {children}
    </td>
  )
}
