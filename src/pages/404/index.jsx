import React from 'react'
import { Link } from 'react-router-dom'
import DefaultLayout from '../../layout/DefaultLayout'
import Header from '../../components/Header'

function index() {
  return (
        <DefaultLayout>
            <Header/>
             <div className="flex items-center justify-center h-[100vh] w-full flex-col">
            <h3 className="pb-4 text-[25px]">Page not found</h3>
            <p><Link to={'/'} className="underline">Home</Link></p>
          </div>
        </DefaultLayout>
  )
}

export default index