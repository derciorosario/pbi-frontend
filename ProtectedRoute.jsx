import React from 'react';
import { Navigate, useLocation} from 'react-router-dom';
import toast from 'react-hot-toast';
import Preloader from './components/loaders/preloader';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children, redirectTo = '/', path }) => {
  const { isAuthenticated, user, loading, token, logout } = useAuth();

  if(redirectTo=="/logout" && token && user){
        logout() 
        toast.remove()
        toast.success('Logout successfuly!')
        return <Navigate to={'/login'} replace />
  }

  if (loading) {

      return <Preloader showAnyway={true}/>;

  }else if(!user && !loading){
      return <Navigate to={'/login'} replace />
  }else{

     return isAuthenticated ? children : <Navigate to={redirectTo} replace />;
  }
};


export default ProtectedRoute;



