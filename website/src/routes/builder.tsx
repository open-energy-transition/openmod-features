import { Checkbox } from '@base-ui/react/checkbox'
import { Select } from '@base-ui/react/select'
import { Tabs } from '@base-ui/react/tabs'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  FaCheck,
  FaChevronDown,
  FaClipboardCheck,
  FaFileExport,
  FaFileImport,
  FaRegTrashCan,
  FaSpinner,
} from 'react-icons/fa6'
import { useDashboardContext } from '../components/dashboard-layout'
import { FeatureTable, Panel } from '../components/page-shell'
import { LegendActions } from '../components/table'
import { CoverageBadge, Hint } from '../components/ui'
import { calculateUseCaseCoverage } from '../data/coverage'
import {
  CUSTOM_USE_CASE_PARAM,
  CUSTOM_USE_CASE_ID,
  countSelectedCategories,
  countSelectedFeatures,
  createCustomUseCase,
  createSelectionFromUseCase,
  createSelectionFromUseCaseYaml,
  encodeCustomUseCase,
  featureSelectionKey,
  serializeUseCaseYaml,
} from '../data/custom-use-case'
import type { TaxonomyCategory, UseCaseRecord } from '../data/types'
import {
  compareCoverage,
  filterTaxonomy,
  sortTaxonomyAlphabetically,
  toggleSetValue,
} from '../lib/dashboard-utils'

export const Route = createFileRoute('/builder')({
  component: UseCaseBuilderPage,
})

type StartingMode = 'scratch' | 'copy' | 'yaml'

function UseCaseBuilderPage() {
  const navigate = useNavigate()
  const {
    data,
    coverageOptions,
    customUseCase,
    setCustomUseCase,
    clearCustomUseCase,
  } = useDashboardContext()
  const builtInUseCases = data.useCases.filter(
    (useCase) => useCase.id !== CUSTOM_USE_CASE_ID,
  )
  const [name, setName] = useState(customUseCase?.name ?? 'My Use Case')
  const [startingMode, setStartingMode] = useState<StartingMode>('scratch')
  const [templateId, setTemplateId] = useState(builtInUseCases[0]?.id ?? '')
  const [yamlFile, setYamlFile] = useState<File | null>(null)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [yamlImportError, setYamlImportError] = useState<string | null>(null)
  const [selected, setSelected] = useState(
    () => (customUseCase ? createSelectionFromUseCase(customUseCase) : new Set<string>()),
  )
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!customUseCase) {
      return
    }

    setName(customUseCase.name)
    setSelected(createSelectionFromUseCase(customUseCase))
  }, [customUseCase])

  const taxonomy = useMemo(
    () => sortTaxonomyAlphabetically(filterTaxonomy(data.taxonomy, query)),
    [data.taxonomy, query],
  )
  const draftUseCase = useMemo(
    () => createCustomUseCase(name, data.taxonomy, selected),
    [data.taxonomy, name, selected],
  )
  const yaml = useMemo(() => serializeUseCaseYaml(draftUseCase), [draftUseCase])
  const allExpanded =
    taxonomy.length > 0 && taxonomy.every((category) => expanded.has(category.id))
  const selectedFeatureCount = countSelectedFeatures(selected)
  const selectedCategoryCount = countSelectedCategories(selected)
  const actionHelper =
    selectedFeatureCount > 0
      ? `${selectedFeatureCount} features selected.`
      : startingMode === 'yaml'
        ? 'Export a YAML draft from the YAML tab, edit it locally, then load it here.'
        : 'Select at least one required feature to compare a custom use case.'
  const toolCoverage = data.tools
    .map((tool) => ({
      tool,
      coverage: calculateUseCaseCoverage(
        data.taxonomy,
        tool,
        draftUseCase,
        coverageOptions,
      ),
    }))
    .sort((left, right) => compareCoverage(right.coverage, left.coverage))

  const applyTemplate = () => {
    const template = data.useCases.find((useCase) => useCase.id === templateId)
    if (!template) {
      setSelected(new Set())
      return
    }

    setSelected(createSelectionFromUseCase(template))
  }

  const clearSelection = () => {
    setSelected(new Set())
    setSaving(false)
    setYamlImportError(null)
    clearCustomUseCase()
  }

  const handleSave = async () => {
    if (selectedFeatureCount === 0 || saving) {
      return
    }

    setSaving(true)
    const encodedCustomUseCase = encodeCustomUseCase(draftUseCase)
    setCustomUseCase(draftUseCase)

    try {
      await navigate({
        to: '/use-cases',
        search: {
          [CUSTOM_USE_CASE_PARAM]: encodedCustomUseCase,
        } as never,
      })
    } finally {
      setSaving(false)
    }
  }

  const importYaml = async (file: File | null | undefined) => {
    if (!file) {
      return
    }

    try {
      const nextSelected = await createSelectionFromUseCaseYaml(
        await file.text(),
        data.taxonomy,
      )
      setSelected(nextSelected)
      setYamlFile(file)
      setYamlImportError(
        nextSelected.size === 0
          ? 'No known required features were found in that YAML file.'
          : null,
      )
    } catch {
      setYamlImportError('The selected YAML file could not be parsed.')
    }
  }

  const exportYaml = () => {
    const url = URL.createObjectURL(new Blob([yaml], { type: 'text/yaml' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${slugifyFileName(name)}.features.yaml`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Panel
          title="Use Case Builder"
          description="Compose required feature rows, then save the draft as a shareable custom use case for the matrix pages."
        >
          <div className="grid gap-4 p-4">
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Use case name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="My Use Case"
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <StartingPointTabs
              value={startingMode}
              onValueChange={setStartingMode}
              templateId={templateId}
              onTemplateChange={setTemplateId}
              onLoadTemplate={applyTemplate}
              useCases={builtInUseCases}
              yamlFile={yamlFile}
              onYamlFileChange={(file) => setYamlFile(file)}
              onLoadYaml={() => void importYaml(yamlFile)}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-sm text-slate-500">
                {actionHelper}
              </p>
              <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                >
                  <FaRegTrashCan aria-hidden="true" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={selectedFeatureCount === 0 || saving}
                  aria-busy={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? (
                    <FaSpinner className="animate-spin" aria-hidden="true" />
                  ) : (
                    <FaCheck aria-hidden="true" />
                  )}
                  {saving ? 'Saving...' : 'Save and compare'}
                </button>
              </div>
            </div>
            {yamlImportError ? (
              <p role="alert" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {yamlImportError}
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Draft Summary">
          <dl className="grid grid-cols-2 gap-3 p-4 text-sm">
            <SummaryItem label="Features" value={selectedFeatureCount.toString()} />
            <SummaryItem label="Categories" value={selectedCategoryCount.toString()} />
          </dl>
          <div className="border-t border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Tool fit preview</h3>
            <div className="mt-3 grid gap-2">
              {toolCoverage.map(({ tool, coverage }) => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="min-w-0 truncate text-slate-700">{tool.name}</span>
                  <CoverageBadge coverage={coverage} />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      <Tabs.Root defaultValue="list" className="grid gap-4">
        <Tabs.List className="flex w-fit max-w-full gap-1 overflow-x-auto border-b border-slate-200">
          <Tabs.Tab
            value="list"
            className="h-10 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium leading-10 text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-teal-700 data-[active]:border-teal-700 data-[active]:text-teal-800"
          >
            List
          </Tabs.Tab>
          <Tabs.Tab
            value="yaml"
            className="h-10 whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-medium leading-10 text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-teal-700 data-[active]:border-teal-700 data-[active]:text-teal-800"
          >
            YAML
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="list" className="grid gap-4 outline-none">
          <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-end lg:justify-between">
            <label className="grid w-full gap-1 text-sm font-medium text-slate-700 lg:max-w-[50%]">
              <span className="flex items-center justify-between gap-2">
                <span>Search</span>
                <span className="text-xs font-normal text-slate-500">
                  {taxonomy.length} categories
                </span>
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search feature names or keys"
                className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <LegendActions
              legend={null}
              allExpanded={allExpanded}
              onUnfoldAll={() =>
                setExpanded(new Set(taxonomy.map((category) => category.id)))
              }
              onFoldAll={() => setExpanded(new Set())}
            />
          </div>

          <FeatureTable minWidth="840px">
            <tbody>
              {taxonomy.map((category) => (
                <BuilderCategoryRows
                  key={category.id}
                  category={category}
                  expanded={expanded.has(category.id)}
                  selected={selected}
                  onToggleCategory={() =>
                    toggleSetValue(expanded, setExpanded, category.id)
                  }
                  onToggleFeature={(featureId, checked) => {
                    const next = new Set(selected)
                    const key = featureSelectionKey(category.id, featureId)
                    if (checked) {
                      next.add(key)
                    } else {
                      next.delete(key)
                    }
                    setSelected(next)
                  }}
                />
              ))}
            </tbody>
          </FeatureTable>
        </Tabs.Panel>

        <Tabs.Panel value="yaml" className="outline-none">
          <Panel
            title="YAML Export"
            description="Use this content as a starting point for a repository use-case features.yaml file."
            actions={<ExportAction onExport={exportYaml} />}
          >
            <pre className="max-h-[36rem] overflow-auto p-4 text-xs leading-5 text-slate-700">
              {yaml}
            </pre>
          </Panel>
        </Tabs.Panel>
      </Tabs.Root>
    </div>
  )
}

function slugifyFileName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'my-use-case'
  )
}

function ExportAction({ onExport }: { onExport: () => void }) {
  return (
    <button
      type="button"
      onClick={onExport}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
    >
      <FaFileExport aria-hidden="true" />
      Export
    </button>
  )
}

function StartingPointTabs({
  value,
  onValueChange,
  templateId,
  onTemplateChange,
  onLoadTemplate,
  useCases,
  yamlFile,
  onYamlFileChange,
  onLoadYaml,
}: {
  value: StartingMode
  onValueChange: (value: StartingMode) => void
  templateId: string
  onTemplateChange: (value: string) => void
  onLoadTemplate: () => void
  useCases: UseCaseRecord[]
  yamlFile: File | null
  onYamlFileChange: (file: File | null) => void
  onLoadYaml: () => void
}) {
  const yamlInputId = 'starting-point-yaml'

  return (
    <Tabs.Root
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue === 'scratch' || nextValue === 'copy' || nextValue === 'yaml') {
          onValueChange(nextValue)
        }
      }}
      className="grid gap-3"
    >
      <div className="grid gap-1">
        <span className="text-sm font-medium text-slate-700">Starting point</span>
        <Tabs.List className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-1">
          <StartingPointTab value="scratch">From scratch</StartingPointTab>
          <StartingPointTab value="copy">Copy existing</StartingPointTab>
          <StartingPointTab value="yaml">Import YAML</StartingPointTab>
        </Tabs.List>
      </div>

      <Tabs.Panel value="scratch" className="outline-none">
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Start with an empty requirement set, then pick required features manually
          from the feature list below.
        </p>
      </Tabs.Panel>

      <Tabs.Panel value="copy" className="grid gap-3 outline-none lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <TemplateSelect
          value={templateId}
          onValueChange={onTemplateChange}
          useCases={useCases}
        />
        <button
          type="button"
          onClick={onLoadTemplate}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
        >
          <FaClipboardCheck aria-hidden="true" />
          Load use case
        </button>
      </Tabs.Panel>

      <Tabs.Panel value="yaml" className="grid gap-3 outline-none lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Local YAML file
          <input
            id={yamlInputId}
            type="file"
            accept=".yaml,.yml,text/yaml,application/yaml"
            onChange={(event) => onYamlFileChange(event.target.files?.[0] ?? null)}
            className="block h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-sm file:font-medium file:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          />
        </label>
        <button
          type="button"
          onClick={onLoadYaml}
          disabled={!yamlFile}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <FaFileImport aria-hidden="true" />
          Load YAML
        </button>
      </Tabs.Panel>
    </Tabs.Root>
  )
}

function StartingPointTab({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  return (
    <Tabs.Tab
      value={value}
      className="h-8 whitespace-nowrap rounded px-3 text-sm font-medium text-slate-600 outline-none hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-teal-700 data-[active]:bg-white data-[active]:text-teal-800 data-[active]:shadow-sm"
    >
      {children}
    </Tabs.Tab>
  )
}

function TemplateSelect({
  value,
  onValueChange,
  useCases,
}: {
  value: string
  onValueChange: (value: string) => void
  useCases: UseCaseRecord[]
}) {
  const items = useCases.map((useCase) => ({
    value: useCase.id,
    label: useCase.name,
  }))

  return (
    <Select.Root
      items={items}
      value={value}
      onValueChange={(nextValue) => {
        if (typeof nextValue === 'string') {
          onValueChange(nextValue)
        }
      }}
      modal={false}
    >
      <div className="grid gap-1 text-sm font-medium text-slate-700">
        <Select.Label>Existing use cases</Select.Label>
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-slate-950">{value}</dd>
    </div>
  )
}

function BuilderCategoryRows({
  category,
  expanded,
  selected,
  onToggleCategory,
  onToggleFeature,
}: {
  category: TaxonomyCategory
  expanded: boolean
  selected: Set<string>
  onToggleCategory: () => void
  onToggleFeature: (featureId: string, checked: boolean) => void
}) {
  const selectedCount = category.members.filter((feature) =>
    selected.has(featureSelectionKey(category.id, feature.id)),
  ).length

  return (
    <>
      <tr className="bg-slate-100">
        <td colSpan={3} className="border-b border-slate-200 px-3 py-2">
          <button
            type="button"
            onClick={onToggleCategory}
            aria-expanded={expanded}
            className="flex w-full items-center justify-between gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-800">
              <FaChevronDown
                className={expanded ? 'shrink-0' : '-rotate-90 shrink-0'}
                aria-hidden="true"
              />
              <Hint label={category.description}>{category.label}</Hint>
            </span>
            <span className="shrink-0 text-xs font-medium text-slate-500">
              {selectedCount}/{category.members.length}
            </span>
          </button>
        </td>
      </tr>
      {expanded
        ? category.members.map((feature) => {
            const key = featureSelectionKey(category.id, feature.id)
            const checked = selected.has(key)

            return (
              <tr key={feature.id} className="hover:bg-slate-50">
                <td className="w-12 border-b border-slate-100 px-3 py-2">
                  <Checkbox.Root
                    checked={checked}
                    onCheckedChange={(nextChecked) =>
                      onToggleFeature(feature.id, nextChecked === true)
                    }
                    aria-label={`Require ${feature.label}`}
                    className="grid h-5 w-5 place-items-center rounded border border-slate-400 text-white outline-none focus-visible:ring-2 focus-visible:ring-teal-700 data-[checked]:border-teal-700 data-[checked]:bg-teal-700"
                  >
                    <Checkbox.Indicator>
                      <FaCheck className="text-[11px]" aria-hidden="true" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                </td>
                <td className="border-b border-slate-100 px-3 py-2 text-sm font-medium text-slate-800">
                  <Hint label={feature.description}>{feature.label}</Hint>
                </td>
                <td className="w-40 border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                  {checked ? 'Required' : 'Not required'}
                </td>
              </tr>
            )
          })
        : null}
    </>
  )
}
