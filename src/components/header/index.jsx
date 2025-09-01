import React,{useState,useEffect} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useTranslation } from 'react-i18next';
import i18next, { t } from 'i18next'
import LogoWhite1 from '../../assets/images/logos/lg-white-1.png'

function Header({}) {

  const {pathname} = useLocation()
  const data=useData()
  const [menu,setMenu]=useState([])

  useEffect(()=>{
    setMenu([
        {name:t('menu.about-us'),path:'/?about',field:'about-us'},
        {name:t('menu.products'),path:'/?products',field:'products'},
     ])
  },[i18next.language])

 
  return (
   <header id="header" className={`w-full fixed max-sm:flex-col  top-0 left-0 z-50 flex items-center px-5 justify-between`}>
         <div className="py-5 flex items-center cursor-pointer" onClick={()=>{
            data.setShowContact(false)
            data.setSelectedSidePage(null)
         }}>
         <img width={30} src={LogoWhite1}/>
         <h1 className={`transition-all ease-in duration-75 delay-100 text-[22px] ml-2`}>
             <span className={`text-white max-sm:hidden ${data.selectedSidePage ? 'opacity-0 pointer-events-none':''}`}>DERFLASH</span>
             <span className="sm:hidden text-white">DERFLASH</span>
        </h1>
       </div>

       <nav className={`${data.showContact ? 'opacity-0 pointer-events-none':''} flex items-center justify-between px-2 py-2 bg-white rounded-[0.3rem]`}>
          
           {menu.map(i=>(

                <div onClick={()=>{
                  data.setSelectedSidePage(i.field)
                }} className="mx-2 max-md:text-[14px] py-1 cursor-pointer hover:opacity-50 delay-75">
                  <span className={`${data.selectedSidePage==i.field ? 'font-bold':''}`}>{i.name}</span> 
                </div>

           ))}

           <button onClick={()=>{
               data.setShowContact(true)
           }} className="rounded-[0.3rem] bg-black py-1 text-white px-3">
               {t('menu.contact')}
           </button>
       </nav>
   </header>
  )
}

export default Header