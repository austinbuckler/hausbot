import { evolve, curry } from "ramda";
import { Client as CraigsListClient } from "node-craigslist";
import { sort } from "../../hooks/useSort";

const craigslist = new CraigsListClient({
  baseHost: "craigslist.org",
  city: "vancouver",
});

const parseListing = evolve({
  price: (price) => {
    const newPrice = price
      ? parseInt(price.slice(1).replace(/,/gi, ""))
      : price;
    return newPrice;
  },
});
const withinRange = curry(([min, max], n) => n >= min && n <= max);

const findPreferredListings = curry(({ priceRange, ids }, listings) => {
  const inPriceRange = withinRange(priceRange);
  const notInIds = (id) => !ids.includes(id);
  const preferredListings = [];
  for (const listing of listings) {
    const parsedListing = parseListing(listing);
    const isPreferred =
      inPriceRange(parsedListing.price) && notInIds(parsedListing.pid);
    if (isPreferred) {
      preferredListings.push(parsedListing);
    }
  }
  return preferredListings;
});

const listingResolver = (listing) => listing.price;

export default async (req, res) => {
  try {
    const listings = await craigslist.list({ category: "apa" });
    const preferredListings = findPreferredListings(req.body);
    const sorting = sort(listingResolver, null)("ASCENDING");

    res.status(200).json({
      listings: preferredListings(listings).sort(sorting),
    });
  } catch (ex) {
    console.error(ex);
    res.status(500).json({ message: "whoops!" });
  }
};
