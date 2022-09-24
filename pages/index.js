import React, { useCallback, useMemo, useRef, useState } from "react";
import { NumericFormat } from 'react-number-format'
import dynamic from "next/dynamic";
import Head from "next/head";
import Nav from "../components/nav";
import Listing from "../components/listing";
import Container from "../components/container";
import Global from "../components/global";
import useListings from "../hooks/useListings";
import useInterval from "../hooks/useInterval";
import { config } from "../config";

const Home = () => {
  const [
    { listings, favorites, priceRange },
    { findListings, toggleFavorite, favoriteListings, setRangeMin, setRangeMax },
  ] = useListings();
  const [filter, setFilter] = useState("ALL");
  const minPriceRangeRef = useRef(null)
  const maxPriceRangeRef = useRef(null)

  useInterval(() => findListings(), config.INTERVAL);

  const view = useMemo(() => filter === "ALL" ? listings : favoriteListings(), [filter, favoriteListings, listings]);
  const handlePriceChange = useCallback((type) => (values, sourceInfo) => {
    if (sourceInfo.source === 'event') {
      if (type === 'min') minPriceRangeRef.current = values.floatValue
      else if (type === 'max') maxPriceRangeRef.current = values.floatValue
    }
  }, [])
  const handleSubmit = useCallback((evt) => {
    evt.preventDefault()
    setRangeMin(minPriceRangeRef.current)
    setRangeMax(maxPriceRangeRef.current)
  }, [])

  return (
    <div>
      <Head>
        <title>Home</title>
      </Head>
      <Nav setFilter={setFilter}>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="minPriceRange">Min Price Range</label>
            <NumericFormat
              id="minPriceRange"
              name="minPriceRange"
              placeholder="Min Price Range"
              prefix={'$'}
              defaultValue={priceRange[0]}
              allowNegative={false}
              onValueChange={handlePriceChange('min')}
              thousandSeparator
            />
          </div>
          <div>
            <label htmlFor="maxPriceRange">Max Price Range</label>
            <NumericFormat
              id="maxPriceRange"
              name="maxPriceRange"
              placeholder="Max Price Range"
              prefix={'$'}
              defaultValue={priceRange[1]}  
              allowNegative={false}
              onValueChange={handlePriceChange('max')}
              thousandSeparator
            />
          </div>
          <button>Update Ranges</button>
        </form>
      </Nav>
      <Container>
        {view.map((listing) => (
          <Listing
            key={listing.pid}
            title={listing.title}
            price={listing.price}
            url={listing.url}
            date={listing.date}
            location={listing.location}
            favored={favorites.includes(listing.pid)}
            onFavoriteToggle={() => toggleFavorite(listing.pid)}
          />
        ))}
      </Container>
      <Global />
    </div>
  );
};

export default dynamic(() => Promise.resolve(Home), { ssr: false });
