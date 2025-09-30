import React, { useState, useRef, useEffect } from 'react';

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  label,
  sublabel,
  error,
  disabled = false,
  multiple = false,
  selectedValues = [],
  onMultipleChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const handleSelect = (option) => {
    if (multiple) {
      if (!selectedValues.includes(option)) {
        onMultipleChange([...selectedValues, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  const handleRemove = (optionToRemove) => {
    if (multiple) {
      onMultipleChange(selectedValues.filter(value => value !== optionToRemove));
    }
  };

  const handleClear = () => {
    if (multiple) {
      onMultipleChange([]);
    } else {
      onChange('');
    }
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const getDisplayValue = () => {
    if (multiple) {
      return selectedValues.length > 0
        ? `${selectedValues.length} selected`
        : placeholder;
    }
    return value || placeholder;
  };

  const hasValue = () => {
    if (multiple) {
      return selectedValues.length > 0;
    }
    return Boolean(value);
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {sublabel && <span className="text-gray-400 font-normal">({sublabel})</span>}
        </label>
      )}

      <div className="relative" ref={selectRef}>
        {/* Selected values display (for multiple) */}
        {multiple && selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {selectedValues.map((selectedValue) => (
              <span
                key={selectedValue}
                className="inline-flex items-center gap-1 px-2 py-1 bg-brand-100 text-brand-800 rounded-md text-sm"
              >
                {selectedValue}
                <button
                  type="button"
                  onClick={() => handleRemove(selectedValue)}
                  className="text-brand-600 hover:text-brand-800"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Main input/select button */}
        <div
          className={`relative w-full rounded-xl border px-4 py-3 text-sm outline-none ring-brand-500 focus:ring-2 bg-white cursor-pointer ${
            error ? "border-red-400 focus:ring-red-400" : "border-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent outline-none cursor-pointer"
            placeholder={getDisplayValue()}
            value={isOpen ? searchTerm : getDisplayValue()}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />

          {/* Clear button and dropdown arrow */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {hasValue() && !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Clear selection"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="pointer-events-none">
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dropdown menu */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {/* Clear All option for multiple selections */}
            {multiple && selectedValues.length > 0 && (
              <div
                className={`px-4 py-2 text-sm cursor-pointer text-red-600 hover:bg-red-50 border-b border-gray-100`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                  setIsOpen(false);
                }}
              >
                Clear All ({selectedValues.length})
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option}
                  className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                    highlightedIndex === index
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${
                    multiple && selectedValues.includes(option)
                      ? 'bg-brand-100 text-brand-800'
                      : ''
                  }`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;