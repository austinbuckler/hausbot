import { evolve, reduce } from 'ramda'
import { Client as Craigslist } from 'node-craigslist'
import { sort } from '../../hooks/useSort'

const craigslist = new Craigslist({
  baseHost: 'craigslist.ca',
  city: 'vancouver'
})

const parseListing = evolve({ price: price => price ? parseInt(price.slice(1)) : price })
const withinRange = ([min, max]) => n => n >= min && n <= max

function findPreferredListings ({ priceRange, ids }) {
    const inPriceRange = withinRange(priceRange)
    const notInIds = id => !ids.includes(id)
    return reduce((acc, listing) => {
        const parsedListing = parseListing(listing)
        if (inPriceRange(parsedListing.price) && notInIds(parsedListing.pid)) {
          return acc.concat([parsedListing])
        }
        return acc
    }, [])
}

const listingResolver = listing => listing.price

export default async (req, res) => {
    const listings = await craigslist.list({ category: 'apa' })
    const preferredListings = findPreferredListings(req.body)
    const sorting = sort(listingResolver, null)('ASCENDING')

    res.status(200).json({
      listings: preferredListings(listings).sort(sorting)
    })
}