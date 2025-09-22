// src/components/TabsAndAdd.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import styles from '../lib/styles';
import I from '../lib/icons';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

function TabsAndAdd({ tabs, activeTab, setActiveTab, items = [], btnClick }) {
  const navigate = useNavigate();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);
  const { user } = useAuth();
  const data = useData();

  const visibleItems = items.filter((i) => !i.hide);

  useEffect(() => {
    function handleClickOutside(event) {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between">
      {/* Tabs */}
      <div className="flex items-center gap-4 text-sm font-medium text-gray-600 hidden">
        {tabs.filter((i) => !i.hide).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2 relative ${
              activeTab === t ? 'text-gray-900' : 'hover:text-gray-800'
            }`}
          >
            {t}
            {activeTab === t && (
              <span
                className="absolute left-0 -bottom-[1px] h-[3px] w-full rounded-full"
                style={{
                  background:
                    'linear-gradient(90deg,#6B21A8 0%,#3730A3 50%,#1E3A8A 100%)',
                }}
              />
            )}
          </button>
        ))}
      </div>
      

      {/* Add Button + Menu */}
      {(user && (visibleItems.length > 0 || btnClick)) && (
        <div className="relative" ref={addMenuRef}>
          {/* Case: Only one item & no btnClick → show direct button */}
          {visibleItems.length === 1 && !btnClick ? (
            (() => {
              const Item = visibleItems[0];
              const IconComp = Item?.Icon;
              return (
                <button
                  onClick={() => {
                    if (user == null) {
                      data._showPopUp('login_prompt');
                      return;
                    }
                    Item?.onClick?.();
                  }}
                  className={`${styles.primary} inline-flex items-center gap-2`}
                  disabled={Item?.disabled}
                >
                  {IconComp ? (
                    <I.plus />
                  ) : (
                    <I.plus />
                  )}
                  {Item?.label}
                </button>
              );
            })()
          ) : (
            <>
              <button
                onClick={() => {
                  if (user == null) {
                    data._showPopUp('login_prompt');
                    return;
                  }
                  setShowAddMenu((prev) => !prev);
                  if (btnClick) btnClick();
                }}
                className={`${styles.primary} inline-flex items-center gap-2 _login_prompt`}
              >
                <I.plus /> Create Post {!btnClick && <ChevronDown className="w-4 h-4" />}
              </button>

              {showAddMenu && visibleItems.length > 0 && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-100 bg-white shadow-lg z-50">
                  <ul className="mt-3 space-y-2 text-sm text-gray-700">
                    {visibleItems.map(({ label, Icon, onClick, disabled }, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={onClick}
                          disabled={disabled}
                          className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-50 ${
                            disabled ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {Icon ? (
                            <Icon
                              size={16}
                              className="text-accent-700 flex-shrink-0"
                            />
                          ) : null}
                          <span>{label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TabsAndAdd;
