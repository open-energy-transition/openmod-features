import { PreviewCard } from '@base-ui/react/preview-card'
import { FaArrowUpRightFromSquare, FaMinus } from 'react-icons/fa6'
import { getUseCaseValue, isImplemented } from '../data/coverage'
import type {
  CoverageOptions,
  FeatureValue,
  ToolFeature,
  ToolRecord,
  UseCaseRecord,
} from '../data/types'
import { StatusIcon } from './ui'

export function StatusCell({
  feature,
  options,
}: {
  feature: ToolFeature | undefined
  options: CoverageOptions
}) {
  const value = feature?.value ?? '?'
  const sourced = Boolean(feature?.sources.length)
  const implemented = isImplemented(feature, options)

  return (
    <div className="flex items-center justify-center gap-1.5">
      <StatusIcon value={value} sourced={sourced} muted={!implemented} />
      {feature?.sources.map((source, index) => (
        <SourceReferenceLink
          key={source}
          source={source}
          index={index}
        />
      ))}
    </div>
  )
}

export function RequirementCell({
  value,
  toolFeature,
  options,
  hasTool,
}: {
  value: FeatureValue
  toolFeature: ToolFeature | undefined
  options: CoverageOptions
  hasTool: boolean
}) {
  if (value !== 'y') {
    return (
      <span className="inline-flex items-center justify-center text-slate-400">
        <FaMinus aria-hidden="true" />
        <span className="sr-only">Not required</span>
      </span>
    )
  }

  if (!hasTool) {
    return <StatusIcon value="y" sourced />
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <StatusIcon
        value={toolFeature?.value ?? 'n'}
        sourced={Boolean(toolFeature?.sources.length)}
        muted={!isImplemented(toolFeature, options)}
      />
      {toolFeature?.sources.map((source, index) => (
        <SourceReferenceLink
          key={source}
          source={source}
          index={index}
        />
      ))}
    </div>
  )
}

function SourceReferenceLink({
  source,
  index,
}: {
  source: string
  index: number
}) {
  const reference = formatReference(source)
  const number = index + 1

  return (
    <PreviewCard.Root>
      <PreviewCard.Trigger
        href={source}
        target="_blank"
        rel="noreferrer"
        delay={300}
        className="rounded px-0.5 text-[10px] font-semibold text-teal-700 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
        aria-label={`Open source ${number}: ${reference.label}`}
      >
        {number}
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="top" align="center" sideOffset={8}>
          <PreviewCard.Popup className="z-50 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white p-3 text-left text-sm text-slate-700 shadow-lg outline-none">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Reference {number}
                </p>
                <p className="mt-1 truncate font-semibold text-slate-950">
                  {reference.label}
                </p>
              </div>
              <FaArrowUpRightFromSquare
                className="mt-1 shrink-0 text-xs text-teal-700"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 line-clamp-3 break-all text-xs leading-5 text-slate-600">
              {source}
            </p>
            <p className="mt-3 text-xs font-medium text-teal-700">
              Click to open the source in a new tab.
            </p>
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  )
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
