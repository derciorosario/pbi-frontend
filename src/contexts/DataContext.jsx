import { createContext, useContext,useState,useEffect} from 'react';
const DataContext = createContext();

export const DataProvider = ({ children }) => {

    let initial_popups={
      profile:false,
      login_prompt:false
    }

    const [updateData,setUpdateData]=useState([])

     let not_closing_popups=[
      'support_messages'
    ]
    const [_openPopUps, _setOpenPopUps] = useState(initial_popups);

    function _closeAllPopUps(){
          _setOpenPopUps(initial_popups)
          document.removeEventListener('click', handleOutsideClick)
    }
    function _closeThisPopUp(option){
      _setOpenPopUps({..._openPopUps,[option]:false})
    }

  const _scrollToSection = (to,instant) => {
      const Section = document.getElementById(to);
      console.log({Section})
      if (Section) {
        Section.scrollIntoView({ behavior:instant ? 'instant' :  (to=="home" || to=="about" || to=="move_after_pagination" || to=="contact") ? 'smooth':'instant' });
      }else{
        setTimeout(()=>_scrollToSection(to),2000)
      }
   }

    const handleOutsideClick = (event) => {
   
      let close=true
      Object.keys(initial_popups).forEach(f=>{
          if(event?.target?.closest(`._${f}`))  {
            close=false
          }
      })

      Object.keys(initial_popups).forEach(k=>{
          if(not_closing_popups.includes(k) && _openPopUps[k]){
             close=false
          }
      })
  
      if(close){
        document.removeEventListener('click', handleOutsideClick); 
        _closeAllPopUps()
      }

    };

 
    const  _showPopUp = (option,value) => {
        setTimeout(()=>document.addEventListener('click', handleOutsideClick),200)
        _setOpenPopUps({...initial_popups,[option]:value || true})
    }


    const value = {
      _openPopUps,
       _scrollToSection,
      _closeAllPopUps,
      _showPopUp,
      _closeThisPopUp,
      initial_popups,
      updateData, setUpdateData
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
   return useContext(DataContext);
};