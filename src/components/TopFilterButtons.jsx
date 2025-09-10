import React from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
export default function TopFilterButtons({buttons=[],selected=[],setSelected,from}) {
 const data=useData()
 const {user}=useAuth()
  return (
     <div className="flex items-center gap-2 w-full flex-wrap _sticky top-[100px] z-20 _bg-[#F7F7FB]">
              {buttons.map(i=>(
                <button
                       onClick={() => {
                          if(selected.includes(i)){
                           
  setSelected([])
                               {/** if((from=="people")){
                                   setSelected([])
                                }else{
                                  setSelected(selected.filter(f=>f!=i))
                                } */}
                          }else{
                             setSelected([i])  
                            {/** if((from=="people")){
                             
                             }else{
                              setSelected([...selected,i])  
                             } */}
                          }
                        data.setUpdateData(Math.random())
                        
                       }}
                       className={`rounded-full px-2.5 py-1.5 text-sm font-medium ${!selected.includes(i) ? ' border-gray-200 border text-gray-700 hover:border-brand-300 ':'text-brand-600 bg-brand-50 active:bg-brand-800'}  flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md`}
                     >
                       <span>{i}</span>
                     </button>
              ))}
     </div>
  )
}
