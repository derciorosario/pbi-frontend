import React, { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Logo from '../assets/logo-icon.png'
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";
import ConfirmDialog from "../components/ConfirmDialog";
import { getUnreadSupportsCount, getUnreadContactsCount } from "../api/admin";


const nav = [
    { to: "/admin", label: "Dashboard", icon: "grid" },
    { to: "/admin/users", label: "User Management", icon: "users" },
    { to: "/admin/contacts", label: "Contact Management", icon: "mail" },
    { to: "/admin/supports", label: "Support Management", icon: "help" },
    { to: "/admin/content-moderation", label: "Content Moderation", icon: "flag" },
  //  { to: "/admin/notification", label: "Notifications", icon: "bell" },
];

const I = {
  logo: () => (
    <svg className="h-5 w-5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21V8H4l8-6 8 6h-5v13z" />
    </svg>
  ),
  grid: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  ),
  users: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM2 20a6 6 0 0 1 12 0v1H2Z" />
    </svg>
  ),
  flag: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3h12l-1.5 4H20l-2 6H8l-1.5-4H4z" />
      <path d="M4 3v18" />
    </svg>
  ),
  chart: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 20h18v2H3z" />
      <path d="M7 18V8h3v10H7zm7 0V4h3v14h-3zM12 18v-6h3v6h-3z" />
    </svg>
  ),
  gear: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="m12 2 2 2 3-1 2 3-2 2 1 3-3 2v3l-3 1-2-2-3 1-2-3 2-2-1-3 3-2V6z" />
      <circle cx="12" cy="12" r="3" fill="#fff" />
    </svg>
  ),
  bell: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z" />
    </svg>
  ),
  search: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-3.5-3.5" />
    </svg>
  ),
  mail: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  ),
  help: () => (
    <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>
  ),
};

export default function AdminLayout() {
     const {user,loading, signOut} = useAuth()
     const {pathname} = useLocation()
     const navigate=useNavigate()
     const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
     const [unreadSupportsCount, setUnreadSupportsCount] = useState(0)
     const [unreadContactsCount, setUnreadContactsCount] = useState(0)

     const nav = [
       { to: "/admin", label: "Dashboard", icon: "grid" },
       { to: "/admin/users", label: "User Management", icon: "users" },
       { to: "/admin/contacts", label: "Contact Management", icon: "mail", badge: unreadContactsCount },
       { to: "/admin/supports", label: "Support Management", icon: "help", badge: unreadSupportsCount },
       { to: "/admin/notification-center", label: "Notification Center", icon: "bell" },
       { to: "/admin/content-moderation", label: "Content Moderation", icon: "flag" },
     //  { to: "/admin/notification", label: "Notifications", icon: "bell" },
     ];

     // Function to refresh unread counts
     const refreshUnreadSupportsCount = async () => {
       try {
         const response = await getUnreadSupportsCount();
         setUnreadSupportsCount(response.data.count || 0);
       } catch (error) {
         console.error("Error fetching unread supports count:", error);
       }
     };

     const refreshUnreadContactsCount = async () => {
       try {
         const response = await getUnreadContactsCount();
         setUnreadContactsCount(response.data.count || 0);
       } catch (error) {
         console.error("Error fetching unread contacts count:", error);
       }
     };

   useEffect(()=>{
     if(user?.accountType!="admin" && user){
        navigate('/login')
     }
   },[user])

    useEffect(()=>{
         if(!loading && !user){
            navigate('/login')
         }
      },[user])

     // Fetch unread counts
     useEffect(() => {
       const fetchUnreadCounts = async () => {
         try {
           const [supportsResponse, contactsResponse] = await Promise.all([
             getUnreadSupportsCount(),
             getUnreadContactsCount()
           ]);
           setUnreadSupportsCount(supportsResponse.data.count || 0);
           setUnreadContactsCount(contactsResponse.data.count || 0);
         } catch (error) {
           console.error("Error fetching unread counts:", error);
         }
       };

       if (user?.accountType === "admin") {
         fetchUnreadCounts();
         // Refresh counts every 30 seconds
         const interval = setInterval(fetchUnreadCounts, 30000);
         return () => clearInterval(interval);
       }
     }, [user]);

     // Expose refreshUnreadCount functions to window for AdminSupports and AdminContacts to call
     useEffect(() => {
       window.refreshUnreadSupportsCount = refreshUnreadSupportsCount;
       window.refreshUnreadContactsCount = refreshUnreadContactsCount;
       return () => {
         delete window.refreshUnreadSupportsCount;
         delete window.refreshUnreadContactsCount;
       };
     }, []);

     
     if((loading || user?.accountType!="admin")){
          return <FullPageLoader/>
     }

     console.log({pathname})

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-gray-900">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="h-14 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2">
            <img src={Logo} width={30}/>
            <div className="leading-tight">
              <div className="font-semibold">54Links Admin</div>
              <div className="text-[11px] text-gray-500 -mt-0.5">Dashboard</div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {/**<div className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 bg-white">
              <I.search />
              <input className="outline-none text-sm w-64" placeholder="Search users..." />
            </div> */}
            <button
              onClick={() => setLogoutDialogOpen(true)}
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Body with Sidebar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-2">
            {nav.map((n) => (
               <NavLink
                 key={n.label}
                 to={n.to}
                 className={({ isActive }) =>
                   `flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 ${
                     pathname==n.to
                       ? "bg-brand-50 text-brand-700 font-semibold"
                       : "text-gray-700 hover:bg-gray-50"
                   }`
                 }
               >
                 {React.createElement(I[n.icon])}
                 {n.label}
                 {n.badge > 0 && (
                   <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-auto">
                     {n.badge}
                   </span>
                 )}
               </NavLink>
             ))}
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9 lg:col-span-10">

          <Outlet /> 

        </main>
      </div>

      <ConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        title="Logout Confirmation"
        text="Are you sure you want to logout? You will be redirected to the login page."
        confirmText="Logout"
        cancelText="Cancel"
        tone="danger"
        onConfirm={signOut}
      />
    </div>
  );
}
