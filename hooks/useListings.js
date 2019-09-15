import { useEffect, useReducer } from 'react'
import { usePost } from 'use-http'
import useStorage from './useStorage'

const DEFAULT_STATE = {
  listings: [],
  priceRange: [1444, 2400],
  error: null,
  ids: [],
  favorites: []
}

const ADD_LISTINGS = 'ADD_LISTINGS'
const SET_PRICE_RANGE = 'SET_PRICE_RANGE'
const API_ERROR = 'API_ERROR'
const TOGGLE_FAVORITE = 'TOGGLE_FAVORITE'

const toggleFavorite = (favorites, id) =>
  favorites.reduce((acc, favorite, idx) => {
    if (favorite === id) {
      return acc
    }
    return acc.concat([favorite])
  }, [id])

const reducer = (state, action) => {
  switch (action.type) {
    case ADD_LISTINGS:
      return {
        ...state,
        listings: state.listings.concat(action.payload),
        ids: state.ids.concat(action.payload.map(listing => listing.pid))
      }
    case SET_PRICE_RANGE:
      return {
        ...state,
        priceRange: action.payload
      }
    case TOGGLE_FAVORITE:
      return {
        ...state,
        favorites: toggleFavorite(state.favorites, action.payload)
      }
    case API_ERROR:
      return {
        ...state,
        error: action.payload
      }
    default: 
      return state
  }
}

function useListings (persistKey = 'listings') {
  const [initialState, { setStorage, cleanup }] = useStorage(DEFAULT_STATE, persistKey)
  const [state, dispatch] = useReducer(reducer, initialState)
  const [data, loading, error, findListings] = usePost({
    url: `http://localhost:3000/api/listings`,
    headers: {
      'Accept': 'application/json; charset=UTF-8'
    },
    onMount: true,
    body: { priceRange: state.priceRange, ids: state.ids }
  })

  const find = async () => {
      if (priceRange.length === 0) {
        return null
      }
      return findListings({ priceRange: state.priceRange, ids: state.ids })
  }

  const toggleFavorite = id => dispatch({ type: TOGGLE_FAVORITE, payload: id })
  const favoriteListings = () => state.listings.filter(listing => state.favorites.includes(listing.pid))

  useEffect(() => {
    const needsUpdate = !loading && data && data.listings.length > 0
    if (needsUpdate) {
      dispatch({ type: ADD_LISTINGS, payload: data.listings })
    }
    if (error) {
      dispatch({ type: API_ERROR, payload: error })
    }
  }, [data, loading, error])

  useEffect(() => {
    setStorage(state)
  }, [state])
  
  return [
    state,
    {
      findListings: find,
      favoriteListings,
      toggleFavorite,
      cleanup
    },
  ]
}

export default useListings