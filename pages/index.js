import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Head from 'next/head'
import Nav from '../components/nav'
import Listing from '../components/listing'
import Container from '../components/container'
import Global from '../components/global'
import useListings from '../hooks/useListings'
import useInterval from '../hooks/useInterval'

const TIMER = 300000 // 5 Minutes

// https://hausbot.lionhat.co
const Home = () => {
  const [
    { listings, priceRange, favorites },
    { findListings, toggleFavorite, favoriteListings }
  ] = useListings()
  const [filter, setFilter] = useState('ALL')

  useInterval(() => findListings(), TIMER)

  const view = (filter === 'ALL' ? listings : favoriteListings())

  return (
    <div>
        <Head>
          <title>Home</title>
        </Head>
        <Nav setFilter={setFilter} />
        <Container>
            {
                view.map(listing => 
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
                )
            }
        </Container>
        <Global />
    </div>
  )
}

export default dynamic(() => Promise.resolve(Home), { ssr: false })
