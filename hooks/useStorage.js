import { useRef } from 'react'

const hydrateFromStorage = (initialState, key) => {
  let state = initialState
  let cachedState = null
  if (process.browser) {
    cachedState = window.localStorage.getItem(key)
    state = cachedState ? JSON.parse(cachedState) : initialState
  }
  return {
    ...initialState,
    ...state
  }
}

const populateStorage = (state, key) => {
  if (process.browser) {
    window.localStorage.setItem(key, JSON.stringify(state))
  }
}

const clearStorage = key => {
  if (process.browser) {
    window.localStorage.removeItem(key)
  }
}

function useStorage (initialState, key) {
  const stateRef = useRef(hydrateFromStorage(initialState, key))
  const setStorage = state => {
    populateStorage(state, key)
    stateRef.current = state
  }
  const cleanup = () => clearStorage(key)
  
  return [
    stateRef.current,
    {
      setStorage,
      cleanup
    }
  ]
}

export default useStorage