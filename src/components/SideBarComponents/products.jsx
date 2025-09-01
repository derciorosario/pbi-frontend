import React, { useEffect, useState } from 'react'
import SideBarTags from './tags'
import i18next, { t } from 'i18next'
import proContaImg from '../../assets/images/proconta-1.png'

export default function Products() {

  useEffect(()=>{

  },[i18next.language])

  let products=[
     {name:'VIERP',text:'vierp-text',link:'https://vierp.visum.co.mz/'},
     {name:'VLMS',text:'vlms-text',link:'https://vlms.visum.co.mz/'},
     {name:'ProConta',text:'proconta-text',icon:proContaImg,link:'https://proconta.alinvest-group.com/'},
     {name:'ARS BETA',text:'arsbeta-text',link:'https://arsbeta-mz.com/'},
  ]

  return (
    <div className="h-[100%] overflow-hidden max-sm:pb-[120px]">

        <SideBarTags.title title={t('menu.products')}/>

        <div className="flex-1 h-[90%] overflow-auto">

            {products.map(i=>(
              <div href={i.link} target="_blank" className="w-full flex flex-col border-b-gray-400 mb-3 border-b py-2">
                     <div className="flex items-center justify-between mb-2">
                         <h3 className="font-medium">{i.name}</h3>
                         <a href={i.link}>
                              <svg xmlns="http://www.w3.org/2000/svg" height="19" viewBox="0 0 24 24"><path d="m13 3 3.293 3.293-7 7 1.414 1.414 7-7L21 11V3z"/><path d="M19 19H5V5h7l-2-2H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2v-5l-2-2v7z"/></svg>
                         </a>
                     </div>
                     <span className="text-gray-600">{t('products.'+i.text)}</span>
              </div>
            ))}

        </div>
    </div>
  )
}
