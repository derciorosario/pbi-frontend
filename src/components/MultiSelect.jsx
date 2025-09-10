import React from "react";

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
function MultiSelect({ label, value = "", onChange, options = [], className = "",column, hide ,_hide }) {
  // Parse the comma-separated string into an array
  const selectedValues = value ? value.split(',') : [];
  
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
  
  return (
    <div className={`mt-3 ${className} ${hide ? 'hidden':''}`}>
      <label className="text-xs text-gray-500 mb-2 block">{label}</label>
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