import { useCallback, useEffect, useReducer } from "react";
import useStorage from "./useStorage";
import { config } from "../config";

const DEFAULT_STATE = {
  listings: [],
  priceRange: config.PRICE_RANGE,
  error: null,
  ids: [],
  favorites: [],
};

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
        listings: state.listings.concat(action.payload),
        ids: state.ids.concat(action.payload.map((listing) => listing.pid)),
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

function useListings(persistKey = "listings") {
  const [initialState, { setStorage, cleanup }] = useStorage(
    DEFAULT_STATE,
    persistKey
  );
  const [state, dispatch] = useReducer(reducer, initialState);
  const findListings = useCallback(async () => {
    if (state.priceRange.length === 0) return null;
    const body = JSON.stringify({
      priceRange: state.priceRange,
      ids: state.ids,
    });
    try {
      const response = await fetch(`/api/listings`, {
        method: "POST",
        headers: {
          Accept: "application/json; charset=UTF-8",
          "Content-Type": "application/json",
        },
        body,
      });
      const json = await response.json();
      const needsUpdate = json?.listings?.length > 0;
      if (needsUpdate) {
        dispatch({ type: ADD_LISTINGS, payload: json.listings });
      }
      return json;
    } catch (error) {
      dispatch({ type: API_ERROR, payload: error });
    }
  }, [state]);

  useEffect(() => {
    findListings();
  }, [findListings]);

  const toggleFavorite = (id) =>
    dispatch({ type: TOGGLE_FAVORITE, payload: id });
  const favoriteListings = () =>
    state.listings.filter((listing) => state.favorites.includes(listing.pid));

  useEffect(() => {
    setStorage(state);
  }, [state]);

  return [
    state,
    {
      findListings,
      favoriteListings,
      toggleFavorite,
      cleanup,
    },
  ];
}

export default useListings;
