import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import FullPageLoader from '../components/ui/FullPageLoader'
import LoginPrompt from '../components/LoginPrompt'
import BottomLoginBar from '../components/BottomLoginBar'
import { useData } from '../contexts/DataContext'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
function DefaultLayout({children, makePublic = false}) {
  const {loading,user}=useAuth()
  const data=useData()
  const {pathname}=useLocation()
  const navigate=useNavigate()

  useEffect(()=>{
      data._scrollToSection('top',true);
  },[pathname])

  useEffect(()=>{
     if(user && user?.accountType=="admin"){
        navigate('/admin')
     }
  },[user])

  

  if(loading || user?.accountType=="admin") {
    return <FullPageLoader/>
  }

  return (
   <>
      <LoginPrompt/>
      <div id={'top'} className="min-h-screen bg-[#F7F7FB] text-gray-900">
         {children}
      </div>

      <BottomLoginBar user={user} makePublic={makePublic} />
   </>
  )
}

export default DefaultLayout