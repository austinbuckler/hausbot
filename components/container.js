import React from 'react'

const Container = ({ children, ...props }) => (
    <div className='container'>
        {children}
        <style jsx>{`
          .container {
            max-width: 90%;
            margin: 0 auto;
          }
          @media only screen and (min-width: 641px) {
            .container {
              max-width: 640px;
              padding: 1rem;
            }
          }
        `}</style>
    </div>
)

export default Container