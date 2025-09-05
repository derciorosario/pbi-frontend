import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import "core-js/stable";
import "regenerator-runtime/runtime";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { DataProvider } from './contexts/DataContext';
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './contexts/AuthContext.jsx';
import ToastProvider from './lib/ToastProvider.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
registerSW()



ReactDOM.createRoot(document.getElementById('root')).render(
 //1097700207306-690d40fdlu7po502ouf72nnql1s1v75l.apps.googleusercontent.com
        <GoogleOAuthProvider clientId="1097700207306-690d40fdlu7po502ouf72nnql1s1v75l.apps.googleusercontent.com">
        <AuthProvider>
            <DataProvider>
                 <ToastProvider />
                 <App />
            </DataProvider>
        </AuthProvider>
        </GoogleOAuthProvider>
)
