import React,{useState} from 'react'
import { useAuth } from '../contexts/AuthContext'
import FullPageLoader from '../components/ui/FullPageLoader'
import LoginPrompt from '../components/LoginPrompt'
function DefaultLayout({children}) {
  const {loading}=useAuth()

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