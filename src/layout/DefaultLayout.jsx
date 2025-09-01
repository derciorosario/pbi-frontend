import React,{useState} from 'react'
import { useData } from '../contexts/DataContext'
import Preloader from '../components/loaders/preloader'
import Header from '../components/header'
import Footer from '../components/Footer'
import Sidebar from '../components/Sidebar'
import Contact from '../components/modals/contact'

function DefaultLayout({children,page}) {
  const data=useData()

  return (
   <>
    { <Preloader/>}
    <div id={'top'} className="min-h-[100vh] relative overflow-hidden">
        <Contact/>
        <Header/>
        <Sidebar/>
        {children}
        <Footer/>
    </div>
   </>
  )
}

export default DefaultLayout