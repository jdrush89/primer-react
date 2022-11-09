import {useCallback, useEffect, useMemo} from 'react'

/**
 * Create an intersection observer with the given args and callback. Return functions that allow the consumer
 * to observe, unobserve, and disconnect. Whenever the callback or observer args change, the observer will be
 * recreated and the old observer will be disconnected.
 *
 * @param callback      callback that will be invoked when the intersection observer detects an intersection
 * @param observerArgs  IntersectionObserver options to pass to the intersection observer
 * root:
 * Scrollable node that observed element intersections will be measured against
 *
 * rootMargin:
 * Root's margin values.
 * Allows the intersection measurement points to be shifted for top, bottom, left, and right.
 *
 * threshold:
 * Threshold can be a single number or a list of numbers between 0 and 1.
 * Thresholds determine how much overlap between the observed element and the root is required for an
 * intersection event to be fired. It can be a single threshold or a list of thresholds. The default is 0,
 * which means that whenever any amount of an observed element is scrolled into view of the root,
 * an intersection event is fired. Conversely, a value of 1 means that an intersection will only be fired
 * when the entire observed element is scrolled into the root's view.
 */
export default function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  observerArgs?: IntersectionObserverInit
): [(element: Element) => void, (element: Element) => void, () => void] {
  const intersectionObserver = useMemo(() => new IntersectionObserver(callback, observerArgs), [callback, observerArgs])

  // disconnect the observer when it changes or the component unmounts
  useEffect(() => {
    return () => intersectionObserver.disconnect()
  }, [intersectionObserver])

  const observe = useCallback((element: Element) => intersectionObserver.observe(element), [intersectionObserver])
  const unobserve = useCallback((element: Element) => intersectionObserver.unobserve(element), [intersectionObserver])
  const disconnect = useCallback(() => intersectionObserver.disconnect(), [intersectionObserver])
  return [observe, unobserve, disconnect]
}
