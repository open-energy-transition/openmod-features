import { FaMinus } from 'react-icons/fa6'
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
        <a
          key={source}
          href={source}
          target="_blank"
          rel="noreferrer"
          className="rounded px-0.5 text-[10px] font-semibold text-teal-700 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          aria-label={`Open source ${index + 1}`}
        >
          {index + 1}
        </a>
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
    <StatusIcon
      value={toolFeature?.value ?? 'n'}
      sourced={Boolean(toolFeature?.sources.length)}
      muted={!isImplemented(toolFeature, options)}
    />
  )
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

