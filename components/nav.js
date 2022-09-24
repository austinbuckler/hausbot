import React from 'react'
import Link from 'next/link'
import Container from './container'

const Nav = ({ setFilter, children }) => (
  <nav>
    <Container>
      <div>
        <h1 className='title'>hausbot</h1>
        <button type='button' onClick={() => setFilter('ALL')}>All</button>
        <button type='button' onClick={() => setFilter('FAVORITES')}>Favorites</button>
        {children}
      </div>
    </Container>
    <style jsx>{`
      .title {
        line-height: 1.15;
        font-size: 48px;
        margin: 0;
      }
      nav {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        background: #FFF;
        height: 152px;
      }
    `}</style>
  </nav>
)

export default Nav
