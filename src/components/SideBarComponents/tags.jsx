import React from 'react'

export default function SideBarTags({children}) {
  return children
}

SideBarTags.title=({title})=>{
     return <h2 className="text-[20px] font-medium mb-2">{title}</h2>
}