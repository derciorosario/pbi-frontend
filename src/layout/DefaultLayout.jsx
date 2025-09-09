import React,{useState} from 'react'
import { useAuth } from '../contexts/AuthContext'
import FullPageLoader from '../components/ui/FullPageLoader'
import LoginPrompt from '../components/LoginPrompt'
import { useData } from '../contexts/DataContext'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
function DefaultLayout({children}) {
  const {loading}=useAuth()
  const data=useData()
  const {pathname}=useLocation()

  useEffect(()=>{
      data._scrollToSection('top',true);
  },[pathname])

  if(loading) {
    return <FullPageLoader/>
  }

  return (
   <>
      <LoginPrompt/>
      <div id={'top'} className="min-h-screen bg-[#F7F7FB] text-gray-900">
         {children}
      </div> 
   </>
  )
}

export default DefaultLayout