
import React, { useEffect,useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const FormLayout = ({title,children,titleSection}) => {
 
    

         
  return (
    <div className="flex flex-col">
       {titleSection}
       <div className="border overflow-hidden rounded-[0.3rem] mt-10 mb-10 table relative min-h-[200px] pb-10">
              <span className="flex h-[3px] bg-gray-300 top-0 left-0"></span>
              <div className="px-3">
                    <span className="flex border-b py-2">{title}</span>
              </div>
              <div className="p-3">
                    {children}
              </div>
       </div> 
    </div>
  )
}

FormLayout.Input = ({onChange,value,label,options,select,disabled}) => {      
    return (
                 
        <div className="flex flex-col max-md:mb-4">
            <span className={`text-[14px] ${disabled ? 'opacity-50':''}  mb-1 flex`}>{label}</span>
            {select ? <>
                      <select onChange={onChange} className="border min-w-[270px] px-1 py-1 h-[35px] rounded-[0.3rem] mr-2" value={value}>
                            <option value="" disabled selected>Selecione {label}</option>
                            {options.map(i=>(
                                <option selected={value==i} value={i}>{i}</option>
                            ))}
                      </select>
            </> : <>
                     <input disabled={Boolean(disabled)} className={`border px-2 min-w-[270px] h-[35px] py-1 rounded-[0.3rem] mr-2 ${disabled ? 'opacity-50':''}`} onChange={onChange} value={disabled ? '':value}/>
            </>}
        </div>
    )
}

FormLayout.InputBox = ({children}) => {      
    return (     
        <div className="flex max-md:flex-col m-3">
           {children}
        </div>
    )
}





FormLayout.SendButton = ({done,v,onClick}) => {
       
    const { t, i18n } = useTranslation();
    const {pathname} = useLocation()

    const [buttonText,setButtonText]= useState('')
    const [confimBTN,setConfirmBTN]= useState(false)
    useEffect(()=>{
        let confim=false
        if(pathname.replaceAll('/','')=="ticketsbuystep-1"){
            setButtonText(t('common.keep-on-paying'))
        }else if(pathname.replaceAll('/','')=="ticketsbuystep-2" || pathname.replaceAll('/','')=="expositorstep-3" || pathname.replaceAll('/','')=="speakerstep-2"){
            setButtonText(t('common.confirm'))
            confim=true
        }
        if(pathname.replaceAll('/','')=="expositorstep-1" || pathname.replaceAll('/','')=="expositorstep-2" || pathname.replaceAll('/','')=="speakerstep-1"){
            setButtonText(t('common.continue'))
        }

        setConfirmBTN(confim)
    },[pathname,i18n.language])

   


    


    return (
            <button onClick={onClick} className={` ${v ? 'hover:opacity-70':' bg-gray-300 cursor-not-allowed'} ${v && confimBTN ? ' bg-green-500' : v ? 'bg-app_primary-400':''}  text-white  mt-[20px] px-3 py-2 rounded-[0.3rem]`}>{buttonText}</button>
    )
}

export default FormLayout

