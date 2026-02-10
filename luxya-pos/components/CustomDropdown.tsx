'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface DropdownOption {
    label: string
    value: string | number
    icon?: React.ReactNode
}

interface CustomDropdownProps {
    options: DropdownOption[]
    value: string | number
    onChange: (value: any) => void
    label?: string
    placeholder?: string
    disabled?: boolean
    className?: string
}

export default function CustomDropdown({ 
    options, 
    value, 
    onChange, 
    label, 
    placeholder = "Sélectionner...", 
    disabled = false,
    className = ""
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    const selectedOption = options.find(opt => opt.value === value)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (option: DropdownOption) => {
        onChange(option.value)
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className} ${isOpen ? 'z-[1000]' : 'z-10'}`} ref={dropdownRef}>
            {label && (
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-2 ml-2">
                    {label}
                </p>
            )}
            
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all border border-white/20 backdrop-blur-2xl bg-white/[0.12] shadow-lg
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98] hover:bg-white/[0.18] hover:border-shop/50'} 
                    ${isOpen ? 'border-shop/60 ring-4 ring-shop/10 bg-white/[0.2]' : ''}`}
            >
                <div className="flex items-center space-x-2 truncate">
                    {selectedOption?.icon && (
                        <div className="shrink-0 text-shop">{selectedOption.icon}</div>
                    )}
                    <span className="text-[9px] font-black uppercase tracking-[0.1em] truncate text-white">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                {!disabled && (
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-500 ${isOpen ? 'rotate-180 text-shop' : ''}`} />
                )}
            </button>

            {/* Dropdown Menu - Higher Opacity Glass */}
            <div className={`absolute left-0 right-0 mt-2 rounded-[24px] transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-[9999] overflow-hidden border border-white/20 backdrop-blur-3xl bg-[#1a1a1e]/95
                ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-2 pointer-events-none scale-95'}`}>
                <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                    {options.map((option) => {
                        const isSelected = option.value === value
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={`w-full flex items-center justify-between p-3.5 rounded-[16px] transition-all duration-200 group mb-1
                                    ${isSelected ? 'bg-shop text-white shadow-lg shadow-shop/30' : 'hover:bg-white/[0.08] text-muted-foreground hover:text-white'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    {option.icon && (
                                        <div className={`transition-colors duration-200 ${isSelected ? 'text-white' : 'group-hover:text-shop'}`}>
                                            {option.icon}
                                        </div>
                                    )}
                                    <span className="text-[9px] font-black uppercase tracking-widest">{option.label}</span>
                                </div>
                                {isSelected && <Check className="w-3.5 h-3.5" />}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}