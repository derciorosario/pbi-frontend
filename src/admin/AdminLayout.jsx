import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from '../assets/logo-icon.png'
import { useAuth } from "../contexts/AuthContext";
import FullPageLoader from "../components/ui/FullPageLoader";
import { useEffect } from "react";


const nav = [
  { to: "/admin", label: "Dashboard", icon: "grid" },
  { to: "/admin/users", label: "User Management", icon: "users" },
  { to: "/admin/content-moderation", label: "Content Moderation", icon: "flag" },
  { to: "/admin/notification", label: "Notifications", icon: "bell" },
];

const I = {
  logo: () => (
    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 21V8H4l8-6 8 6h-5v13z" />
    </svg>
  ),
  grid: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />
    </svg>
  ),
  users: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM2 20a6 6 0 0 1 12 0v1H2Z" />
    </svg>
  ),
  flag: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 3h12l-1.5 4H20l-2 6H8l-1.5-4H4z" />
      <path d="M4 3v18" />
    </svg>
  ),
  chart: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 20h18v2H3z" />
      <path d="M7 18V8h3v10H7zm7 0V4h3v14h-3zM12 18v-6h3v6h-3z" />
    </svg>
  ),
  gear: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="m12 2 2 2 3-1 2 3-2 2 1 3-3 2v3l-3 1-2-2-3 1-2-3 2-2-1-3 3-2V6z" />
      <circle cx="12" cy="12" r="3" fill="#fff" />
    </svg>
  ),
  bell: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22ZM18 16v-5a6 6 0 1 0-12 0v5l-1.8 1.8A1 1 0 0 0 5 20h14a1 1 0 0 0 .8-1.6Z" />
    </svg>
  ),
  search: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-3.5-3.5" />
    </svg>
  ),
};

export default function AdminLayout() {
    const {user,loading} = useAuth()
    const {pathname} = useNavigate()
    const navigate=useNavigate()

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

     
     if((loading || user?.accountType!="admin")){
          return <FullPageLoader/>
     }

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
            <div className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 bg-white">
              <I.search />
              <input className="outline-none text-sm w-64" placeholder="Search users..." />
            </div>
            <button className="h-9 w-9 rounded-full bg-gray-100 grid place-items-center">AU</button>
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
                    isActive
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                {React.createElement(I[n.icon])}
                {n.label}
              </NavLink>
            ))}
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9 lg:col-span-10">

          <Outlet /> 

        </main>
      </div>
    </div>
  );
}
