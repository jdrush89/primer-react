import React, {ComponentProps, PropsWithChildren, useEffect, useRef} from 'react'
import type {RefObject} from 'react'
import Box from '../Box'

function useObservedElement<T extends Element>(
  elementRef: RefObject<T>,
  observe?: (element: Element) => void,
  unobserve?: (element: Element) => void
) {
  useEffect(() => {
    if (elementRef.current) {
      const ref = elementRef.current
      observe?.(ref)
      return () => unobserve?.(ref)
    }
  }, [elementRef, observe, unobserve])
}

export interface ObservableBoxProps extends PropsWithChildren<ComponentProps<typeof Box>> {
  onObserve?: (element: Element) => void
  onUnobserve?: (element: Element) => void
}

export default function ObservableBox({children, onObserve, onUnobserve, ...props}: ObservableBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  useObservedElement(boxRef, onObserve, onUnobserve)
  return (
    <Box {...props} ref={boxRef}>
      {children}
    </Box>
  )
}
