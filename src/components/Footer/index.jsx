import React,{useEffect,useState} from 'react'
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';

function Footer() {

   
    const [lang,setLang]=useState(localStorage.getItem('lang') ? localStorage.getItem('lang') : 'pt')
    const { t, i18n } = useTranslation();

    const changeLanguage = (lng) => {
            i18n.changeLanguage(lng);
            setLang(lng)
            localStorage.setItem('lang',lng)
    };

    const data=useData()

    return (
    <div className={`${data.selectedSidePage ? 'translate-y-[100%] max-sm:translate-y-[100px]' : ''} max-sm:-translate-y-[40px] duration-100 ease-in delay-75 transition-all absolute left-0 bottom-2 px-4  flex justify-between z-10 w-full`}>

              <div className="text-white text-[12px] translate-y-3 opacity-55">
                 <span className="mr-2">&copy; {new Date().toISOString().split('T')[0].split('-')[0]}</span><span>DERFLASH</span><span className="mx-2 max-sm:hidden">-</span><span className="max-sm:hidden">Exciting Technologies</span>
              </div>

              <div className="flex  mb-3 items-center">
                    
                    <select onChange={(e)=>{
                         changeLanguage(e.target.value)
                    }} value={lang} className="mr-2 bg-transparent border-0 outline-none text-white focus:bg-black">
                          <option value={'pt'} disabled={lang=="pt"}>PT</option>
                          <option value={'en'} disabled={lang=="en"}>EN</option>
                    </select>

                    <a target="_blank" href={'https://pilmoza.kit.com'}>
                      <button className="rounded-[0.3rem] bg-white py-1 text-black px-3">
                          Blog
                      </button>
                    </a>

                  
              </div>
    </div>
  )
}

export default Footer