import React, { useState, useEffect } from "react";

// Icons for expand/collapse
const Icons = {
  caret: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  ),
  caretUp: () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 14l5-5 5 5z" />
    </svg>
  ),
};

/**
 * MultiSelect Component with Expand/Collapse and Counter
 * A reusable component for multi-select checkboxes with expand/collapse functionality
 *
 * @param {Object} props
 * @param {string} props.label - The label for the multi-select
 * @param {string} props.value - Comma-separated string of selected values
 * @param {Function} props.onChange - Function to call when selection changes
 * @param {Array} props.options - Array of options to display
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.collapsible - Whether to show expand/collapse functionality
 * @param {number} props.maxVisible - Maximum options to show when collapsed
 */
function MultiSelect({
  label,
  value = "",
  onChange,
  options = [],
  className = "",
  column,
  hide,
  _hide,
  collapsible = true,
  maxVisible = 3
}) {
  // Parse the comma-separated string into an array
  const selectedValues = value ? value.split(',') : [];

  // Initialize title checkbox based on whether all options are selected
  const allSelected = options.length > 0 && selectedValues.length === options.length;
  const [titleChecked, setTitleChecked] = useState(allSelected);

  // Expand/collapse state - start expanded to show all options
  const [isExpanded, setIsExpanded] = useState(true);

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

  // Count selected items
  const selectedCount = selectedValues.length;

  // Count pill component
  const CountPill = ({ count }) =>
    count > 0 ? (
      <span className="ml-2 inline-flex items-center rounded-full border border-gray-200 bg-brand-50 px-1.5 py-0.5 text-[10px] leading-none text-brand-600">
        {count}
      </span>
    ) : null;

  // Determine which options to show
  const shouldShowToggle = collapsible && options.length > 0;
  const visibleOptions = isExpanded ? options : [];
  const hiddenCount = isExpanded ? 0 : options.length;

  return (
    <div className={`mt-3 ${className} ${hide ? 'hidden':''}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={titleChecked}
            onChange={(e) => handleTitleCheckboxChange(e.target.checked)}
            className="h-4 w-4 accent-brand-600 hidden"
          />
          <label className="text-xs text-gray-500 block">{label}</label>
          <CountPill count={selectedCount} />
        </div>

        {shouldShowToggle && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <span>Collapse</span>
                <Icons.caretUp />
              </>
            ) : (
              <>
                <span>Expand</span>
                <Icons.caret />
              </>
            )}
          </button>
        )}
      </div>

      <div className={`mt-1 rounded-xl border border-gray-200 bg-white ${isExpanded ? 'p-3' : 'p-1'}`}>
        {visibleOptions.length > 0 ? (
          <div className={`grid grid-cols-${column || 1} gap-2`}>
            {visibleOptions.map((option) => {
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
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            {hiddenCount} options hidden
          </div>
        )}

      </div>
    </div>
  );
}

export default MultiSelect;