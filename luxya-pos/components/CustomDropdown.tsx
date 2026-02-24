
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'

interface DropdownOption {
    label: string
    value: string | number | null
    icon?: React.ReactNode
}

interface CustomDropdownProps {
    options: DropdownOption[]
    value: string | number | null
    onChange: (value: any) => void
    label?: string
    placeholder?: string
    disabled?: boolean
    className?: string
    searchable?: boolean
    variant?: 'glass' | 'solid'
}

export default function CustomDropdown({ 
    options, 
    value, 
    onChange, 
    label, 
    placeholder = "Sélectionner...", 
    disabled = false,
    className = "",
    searchable = true,
    variant = 'glass'
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchQuery] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)
    
    const selectedOption = options.find(opt => opt.value === value) || options.find(opt => opt.value === '' && value === null)

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        if (!isOpen) setSearchQuery('')
    }, [isOpen])

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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 border
                    ${variant === 'glass' 
                        ? 'border-white/10 backdrop-blur-xl bg-white/[0.05] hover:bg-white/[0.1] shadow-lg shadow-black/20' 
                        : 'border-white/10 bg-[#121214] hover:bg-[#1a1a1e] shadow-xl'}
                    ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-[0.98]'} 
                    ${isOpen ? 'border-shop/50 ring-4 ring-shop/10 bg-white/[0.12]' : 'hover:border-white/20'}`}
            >
                <div className="flex items-center space-x-3 truncate">
                    {selectedOption?.icon && (
                        <div className="shrink-0 text-shop drop-shadow-[0_0_8px_rgba(var(--shop-primary),0.4)]">{selectedOption.icon}</div>
                    )}
                    <span className={`text-xs font-bold uppercase tracking-wide truncate ${selectedOption ? 'text-white' : 'text-muted-foreground'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                {!disabled && (
                    <div className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown className={`w-4 h-4 transition-colors duration-300 ${isOpen ? 'text-shop' : 'text-muted-foreground'}`} />
                    </div>
                )}
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute left-0 right-0 mt-2 rounded-2xl transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-[9999] overflow-hidden border border-white/10 backdrop-blur-3xl bg-[#0f0f11]/98
                ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 translate-y-2 pointer-events-none scale-[0.98]'}`}>
                
                {searchable && (
                    <div className="p-3 border-b border-white/5 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-shop transition-colors duration-300" />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus={isOpen}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-shop/40 transition-all placeholder:text-muted-foreground/50"
                            placeholder="Filtrer..."
                        />
                    </div>
                )}

                <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredOptions.length > 0 ? filteredOptions.map((option, index) => {
                        const isSelected = option.value === value || (option.value === '' && value === null)
                        return (
                            <button
                                key={`${option.value}-${index}`}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group mb-1 last:mb-0
                                    ${isSelected 
                                        ? 'bg-shop text-white shadow-lg shadow-shop/40' 
                                        : 'hover:bg-white/[0.08] text-muted-foreground hover:text-white'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    {option.icon && (
                                        <div className={`transition-all duration-300 ${isSelected ? 'text-white scale-110' : 'group-hover:text-shop group-hover:scale-110'}`}>
                                            {option.icon}
                                        </div>
                                    )}
                                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-all duration-300`}>
                                        {option.label}
                                    </span>
                                </div>
                                {isSelected && (
                                    <Check className="w-3.5 h-3.5 animate-in zoom-in-50 duration-300" />
                                )}
                            </button>
                        )
                    }) : (
                        <div className="py-8 flex flex-col items-center justify-center opacity-40">
                            <Search className="w-6 h-6 mb-2 text-muted-foreground" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aucun résultat</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

