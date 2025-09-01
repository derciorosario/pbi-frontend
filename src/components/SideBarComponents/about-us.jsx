import React from 'react'
import SideBarTags from './tags'
import { t } from 'i18next'

export default function AboutUs() {
  return (
    <div>
                
                <SideBarTags.title title={t('menu.about-us')}/>

                 <p>
                    {t('common.about-text')}
                 </p>

                 <p className="mt-6 text-[0.9rem] italic text-gray-500">
                    {t('common.lets-build')}
                 </p>

    </div>
  
    
  )
}
