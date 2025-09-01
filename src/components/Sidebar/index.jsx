import React from 'react'
import { useData } from '../../contexts/DataContext'
import AboutUs from '../SideBarComponents/about-us'
import Products from '../SideBarComponents/products'

export default function Sidebar() {


  const data=useData()

  
  return (
    <div className={`${!data.selectedSidePage ? 'opacity-0 pointer-events-none':''}  max-sm:translate-y-[100px] bg-[rgba(0,0,0,0.9)] fixed right-0 top-0 h-[100vh] z-10 w-[100%] flex justify-end`}>

        <div onClick={()=>{
            data.setSelectedSidePage(null)
        }} className="flex-1"></div>

        <div className={`delay-75 ease-in transition-all max-sm:w-full w-[400px] bg-gray-200 h-full pt-[120px] max-sm:pt-[60px] px-8 relative ${!data.selectedSidePage ? 'sm:translate-x-[100%] max-sm:translate-y-[100%]':''}`}>

                <div onClick={()=>{
                    data.setSelectedSidePage(null)
                }} className="w-[30px] max-sm:hidden absolute cursor-pointer h-[30px] z-50 -left-[15px] top-[50%] translate-y-[50%] shadow border border-gray-300 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" className="fill-gray-700"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </div>

                 
               {data.selectedSidePage=="about-us" && <AboutUs/>}
               {data.selectedSidePage=="products" && <Products/>}

               
        </div>
    </div>
  )
}
