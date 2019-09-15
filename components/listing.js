import React from 'react'
import Dinero from 'dinero.js'
import { formatDistance, parseISO } from 'date-fns'
import FavoriteButton from './favoriteBtn'

const formatPrice = price => Dinero({ amount: parseInt(`${price}00`) }).toFormat('$0,0')
const getTime = date => formatDistance(new Date(), parseISO(date))
const Listing = ({ title, price, favored, url, date, location, onFavoriteToggle }) => (
    <article className='listing'>
        <header className='header'>
          <FavoriteButton
            favored={favored}
            onClick={onFavoriteToggle}
          />
          <h2 className='title'>
            <a href={url} target='_blank' rel='noreferrer nofollow'>{title}</a>
          </h2>
          <h3 className='price'>{formatPrice(price)}</h3>
        </header>
        <footer className='footer'>
          <span className='time'>{`${getTime(date)} ago`}</span>
          <span className='location'>{location}</span>
        </footer>
        <style jsx>{`
          .listing {
            padding: 0.5rem 1rem;
            display: flex;
            width: 100%;
            transition: all 0.3s ease-in-out;
            flex-direction: column;
          }
          .listing:not(:last-of-type) {
            border-bottom: 1px solid #F7F7F7;
          }
          .header,
          .footer {
            display: flex;
            align-items: center;
            font-size: 0.865rem;
          }
          .footer {
            color: #828282;
            padding: 0.4rem 0;
          }
          .price,
          .location {
            margin-left: auto;
          }
          .title {
            font-size: 1.3rem;
            font-weight: 500;
            margin: 0 1rem;
          }
          .price {
            font-weight: 200;
            font-size: 1.125rem;
          }
          .time {
            font-weight: 500;
          }
        `}</style>
    </article>
)

export default Listing