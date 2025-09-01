import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);
  let env="pro" 


  const [loading,setLoading]=useState(true)
  const [isLoading,setIsLoading]=useState(false)
  const DEV_SERVER_URL = 'https://kaziwani-server.visum.co.mz';
  const APP_BASE_URL = env == "pro" ? "https://kaziwani-server.visum.co.mz":  DEV_SERVER_URL

  function takeToLogin(){
      if(!window.location.href.includes('/login')){
            window.location.href="/login"
      }
   }
    const fetchUserData = async () => {

      if(!localStorage.getItem('token')){
        setLoading(false)
        return
      }

      try {
        let response=await makeRequest({method:'get', url:`api/user`, error: ``,withToken:true},0);
        setUser(response)
        setIsAuthenticated(true)
        setLoading(false)
        return true
      } catch (error) {
        console.log({error})
        console.error('Error fetching user data:', error);
        setIsAuthenticated(false)
        setUser(null)
        setLoading(false)
        return false
      } 
    };

    useEffect(() => {
      fetchUserData()
    }, []);


    const logout=async () => {

      try {
        await localStorage.removeItem('token')
        return { success: true };
      } catch (e) {
        let msg = e.message;
        console.log({msg})
        return { success: false, msg };
      }

    };


    const refreshToken = async (retries) => {

      if(!user) return

      let attempt = 0;
      while (retries === undefined || retries > 0) {
        try {
        
          const response = await axios.post(
            APP_BASE_URL + "/api/refresh-token",
            {refreshToken: localStorage.getItem('refresh-token') }
          );
          if (response.status === 200) {
            localStorage.setItem('token',response.data.accessToken)
            return true
          }
         
        } catch (e) {
          if(e.response?.status==400){
            return false
          }
          console.error("Request failed:", e.message);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempt++;
        if (retries !== undefined) retries--;
      }
      throw new Error("Request failed after maximum retries.");
    };



     async function makeRequest(options={data:{},method:'get',withToken:false},maxRetries = 6, retryDelay = 3000,previous_url) {
      
      let postData=options.data ? options.data : {}
     
      try {
       let response 
       let headers={
        'Content-Type': 'application/json',
       }

       if(options.withToken){
        const storedToken = await localStorage.getItem('token');
         headers['Authorization']=`Bearer ${storedToken}`
         if(!storedToken){
             setIsAuthenticated(false)
         }
       }

       if (options.method.toLowerCase() === 'get' && Object.keys(options.params || {}).length > 0) {
        const queryString = new URLSearchParams(options.params || {}).toString();
        options.url = `${options.url}?${queryString}`;
      } 

      if(previous_url){
         options.url=previous_url
      }
  
       if(options.method=="post") {
            response = await axios.post(`${APP_BASE_URL}/`+options.url,postData,{headers}); 
       }else if(options.method=="delete"){
            response = await axios.delete(`${APP_BASE_URL}/`+options.url,{headers});
       }else{
            response = await axios.get(`${APP_BASE_URL}/`+options.url,{headers});
       }
      
       return response.data;
  
      } catch (error) {
        
        console.error('Error fetching data:', error);

        if(error?.response?.status==403 && error?.response?.data?.access==false){
                toast.error('Accesso restrito')
                setLoading(true)
                setTimeout(()=>{
                  window.location.href="/"
                },2000)
        }

        let tokenJustUpdated=false
       
        if(error?.response?.status==403 && error?.response?.data?.invalid_token==true && localStorage.getItem('token')){
          if(await refreshToken() && localStorage.getItem('refresh-token')){
            tokenJustUpdated=true
          }else{
              toast.error('Sessão expirou!')
              localStorage.removeItem('token')
              setLoading(true)
              setTimeout(()=>{
                takeToLogin()
              },2000)
          }
        }

        if (maxRetries > 0 || tokenJustUpdated) {
              await new Promise(resolve => setTimeout(resolve, retryDelay)); 
              return makeRequest(options, maxRetries - 1, retryDelay,options.url); 
        } else {
              throw error; 
        } 
      }
  }
  

    return (
      <AuthContext.Provider value={{isLoading,setIsLoading,APP_BASE_URL,setUser,user,fetchUserData, makeRequest,isAuthenticated, setIsAuthenticated,logout,makeRequest,loading}}>
          {children}
      </AuthContext.Provider>
    )

};

export const useAuth = () => useContext(AuthContext);


