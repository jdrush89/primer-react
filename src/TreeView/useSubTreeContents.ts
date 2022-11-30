import React from 'react'
import {onlyText} from 'react-children-utilities'
import {TreeView} from './TreeView'

export type ItemInfo = {
  id: string
  text: string
  subTreeId?: string
}

export type SubTreeContents = {[id: string]: ItemInfo[]}

export function useSubTreeContents(
  children: React.ReactNode | React.ReactNode[],
  virtualize: boolean,
  isExpanded: boolean,
  itemId: string,
  subTreeContents: SubTreeContents
) {
  React.useEffect(() => {
    const contents = []
    if (virtualize && isExpanded) {
      for (const child of React.Children.toArray(children)) {
        const childrenWithoutSubTree = getChildrenWithoutSubTree((child as React.ReactElement).props.children)
        const textContent = onlyText(childrenWithoutSubTree)
        const childContent: ItemInfo = {text: textContent, id: (child as React.ReactElement).props.id}
        const subTree = getSubTree((child as React.ReactElement).props.children)
        if (subTree) {
          // Add the subtree to the current contents
          childContent.subTreeId = (child as React.ReactElement).props.id
        }
        contents.push(childContent)
      }
    }
    subTreeContents[itemId] = contents
  }, [children, isExpanded, itemId, subTreeContents, virtualize])
}

export function useSubTree(children: React.ReactNode) {
  return React.useMemo(() => {
    const subTree = getSubTree(children)

    const childrenWithoutSubTree = getChildrenWithoutSubTree(children)

    return {
      subTree,
      childrenWithoutSubTree,
      hasSubTree: Boolean(subTree)
    }
  }, [children])
}

function getSubTree(children: React.ReactNode) {
  return React.Children.toArray(children).find(child => React.isValidElement(child) && child.type === TreeView.SubTree)
}

function getChildrenWithoutSubTree(children: React.ReactNode) {
  return React.Children.toArray(children).filter(
    child => !(React.isValidElement(child) && child.type === TreeView.SubTree)
  )
}
