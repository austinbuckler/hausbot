import { useCallback, useEffect, useReducer } from "react";
import useStorage from "./useStorage";
import { config } from "../config";

const DEFAULT_STATE = (priceRange = config.PRICE_RANGE) => ({
  listings: [],
  priceRange,
  error: null,
  ids: [],
  favorites: [],
});

const ADD_LISTINGS = "ADD_LISTINGS";
const SET_PRICE_RANGE = "SET_PRICE_RANGE";
const API_ERROR = "API_ERROR";
const TOGGLE_FAVORITE = "TOGGLE_FAVORITE";

const toggleFavorite = (favorites, id) =>
  favorites.reduce(
    (acc, favorite, idx) => {
      if (favorite === id) {
        return acc;
      }
      return acc.concat([favorite]);
    },
    [id]
  );

const reducer = (state, action) => {
  switch (action.type) {
    case ADD_LISTINGS:
      return {
        ...state,
        listings: state.listings.concat(action.payload.filter(listing => !state.ids.includes(listing.pid))),
        ids: state.ids.concat(action.payload.filter(listing => !state.ids.includes(listing.pid)).map((listing) => listing.pid)),
      };
    case SET_PRICE_RANGE:
      return {
        ...state,
        priceRange: action.payload,
      };
    case TOGGLE_FAVORITE:
      return {
        ...state,
        favorites: toggleFavorite(state.favorites, action.payload),
      };
    case API_ERROR:
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

function useListings(priceRange = config.PRICE_RANGE, persistKey = "listings") {
  const [initialState, { setStorage, cleanup }] = useStorage(
    DEFAULT_STATE(priceRange),
    persistKey
  );
  const [state, dispatch] = useReducer(reducer, initialState);
  const findListings = useCallback(async () => {
    if (state.priceRange.length === 0) return null;
    const body = JSON.stringify({
      priceRange: state.priceRange,
      ids: state.ids,
    });
    const abortController = new AbortController()
    try {
      const response = await fetch(`/api/listings`, {
        method: "POST",
        headers: {
          Accept: "application/json; charset=UTF-8",
          "Content-Type": "application/json",
        },
        body,
        signal: abortController.signal,
      });
      const json = await response.json();
      const needsUpdate = json?.listings?.length > 0;
      if (needsUpdate) {
        json.listings.sort((a, b) => {
          return a.price > b.price ? 1 : -1
        })
        dispatch({ type: ADD_LISTINGS, payload: json.listings });
      }
    } catch (error) {
      dispatch({ type: API_ERROR, payload: error });
    } finally {
      return abortController
    }
  }, [state]);

  const toggleFavorite = useCallback((id) => dispatch({ type: TOGGLE_FAVORITE, payload: id }));
  const favoriteListings = useCallback(() =>
    state.listings.filter((listing) => state.favorites.includes(listing.pid)), [state]);
  const setRangeMin = useCallback((min) => dispatch({ type: SET_PRICE_RANGE, payload: [min, state.priceRange[1]] }), [state]);
  const setRangeMax = useCallback((max) => dispatch({ type: SET_PRICE_RANGE, payload: [state.priceRange[0], max] }), [state]);

  useEffect(() => {
    dispatch({ type: SET_PRICE_RANGE, payload: priceRange })
  }, [priceRange])

  useEffect(() => {
    let controller = undefined
    findListings().then((_controller => {
      if (_controller) {
        controller = _controller
      }
    }))
    return () => {
      if (controller) {
        controller.abort();
      }
    }
  }, [findListings, state.priceRange]);

  useEffect(() => {
    setStorage(state);
  }, [state]);

  return [
    state,
    {
      findListings,
      favoriteListings,
      toggleFavorite,
      setRangeMin,
      setRangeMax,
      cleanup,
    },
  ];
}

export default useListings;
