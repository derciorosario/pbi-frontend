import React from 'react';
import styles from '../lib/styles.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import EasyAccess from "./EasyAccess";


function ProfileCard() {
     const {user,profile} = useAuth()

     // Check if user has organization membership
     const hasOrganization = user?.organizationId && user?.organization;

   return (
    <>
     <div className={`rounded-2xl bg-white hidden border p-4 shadow-sm ${!Boolean(user) ? 'hidden':''}`}>
       <div className="flex items-center gap-3">
         <img
           src={profile?.avatarUrl || user?.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp&s=200'}
           alt=""
           className="h-12 w-12 rounded-full"
         />
         <div className="flex-1">
           <div className="font-semibold">{user?.name}</div>
           <div className="text-xs text-gray-500">{profile?.primaryIdentity}<br/>{user?.city} {user?.city && (user?.country || user?.countryOfResidence) ? `,`:''} {(user?.country || user?.countryOfResidence)}</div>

           {/* Organization Badge */}
           {hasOrganization && (
             <div className="flex items-center gap-2 mt-1">
               <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                 {user.organization.avatarUrl ? (
                   <img
                     src={user.organization.avatarUrl}
                     alt={user.organization.name}
                     className="w-4 h-4 rounded-full object-cover"
                   />
                 ) : (
                   <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center">
                     <span className="text-xs text-blue-700 font-medium">
                       {user.organization.name.charAt(0).toUpperCase()}
                     </span>
                   </div>
                 )}
                 <span className="text-xs text-blue-700 font-medium truncate max-w-24">
                   {user.organization.name}
                 </span>
               </div>
               {user?.organizationRole && (
                 <span className="text-xs text-gray-500">• {user.organizationRole}</span>
               )}
             </div>
           )}
         </div>
       </div>
      <div className="mt-4 grid grid-cols-2 bg-gray-50 rounded-xl text-center text-sm">
       
        <div className="p-3 border-r">
          <div className="text-xs text-gray-500">Connections</div>
          <div className="font-semibold">1</div>
        </div>
        <div className="p-3">
          <div className="text-xs text-gray-500">Posts</div>
          <div className="font-semibold"></div>
        </div>
      </div>
      <button className={`mt-4 ${styles.primaryWide} flex items-center justify-center`}>
        <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#clip0_294_101)">
            <path d="M9.96875 3.3125C10.325 3.09375 10.5625 2.69687 10.5625 2.25C10.5625 1.55937 10.0031 1 9.3125 1C8.62187 1 8.0625 1.55937 8.0625 2.25C8.0625 2.7 8.3 3.09375 8.65625 3.3125L6.86562 6.89375C6.58125 7.4625 5.84375 7.625 5.34688 7.22813L2.5625 5C2.71875 4.79063 2.8125 4.53125 2.8125 4.25C2.8125 3.55938 2.25312 3 1.5625 3C0.871875 3 0.3125 3.55938 0.3125 4.25C0.3125 4.94062 0.871875 5.5 1.5625 5.5C1.56875 5.5 1.57812 5.5 1.58438 5.5L3.0125 13.3562C3.18438 14.3062 4.0125 15 4.98125 15H13.6438C14.6094 15 15.4375 14.3094 15.6125 13.3562L17.0406 5.5C17.0469 5.5 17.0562 5.5 17.0625 5.5C17.7531 5.5 18.3125 4.94062 18.3125 4.25C18.3125 3.55938 17.7531 3 17.0625 3C16.3719 3 15.8125 3.55938 15.8125 4.25C15.8125 4.53125 15.9062 4.79063 16.0625 5L13.2781 7.22813C12.7812 7.625 12.0437 7.4625 11.7594 6.89375L9.96875 3.3125Z" fill="white"/>
          </g>
          <defs>
            <clipPath id="clip0_294_101">
              <path d="M0.3125 0H18.3125V16H0.3125V0Z" fill="white"/>
            </clipPath>
          </defs>
        </svg>
        <span className="ml-1">Boost Your Profile</span>
      </button>
    </div>
     <EasyAccess/>
   </>
    
   
  );
}

export default ProfileCard;