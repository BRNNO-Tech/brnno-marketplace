'use client';
import { useState, useRef, useEffect } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  onSelect?: (value: string) => void;
  disabled?: boolean;
}

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  onSelect,
  disabled = false,
}: AutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(value.toLowerCase())
  ).slice(0, 10); // Limit to 10 results

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    if (onSelect) onSelect(option);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
      setShowDropdown(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredOptions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-3 border rounded-lg ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        autoComplete="off"
      />
      {showDropdown && filteredOptions.length > 0 && value && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === filteredOptions.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

