"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type SearchComboboxOption = {
  value: string;
  label: string;
};

type SearchComboboxProps = {
  id: string;
  label: string;
  placeholder: string;
  options: SearchComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyText?: string;
};

export default function SearchCombobox({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  emptyText = "لا توجد نتائج مطابقة",
}: SearchComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedOption?.label ?? "");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery),
      )
    : options;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const handleSelect = (option: SearchComboboxOption) => {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        aria-autocomplete="list"
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          if (value) {
            onChange("");
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className="w-full bg-white border border-[#dcc1bb] hover:border-[#89726d] text-[#1e1b18] rounded-[4px] py-4 pl-10 pr-12 font-noto-sans-arabic focus:outline-none focus:ring-1 focus:ring-[#812f1d] focus:border-[#812f1d] transition-all shadow-sm disabled:cursor-not-allowed disabled:bg-[#f5ece7] disabled:text-[#89726d]"
      />
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-[#89726d]">
        <ChevronDown className="w-5 h-5" />
      </div>

      {isOpen && !disabled && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-[4px] border border-[#dcc1bb] bg-white py-2 shadow-xl"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm font-noto-sans-arabic text-[#89726d]">
              {emptyText}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option)}
                className="w-full px-4 py-3 text-right font-noto-sans-arabic text-[#1e1b18] transition-colors hover:bg-[#fbf2ed] aria-selected:bg-[#f5ece7] aria-selected:font-semibold"
              >
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
