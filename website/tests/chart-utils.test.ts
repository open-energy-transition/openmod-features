// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import {
  countScale,
  domainTicks,
  median,
  paretoFrontier,
  percentDomain,
  placeScatterLabels,
  toCsv,
} from '../src/lib/chart-utils'

describe('countScale', () => {
  it('rounds the maximum up to a clean step', () => {
    expect(countScale(11)).toMatchObject({ max: 15, ticks: [0, 5, 10, 15] })
    expect(countScale(195).ticks).toEqual([0, 50, 100, 150, 200])
  })

  it('keeps a usable axis when every value is zero', () => {
    expect(countScale(0)).toMatchObject({ max: 1, ticks: [0, 1] })
  })
})

describe('percentDomain', () => {
  it('pads the data range and snaps to tens', () => {
    expect(percentDomain([42, 58, 91])).toEqual([30, 100])
  })

  it('never spans less than twenty points', () => {
    expect(percentDomain([50, 52])).toEqual([40, 60])
  })

  it('falls back to the full range without data', () => {
    expect(percentDomain([])).toEqual([0, 100])
  })

  it('pairs with ticks every ten points', () => {
    expect(domainTicks([30, 60])).toEqual([30, 40, 50, 60])
  })
})

describe('median', () => {
  it('handles odd and even counts', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('paretoFrontier', () => {
  it('keeps only points not beaten on both axes', () => {
    const points = [
      { id: 'a', x: 90, y: 40 },
      { id: 'b', x: 60, y: 80 },
      { id: 'c', x: 50, y: 50 },
      { id: 'd', x: 70, y: 70 },
    ]

    expect(paretoFrontier(points).map((point) => point.id)).toEqual(['b', 'd', 'a'])
  })

  it('keeps ties on the frontier', () => {
    const points = [
      { id: 'a', x: 50, y: 50 },
      { id: 'b', x: 50, y: 50 },
    ]

    expect(paretoFrontier(points)).toHaveLength(2)
  })
})

describe('toCsv', () => {
  it('quotes cells containing separators', () => {
    expect(toCsv([['tool', 'note'], ['PLEXOS®', 'a, "b"']])).toBe(
      'tool,note\nPLEXOS®,"a, ""b"""',
    )
  })
})

describe('placeScatterLabels', () => {
  it('labels to the right when there is room', () => {
    expect(placeScatterLabels([{ x: 50, y: 50, text: 'PyPSA' }], 400, 200)).toEqual(['right'])
  })

  it('flips to the left at the right edge', () => {
    expect(placeScatterLabels([{ x: 390, y: 50, text: 'PLEXOS' }], 400, 200)).toEqual(['left'])
  })

  it('moves a label away from a neighbour it would overlap', () => {
    const sides = placeScatterLabels(
      [
        { x: 100, y: 100, text: 'Calliope' },
        { x: 130, y: 100, text: 'TIMES' },
      ],
      400,
      200,
    )
    expect(sides[0]).not.toBe('right')
  })
})
