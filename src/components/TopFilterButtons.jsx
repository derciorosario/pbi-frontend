import React from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
export default function TopFilterButtons({buttons=[],selected=[],setSelected,from}) {
 const data=useData()
 const {user}=useAuth()
  return (
     <div className="flex relative gap-y-2 w-full overflow-x-auto rounded-sm whitespace-nowrap py-2 _sticky z-20 _bg-[#F7F7FB]">
              {buttons.map((i,_i)=>(
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
                       className={`table px-3 py-1.5  text-sm font-medium ${!selected.includes(i) ? '  text-gray-700 hover:border-brand-300 ':'text-brand-600 font-bold  active:bg-brand-800'} ${_i === 0 ? 'border-r' : _i === buttons.length - 1 ? 'border-l' : 'border-x'} border-gray-200 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md flex-shrink-0`}
                     >
                       <span>{i}</span>
                     </button>
              ))}
     </div>
  )
}    
