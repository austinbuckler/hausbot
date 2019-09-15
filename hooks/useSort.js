import { useState } from 'react'

const ASCENDING = 'ASCENDING'
const DESCENDING = 'DESCENDING'
const CUSTOM = 'CUSTOM'

const ascending = resolver => (a, b) => resolver(a) - resolver(b)
const descending = resolver => (a, b) => resolver(b) - resolver(a)

export const sort = (resolver, comparator) => type => {
  switch (type) {
    case ASCENDING:
      return ascending(resolver)
    case DESCENDING:
      return descending(resolver)
    case CUSTOM:
      return comparator
  }
}

const defaultState = {
  sorting: ASCENDING,
  resolver: a => a,
  comparator: null
}

function useSort (initialState = defaultState) {
  const [{ sorting }, setSorting] = useState(initialState)
  const sorter = sort(resolver, comparator)
  const sortBy = collection => collection.sort(sorter(sorting))
  return [
    sorting,
    {
      setSorting,
      sortBy
    }
  ]
}

export default useSort