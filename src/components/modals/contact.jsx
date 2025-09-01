import React from 'react'
import { useData } from '../../contexts/DataContext'
import rightImage from '../../assets/images/contact-1.jpg'
import { t } from 'i18next'

export default function Contact() {
  const data=useData()
  return (
    
    <div className={`w-full ${!data.showContact ? 'opacity-0 pointer-events-none':''} fixed h-[100vh] bg-gray-700 z-50 flex justify-center items-center`}>
              
              <div className={`flex ease-in duration-75 transition-all ${!data.showContact ? ' translate-y-[100px]':''} max-sm:w-[80%] w-[500px] bg-white rounded-[0.4rem] overflow-hidden relative`}>
                

                      <div className="p-5">
                             <h2 className="font-bold text-[25px]">{t('common.get-in-touch')}</h2>
                             <p className="w-[300px] text-gray-600 mb-5">
                                {t('common.have-question')}
                             </p>
                             <div className="flex mb-3">
                              
                                 <svg className="mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.582.413 3.126 1.198 4.488L3 21.116l4.759-1.249a8.981 8.981 0 0 0 4.29 1.093h.004c4.947 0 8.975-4.027 8.977-8.977a8.926 8.926 0 0 0-2.627-6.35m-6.35 13.812h-.003a7.446 7.446 0 0 1-3.798-1.041l-.272-.162-2.824.741.753-2.753-.177-.282a7.448 7.448 0 0 1-1.141-3.971c.002-4.114 3.349-7.461 7.465-7.461a7.413 7.413 0 0 1 5.275 2.188 7.42 7.42 0 0 1 2.183 5.279c-.002 4.114-3.349 7.462-7.461 7.462m4.093-5.589c-.225-.113-1.327-.655-1.533-.73-.205-.075-.354-.112-.504.112s-.58.729-.711.879-.262.168-.486.056-.947-.349-1.804-1.113c-.667-.595-1.117-1.329-1.248-1.554s-.014-.346.099-.458c.101-.1.224-.262.336-.393.112-.131.149-.224.224-.374s.038-.281-.019-.393c-.056-.113-.505-1.217-.692-1.666-.181-.435-.366-.377-.504-.383a9.65 9.65 0 0 0-.429-.008.826.826 0 0 0-.599.28c-.206.225-.785.767-.785 1.871s.804 2.171.916 2.321c.112.15 1.582 2.415 3.832 3.387.536.231.954.369 1.279.473.537.171 1.026.146 1.413.089.431-.064 1.327-.542 1.514-1.066.187-.524.187-.973.131-1.067-.056-.094-.207-.151-.43-.263"/></svg>
                                 <a target="_blank" href="https://wa.me/258856462304">+258 856462304</a>
                             </div>

                             <div className="flex">
                                 <svg className="mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 4H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2zm0 2v.511l-8 6.223-8-6.222V6h16zM4 18V9.044l7.386 5.745a.994.994 0 0 0 1.228 0L20 9.044 20.002 18H4z"/></svg>
                                 <a target="_blank" href="mailto:team@derflash.com">team@derflash.com</a>
                             </div>

                      </div>

                      <div  className="flex-1 max-sm:hidden">
                            <img src={rightImage}/>
                      </div>

                      <div onClick={()=>{
                            data.setShowContact(false)
                       }} className="w-[30px] absolute cursor-pointer h-[30px] z-50 right-2 top-2 shadow rounded-full bg-white flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" height="15px" viewBox="0 -960 960 960" className="fill-gray-700"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                      </div>

              </div>
    </div>
  )
}
