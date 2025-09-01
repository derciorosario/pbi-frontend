import { createContext, useContext,useState,useEffect} from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
const DataContext = createContext();

export const DataProvider = ({ children }) => {

    const [bgImageLoaded,setBgImageLoaded] = useState(false);
    const [initialized,setInitialized]=useState(false)
    const imageUrls = [];
    const [isPreloaderLoaded, setIsPreloaderLoaded] = useState(false);
    const [imagesLoadedItems, setImagesLoadedItems] = useState([])


    const preloadImage = (url, retries = 0) => {

      const retryDelay = 3000
      const maxRetries = 3; 

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = ()=>{
          if(imagesLoadedItems.length < imageUrls.length) setImagesLoadedItems(prev=>([...prev.filter(i=>i!=url),url]))
          resolve()
        };
        img.onerror = () => {
          if (retries < maxRetries) {
            setTimeout(() => {
              preloadImage(url, retries + 1).then(resolve).catch(reject);
            }, retryDelay);
          } else {
            reject();
          }
        };
      });

    };

    useEffect(() => {
      const loadImages = async () => {
        try {
          await Promise.all(imageUrls.map((url) => preloadImage(url)));
        } catch (error) {
          console.log('Failed to load images:', error);
        }
      };
      loadImages()
    }, []);


    useEffect(()=>{
        if(imagesLoadedItems.length >= imageUrls.length){
          setIsPreloaderLoaded(true)
        }
    },[imagesLoadedItems])


    const initial_form = {};

    let initial_popups={
      feedback:false,
      lang:false,
      basic_popup:false,
      join:false,
      filters:false,
      filter:false,
      confim_message:false
    }

    const {makeRequest,APP_BASE_URL,SERVER_FILE_STORAGE_PATH,isLoading,setIsLoading,user,serverTime,setServerTime,APP_FRONDEND} = useAuth()
    
    const [_loaded,setLoaded]=useState([])
    const [updateTable,setUpdateTable]=useState(null)

    const [_subjects,setSubjets]=useState([])
    const [_teachers,setTeachers]=useState([])
    const [_managers,setManagers]=useState([])
    const [_teachers_list,setTeachersList]=useState([])
    const [_classrooms,setClassRooms]=useState([])
    const [_classrooms_list,setClassRoomsList]=useState([])
    const [_dashboard,setDasboard]=useState([])
    const [_students,setStudents]=useState([])
    const [_holidays,setHolidays]=useState([])
    const [_teacher_attendances,setTeacherAttendances]=useState([])
    const [_teacher_attendances_list,setTeacherAttendancesList]=useState([])
    
    let dbs=[
      {name: 'holidays', update: setHolidays, get: _holidays},
      {name: 'managers', update: setManagers, get: _managers},
      {name: 'subjects', update: setSubjets, get: _subjects},
      {name: 'teachers', update: setTeachers, get: _teachers},
      {name: 'teachers_list', update: setTeachers, get: _teachers_list},
      {name: 'dashboard',update:setDasboard, get:_dashboard},
      {name: 'teacher_attendances',update:setTeacherAttendances, get:_teacher_attendances},
      {name: 'teacher_attendances_list',update:setTeacherAttendancesList, get:_teacher_attendances_list},
      {name: 'classrooms', update:setClassRooms, get:_classrooms},
      {name: 'classrooms_list', update:setClassRoomsList, get:_classrooms_list},
      {name: 'students', update:setStudents, get:_students}
    ]
    
    function handleLoaded(action,item){
      if(Array.isArray(item) && action=="remove"){
        setLoaded((prev)=>prev.filter(i=>!item.includes(i)))
        return
      }
      if(action=='add'){
         setLoaded((prev)=>[...prev.filter(i=>i!=item),item])
      }else{
         setLoaded((prev)=>prev.filter(i=>i!=item))
      }
    }   

    const [form,setForm]=useState(initial_form)

    const [_openPopUps, _setOpenPopUps] = useState(initial_popups);
  
    function _closeAllPopUps(){
          _setOpenPopUps(initial_popups)
          document.removeEventListener('click', handleOutsideClick)
    }
 
    const handleOutsideClick = (event) => {
      let close=true
      Object.keys(initial_popups).forEach(f=>{
          if(event?.target?.closest(`._${f}`))  {
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

    const [selectedSidePage,setSelectedSidePage]=useState(null)
    const [showContact,setShowContact]=useState(false)

  
    const [scrollY, setScrollY] = useState(0);

    const handleScroll = () => {
    setScrollY(window.scrollY)
    };

    useEffect(() => {
      handleScroll()
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }, []);


    const _scrollToSection = (to,instant) => {
      const Section = document.getElementById(to);
      console.log({Section})
      if (Section) {
        Section.scrollIntoView({ behavior:instant ? 'instant' :  (to=="home" || to=="about" || to=="move_after_pagination" || to=="contact") ? 'smooth':'instant' });
      }else{
        setTimeout(()=>_scrollToSection(to),2000)
      }

   }

   function text_l(text,max=50){
    if(text?.length > max){
       text=text.slice(0,max)+"..."
    }
    return text
   }


   function _cn(number){
    return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(typeof "string" ? parseFloat(number) : number)
  }

   function _cn_n(string){
        string=string.toString()
        if (string.startsWith('0')) {
          string = string.replace('0', '');
        }
        return string.replace(/[^0-9]/g, '')
   }

   const [_selectedTableItems,setSelectedTableItems]=useState([])

   const [itemsToDelete,setItemsToDelete]=useState({
     items:[],
     url:null,
     deleteFunction:'default'
   })

   function add_remove_table_item(id){
       if(_selectedTableItems.includes(id)){
          setSelectedTableItems(_selectedTableItems.filter(i=>i!=id))
       }else{
          setSelectedTableItems([..._selectedTableItems,id])
       }
   }


   const [downloadProgress,setDownloadProgress] = useState(0) 

   const handleDownload = (filename) => {
     console.log({filename})
     setDownloadProgress(1)
     const xhr = new XMLHttpRequest();
     
     let url=filename.includes('storage/uploads') ? `${APP_BASE_URL}/api/download/${filename.split('/')[filename.split('/').length - 1]}` :  filename.includes('http://') || filename.includes('https://') ? filename : `${APP_BASE_URL}/api/download/${filename}`

     console.log({url})
     xhr.open('GET', url, true);
     
     xhr.responseType = 'blob'; 
     
     // Track download progress
     xhr.onprogress = (event) => {
         if (event.lengthComputable) {
             const percentComplete = (event.loaded / event.total) * 100;
             console.log(`Download Progress: ${percentComplete.toFixed(2)}%`);
             // Update your progress state if needed
             setDownloadProgress(percentComplete.toFixed(2)); // assuming setDownloadProgress is a state setter
         }
     };
 
     // Handle download completion
     xhr.onload = () => {
         if (xhr.status === 200) {
             const blob = xhr.response;
             const downloadUrl = window.URL.createObjectURL(blob);
 
             const link = document.createElement('a');
             link.href = downloadUrl;
             link.download = filename; // Name of the file for download
             document.body.appendChild(link);
             link.click();
 
             // Clean up
             link.remove();
             window.URL.revokeObjectURL(downloadUrl);
             setDownloadProgress(0); // Reset progress
         } else {
             console.error('Download failed:', xhr.statusText);
             toast.error('Erro ao baixar');
             setDownloadProgress(0)
         }
     };
 
     // Handle errors
     xhr.onerror = () => {
         console.error('Error downloading file:', xhr.statusText);
         toast.error('Erro ao baixar');
         setDownloadProgress(0)
         
     };
 
     // Start the request
     xhr.send();
   };


   async function _get(from, params, wait = true) {
    let items = typeof from === "string" ? [from] : from;
    let _data = {};

    if (wait) {
        for (let f = 0; f < items.length; f++) {
            let selected = dbs.find(i => i.name === items[f]);
            try {
                let response = await makeRequest({
                    params: params?.[items[f]],
                    method: 'get',
                    url: `api/${items[f].replaceAll('_', '-')}`,
                    withToken: true,
                    error: ``
                }, 100);
                handleLoaded('add', items[f]);
                selected.update(response);
                _data[items[f]] = response;
            } catch (e) {
                console.log(items[f]);
                console.log({ e });
                _data[items[f]] = [];
            }
        }
    } else {
        let requests = items.map(async (item) => {
            let selected = dbs.find(i => i.name === item);
            try {
                let response = await makeRequest({
                    params: params?.[item],
                    method: 'get',
                    url: `api/${item.replaceAll('_', '-')}`,
                    withToken: true,
                    error: ``
                }, 100);
                handleLoaded('add', item);
                selected.update(response);
                return { item, response };
            } catch (e) {
                console.log(item);
                console.log({ e });
                return { item, response: [] };
            }
        });

        let results = await Promise.all(requests);
        results.forEach(({ item, response }) => {
            _data[item] = response;
        });
    }

    return _data;
   }
  
   useEffect(()=>{
      setSelectedTableItems([])
   },[updateTable])


    let required_data=[] //

    useEffect(()=>{ 
      if(initialized) return
      handleLoaded('remove',required_data)
      _get(required_data,{},false) 
    },[])

    useEffect(()=>{ 
         setInitialized(true)
    },[_loaded])


    function getParamsFromFilters(options){
      let params={}
      options.forEach(o=>{
         if(params[o.param]){
           if(o.selected_ids.length)  {
             params[o.param]=params[o.param]+","+o.selected_ids.join(',')
           }
         }else{
           params[o.param]=o.selected_ids.join(',')
         }
         
      })

      return params
    }


    function today(get_this_day) {
            const currentDate = get_this_day ? get_this_day : new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            return formattedDate
    }
    function time(){
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
      const currentMinute = currentDate.getMinutes();
      const formattedTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      return formattedTime
    }
     const [print_data,setPrintData]=useState({data:[],print:false})

 
    const value = {
      print_data,setPrintData,
      today,
      time,
      _teacher_attendances,
      _teacher_attendances_list,
      _holidays,
      _managers,
      _teachers,
      _teachers_list,
      _students,
      _classrooms_list,
      _subjects,
      _classrooms,
      _dashboard,
      getParamsFromFilters,
      isPreloaderLoaded,
      updateTable,
      setUpdateTable,
      _get,
      handleDownload,
      downloadProgress,setDownloadProgress,
      APP_BASE_URL,
      _selectedTableItems,setSelectedTableItems,
      itemsToDelete,setItemsToDelete,
      add_remove_table_item,
      initial_form,
      initialized,
      handleLoaded,
      _loaded,
      _cn,
      text_l,
      setInitialized,
      form,
      setForm,
      _scrollToSection,
      showContact,
      setShowContact,
      selectedSidePage,
      setSelectedSidePage,
      _showPopUp,
      _closeAllPopUps,
      _openPopUps,
      handleOutsideClick,
      _setOpenPopUps,
      makeRequest,
      bgImageLoaded,
      setBgImageLoaded,
      isLoading,
      setIsLoading,
      scrollY
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
   return useContext(DataContext);
};