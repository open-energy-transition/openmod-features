// SPDX-FileCopyrightText: 2026 openmod-features contributors
//
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from 'react'

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

/** Horizontal section links for narrow screens, docked under the top bar as the page scrolls. */
export function SectionNav() {
  const active = useActiveSection()
  const navRef = useRef<HTMLElement>(null)

  useTopBarHeight()

  useEffect(() => {
    const nav = navRef.current
    const link = nav?.querySelector<HTMLElement>('[aria-current]')
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) {
      return
    }
    // Scroll only the strip, never the page, to keep the active link visible.
    nav.scrollTo({
      left: link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }, [active])

  return (
    <nav ref={navRef} aria-label="Page sections" className="atlas-section-nav lg:hidden">
      {HOME_SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={active === section.id ? 'location' : undefined}
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

// Publish the top bar height, which changes when its nav wraps, so the section strip can dock under it.
function useTopBarHeight() {
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.atlas-topbar')
    if (!bar) {
      return
    }
    const root = document.documentElement
    const observer = new ResizeObserver(() =>
      root.style.setProperty('--atlas-topbar-height', `${bar.offsetHeight}px`),
    )
    observer.observe(bar)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--atlas-topbar-height')
    }
  }, [])
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
        if (element && element.getBoundingClientRect().top <= 160) {
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
