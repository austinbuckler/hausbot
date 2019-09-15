import React, { useEffect, useState } from 'react'
import Star from './star'

const FavoriteButton = ({ favored, ...props }) => (
  <button {...props} type='button'>
    <Star favorited={favored} />
    <style jsx>{`
      button {
        outline: none;
        border: none;
        cursor: pointer;
        padding: 1rem;
        background: none;
        transition: all 0.3s ease-in-out;
      }
      button:hover {
        background: #F7F7F7;
      }
    `}</style>
  </button>
)

export default FavoriteButton