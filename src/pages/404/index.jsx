import React from 'react'
import { Link } from 'react-router-dom'

function index() {
  return (
         <div className="flex items-center justify-center h-[100vh] w-full flex-col">
            <h3 className="pb-4 text-[25px]">Page not found</h3>
            <p><Link to={'/'} className="underline">Home</Link></p>
        </div>
  )
}

export default index