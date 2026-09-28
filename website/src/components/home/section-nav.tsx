// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { useEffect, useState } from 'react'

export const HOME_SECTIONS = [
  { id: 'highlights', label: 'Highlights', color: 'var(--section-highlights)' },
  { id: 'coverage', label: 'Feature coverage', color: 'var(--section-coverage)' },
  { id: 'use-case-fit', label: 'Use-case fit', color: 'var(--section-fit)' },
  { id: 'trade-offs', label: 'Use-case trade-offs', color: 'var(--section-trade-offs)' },
  { id: 'categories', label: 'Category breakdown', color: 'var(--section-categories)' },
  { id: 'tools', label: 'Tools', color: 'var(--section-tools)' },
] as const

export type HomeSectionId = (typeof HOME_SECTIONS)[number]['id']

export function sectionColor(id: HomeSectionId) {
  return HOME_SECTIONS.find((section) => section.id === id)?.color
}

/** Sticky table of contents beside the sections on wide screens. */
export function SectionSidebar() {
  const active = useActiveSection()

  return (
    <aside className="hidden lg:block" aria-label="Page sections">
      <nav className="atlas-toc">
        {HOME_SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? 'location' : undefined}
            className="atlas-toc-link atlas-focus outline-none"
          >
            <span
              className="atlas-section-square"
              data-size="sm"
              style={{ backgroundColor: section.color }}
              aria-hidden="true"
            />
            <span>{section.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

/** Horizontal section links for narrow screens, where the sidebar is hidden. */
export function SectionNav() {
  return (
    <nav aria-label="Page sections" className="atlas-section-nav lg:hidden">
      {HOME_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="atlas-section-nav-link atlas-focus outline-none"
        >
          <span
            className="atlas-section-square"
            data-size="sm"
            style={{ backgroundColor: section.color }}
            aria-hidden="true"
          />
          {section.label}
        </a>
      ))}
    </nav>
  )
}

// The section whose top has scrolled past the sticky top bar; the last one once the page bottom is reached.
function useActiveSection() {
  const [active, setActive] = useState<HomeSectionId>(HOME_SECTIONS[0].id)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      let current: HomeSectionId = HOME_SECTIONS[0].id

      for (const section of HOME_SECTIONS) {
        const element = document.getElementById(section.id)
        if (element && element.getBoundingClientRect().top <= 140) {
          current = section.id
        }
      }

      setActive(atBottom ? HOME_SECTIONS[HOME_SECTIONS.length - 1].id : current)
    }
    const schedule = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return active
}
