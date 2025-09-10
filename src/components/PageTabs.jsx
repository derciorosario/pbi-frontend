import React from 'react'
import { useData } from '../contexts/DataContext'

export default function PageTabs({view_types,view,setView,loading,page}) {
  return (
     <div className={`flex items-center gap-4 text-sm font-medium text-gray-600 mb-3 ${loading && page=="feed" ? 'hidden':''}`}>
                {view_types.map((t) => (
                  <button
                    key={t}
                    onClick={() => setView(t)}
                    className={`pb-2 relative ${
                      view === t ? 'text-gray-900' : 'hover:text-gray-800'
                    }`}
                  >
                    <span className="capitalize">{t}</span>
                    {view === t && (
                      <span
                        className="absolute left-0 -bottom-[1px] h-[3px] w-full bg-brand-500 rounded-full"
                        
                      />
                    )}
                  </button>
                ))}
    </div>
  )
}
