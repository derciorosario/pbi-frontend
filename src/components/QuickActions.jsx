import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";

export default function QuickActions({ title = "Quick Actions", items = [] }) {
  const { user } = useAuth();
  const data=useData()

  return (
    <>
      <div
        className={`rounded-2xl  bg-white border border-gray-100 shadow-soft p-4`}
      >
        <h3 className="font-semibold text-brand-600">{title}</h3>
        <ul className="mt-3 space-y-2 text-sm text-gray-700 _login_prompt">
          {items.filter(i=>!i.hide && (i.label!="Edit Profile" && !user)).map(({ label, Icon, onClick, disabled }, idx) => (
            <li key={idx}>
              <button
                type="button" 
                onClick={()=>{
                   if(user){
                    onClick()
                   }else{
                    data._showPopUp("login_prompt");
                   }
                }}
                disabled={disabled}
                className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-brand-50 hover:text-brand-600 transition-colors ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {Icon ? <Icon size={16} className="text-brand-500" /> : null}
                <span>{label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
