import React, { useState, useEffect } from "react";

/**
 * MultiSelect Component
 * A reusable component for multi-select checkboxes
 *
 * @param {Object} props
 * @param {string} props.label - The label for the multi-select
 * @param {string} props.value - Comma-separated string of selected values
 * @param {Function} props.onChange - Function to call when selection changes
 * @param {Array} props.options - Array of options to display
 * @param {string} props.className - Additional CSS classes
 */
function MultiSelect({ label, value = "", onChange, options = [], className = "", column, hide, _hide }) {
  // Parse the comma-separated string into an array
  const selectedValues = value ? value.split(',') : [];
  
  // Initialize title checkbox based on whether all options are selected
  const allSelected = options.length > 0 && selectedValues.length === options.length;
  const [titleChecked, setTitleChecked] = useState(allSelected);
  
  // Update title checkbox state when options or selection changes
  useEffect(() => {
    // If there are no options, title should be unchecked
    if (options.length === 0) {
      setTitleChecked(false);
      return;
    }
    
    // If all options are selected, title should be checked
    if (selectedValues.length === options.length) {
      setTitleChecked(true);
    }
    // If no options are selected or some are unselected, title should be unchecked
    else {
      setTitleChecked(false);
    }
  }, [selectedValues, options]);
  
  const handleChange = (option, checked) => {
    let newSelectedValues = [...selectedValues];
    
    if (checked) {
      // Add option if checked
      if (!newSelectedValues.includes(option)) {
        newSelectedValues.push(option);
      }
    } else {
      // Remove option if unchecked
      newSelectedValues = newSelectedValues.filter(val => val !== option);
    }
    
    // Join back to comma-separated string or empty string if none selected
    onChange(newSelectedValues.length > 0 ? newSelectedValues.join(',') : '');
  };
  
  // Handle title checkbox change
  const handleTitleCheckboxChange = (checked) => {
    setTitleChecked(checked);
    
    if (checked) {
      // Select all options
      onChange(options.join(','));
    } else {
      // Deselect all options
      onChange('');
    }
  };
  
  return (
    <div className={`mt-3 ${className} ${hide ? 'hidden':''}`}>
      <div className="flex items-center gap-2 mb-1">
        <input
          type="checkbox"
          checked={titleChecked}
          onChange={(e) => handleTitleCheckboxChange(e.target.checked)}
          className="h-4 w-4 accent-brand-600 hidden"
        />
        <label className="text-xs text-gray-500 block">{label}</label>
      </div>
      <div className="mt-1 rounded-xl border border-gray-200 bg-white p-3">
        <div className={`grid grid-cols-${column || 1} gap-2`}>
          {options.map((option) => {
            const isChecked = selectedValues.includes(option);
            
            return (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleChange(option, e.target.checked)}
                  className="h-4 w-4 accent-brand-600"
                />
                {option}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default MultiSelect;