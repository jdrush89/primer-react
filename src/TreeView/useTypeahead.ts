import React from 'react'
import useSafeTimeout from '../hooks/useSafeTimeout'
import {getAccessibleName, ROOT_ID} from './shared'
import {SubTreeContents} from './useSubTreeContents'

type TypeaheadOptions = {
  containerRef: React.RefObject<HTMLElement>
  onFocusChange: (element: Element) => void
  scrollContainer: Element | null
  subTreeContents: SubTreeContents
  rowHeight: number
  virtualize: boolean
}

export function useTypeahead({
  containerRef,
  onFocusChange,
  rowHeight,
  scrollContainer,
  subTreeContents,
  virtualize
}: TypeaheadOptions) {
  const [searchValue, setSearchValue] = React.useState('')
  const timeoutRef = React.useRef(0)
  const onFocusChangeRef = React.useRef(onFocusChange)
  const {safeSetTimeout, safeClearTimeout} = useSafeTimeout()

  // Update the ref when the callback changes
  React.useEffect(() => {
    onFocusChangeRef.current = onFocusChange
  }, [onFocusChange])

  // Update the search value when the user types
  React.useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    function onKeyDown(event: KeyboardEvent) {
      // Ignore key presses that don't produce a character value
      if (!event.key || event.key.length > 1) return

      // Ignore key presses that occur with a modifier
      if (event.ctrlKey || event.altKey || event.metaKey) return

      // Update the existing search value with the new key press
      setSearchValue(value => value + event.key)

      // Reset the timeout
      safeClearTimeout(timeoutRef.current)
      timeoutRef.current = safeSetTimeout(() => setSearchValue(''), 300)

      // Prevent default behavior
      event.preventDefault()
      event.stopPropagation()
    }

    container.addEventListener('keydown', onKeyDown)
    return () => container.removeEventListener('keydown', onKeyDown)
  }, [containerRef, safeClearTimeout, safeSetTimeout])

  // Update focus when the search value changes
  React.useEffect(() => {
    // Don't change focus if the search value is empty
    if (!searchValue) return

    if (virtualize) {
      // The element could be virtualized. Try going through the subTreeContents and find the scroll position
      // needed to materlize it.
      const match = findSubTreeMatch(
        subTreeContents,
        ROOT_ID,
        searchValue,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        document.activeElement!.id,
        false,
        0,
        rowHeight,
        {id: '', offset: 0}
      )
      if (match.id && scrollContainer) {
        scrollContainer.scrollTop = convertRemToPixels(match.offset) - scrollContainer.clientHeight / 2
        const focusMatch = async () => {
          const element = await waitForElement(`#${match.id}`)
          !!element && onFocusChangeRef.current(element)
        }
        focusMatch()
      }
      return
    }
    if (!containerRef.current) return
    const container = containerRef.current

    // Get focusable elements
    const elements = Array.from(container.querySelectorAll('[role="treeitem"]'))
      // Filter out collapsed items
      .filter(element => !element.parentElement?.closest('[role=treeitem][aria-expanded=false]'))

    // Get the index of active element
    const activeIndex = elements.findIndex(element => element === document.activeElement)

    // Wrap the array elements such that the active descendant is at the beginning
    let sortedElements = wrapArray(elements, activeIndex)

    // Remove the active descendant from the beginning of the array
    // when the user initiates a new search
    if (searchValue.length === 1) {
      sortedElements = sortedElements.slice(1)
    }

    // Find the first element that matches the search value
    const nextElement = sortedElements.find(element => {
      const name = getAccessibleName(element).toLowerCase()
      return name.startsWith(searchValue.toLowerCase())
    })

    // If a match is found, focus it
    if (nextElement) {
      onFocusChangeRef.current(nextElement)
    }
  }, [searchValue, containerRef, virtualize, subTreeContents, scrollContainer, rowHeight])
}

function waitForElement(selector: string): Promise<Element | null> {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector))
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}

function convertRemToPixels(rem: number) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

interface Match {
  id: string
  offset: number
}

function findSubTreeMatch(
  subTreeContents: SubTreeContents,
  subTreeId: string,
  searchValue: string,
  activeId: string | null,
  pastActive: boolean,
  offset: number,
  rowHeight: number,
  firstMatch: Match
): Match {
  for (const row of subTreeContents[subTreeId]) {
    const rowText = row.text.toLowerCase()
    offset += rowHeight
    if (!firstMatch.id && !pastActive && rowText.startsWith(searchValue.toLowerCase())) {
      firstMatch.id = row.id
      firstMatch.offset = offset
    }
    if (pastActive && rowText.startsWith(searchValue.toLowerCase())) {
      return {id: row.id, offset}
    }
    if (activeId && row.id === activeId) {
      pastActive = true
    }
    if (row.subTreeId) {
      const match = findSubTreeMatch(
        subTreeContents,
        row.subTreeId,
        searchValue,
        activeId,
        pastActive,
        offset,
        rowHeight,
        firstMatch
      )
      if (match.id) {
        return match
      }
      offset = match.offset
    }
  }
  if (subTreeId === ROOT_ID && firstMatch.id) {
    return firstMatch
  }
  return {id: '', offset}
}

/**
 * Wraps an array around itself at a given start index
 *
 * @example
 * wrapArray(['a', 'b', 'c', 'd'], 2) // ['c', 'd', 'a', 'b']
 */
function wrapArray<T>(array: T[], startIndex: number) {
  return array.map((_, index) => array[(startIndex + index) % array.length])
}
