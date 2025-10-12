import React, { useState, useRef, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'

export default function TopFilterButtons({buttons=[], selected=[], setSelected, from, buttonLabels={},loading}) {
  const data=useData()
  const {user}=useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreMenuRef = useRef(null)
  const dropdownRef = useRef(null)
  const [dropdownStyle, setDropdownStyle] = useState({})

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Position dropdown relative to the More button
  useEffect(() => {
    if (moreOpen && moreMenuRef.current) {
      const buttonRect = moreMenuRef.current.getBoundingClientRect()
      const outerRect = moreMenuRef.current.parentElement.parentElement.getBoundingClientRect()
      const buttonLeftRelative = buttonRect.left - outerRect.left
      const dropdownWidth = 224 // w-56
      if (buttonLeftRelative + dropdownWidth > outerRect.width) {
        setDropdownStyle({ right: 0 })
      } else {
        setDropdownStyle({ left: buttonLeftRelative })
      }
    }
  }, [moreOpen])

  // Maximum number of buttons to show before "More"
  const maxVisibleButtons = 3
  const primaryButtons = buttons.slice(0, maxVisibleButtons)
  const moreButtons = buttons.slice(maxVisibleButtons)

  // Check if any moreButtons are selected
  const hasSelectedMoreButton = moreButtons.some(button => selected.includes(button))

  const handleButtonClick = (buttonValue) => {
    if(selected.includes(buttonValue)){
      if((from=="people" || from=="jobs" || from=="products" || from=="services")){
        setSelected([])
        data.setUpdateData(Math.random())
      }else{
        setSelected(selected.filter(f=>f!=buttonValue))
        // Use the name for UI display if available
        data.setFiltersToClear([buttonLabels[buttonValue] || buttonValue])
      }
    }else{
      if((from=="people" || from=="jobs" || from=="products" || from=="services")){
        setSelected([buttonValue])
      }else{
        setSelected([...selected,buttonValue])
      }
    }
  }

  return (
    <div className="relative w-full ">
      <div className="flex gap-2 sticky top-10 w-full rounded-sm whitespace-nowrap py-2 overflow-x-auto">
        {loading ? (
          // Skeleton buttons
          Array.from({ length: 5 }, (_, _i) => (
            <div
              key={`skeleton-${_i}`}
              className="px-5 rounded-full py-1.5 mb-1 bg-gray-200 animate-pulse flex items-center justify-center gap-2 flex-shrink-0"
              style={{ width: '120px', height: '28px' }} // Approximate button size
            >
              <div className="bg-gray-300 rounded w-3/4 h-3"></div>
            </div>
          ))
        ) : (
          primaryButtons.map((i,_i)=>(
            <button
              key={i}
              onClick={() => handleButtonClick(i)}
              className={`px-5 rounded-full py-1.5 mb-1 text-sm font-medium ${!selected.includes(i) ? 'text-gray-700 hover:border-brand-300':'text-brand-600 font-bold shadow-md active:bg-brand-800 bg-brand-50'} border border-gray-200 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md flex-shrink-0`}
            >
              <span>{buttonLabels[i] || i}</span>
            </button>
          ))
        )}

        {/* More button */}
        {moreButtons.length > 0 && !loading && (
          <div className="flex-shrink-0" ref={moreMenuRef}>
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`px-5 rounded-full py-1.5 text-sm font-medium ${moreOpen || hasSelectedMoreButton ? 'text-brand-600 font-bold shadow-md active:bg-brand-800 bg-brand-50':'text-gray-700 hover:border-brand-300'} border border-gray-200 flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md`}
            >
              <span>More</span>
              <svg className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Dropdown positioned outside overflow container */}
      {moreOpen && moreButtons.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-30"
          style={dropdownStyle}
        >
          <div className="max-h-[300px] gap-y-1 flex flex-col overflow-y-auto">
            {moreButtons.map((buttonValue) => (
              <button
                key={buttonValue}
                onClick={() => {
                  handleButtonClick(buttonValue)
                  setMoreOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-md ${selected.includes(buttonValue) ? 'bg-brand-50 text-brand-700' : 'hover:bg-brand-50 hover:text-brand-700 text-gray-700'}`}
              >
                <span>{buttonLabels[buttonValue] || buttonValue}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
