'use client'

import React from 'react';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';

interface ExpiryBadgeProps {
    expiryDate: string | null | undefined;
    className?: string;
    showIcon?: boolean;
}

// Simplified expiry status calculation
function getSimpleExpiryStatus(expiryDate: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
        return {
            severity: 'critical' as const,
            message: `Périmé depuis ${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) > 1 ? 's' : ''}`,
            color: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
    } else if (daysRemaining === 0) {
        return {
            severity: 'critical' as const,
            message: 'Expire aujourd\'hui',
            color: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
    } else if (daysRemaining <= 30) {
        return {
            severity: 'critical' as const,
            message: `Expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
            color: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
    } else if (daysRemaining <= 60) {
        return {
            severity: 'warning' as const,
            message: `Expire dans ${daysRemaining} jours`,
            color: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        };
    } else if (daysRemaining <= 180) {
        const formattedDate = expiry.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
        return {
            severity: 'normal' as const,
            message: `Expire le ${formattedDate}`,
            color: 'bg-white/5 text-white/70 border-white/10'
        };
    } else {
        const formattedDate = expiry.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
        return {
            severity: 'normal' as const,
            message: `Expire le ${formattedDate}`,
            color: 'bg-white/5 text-muted-foreground border-white/10'
        };
    }
}

export default function ExpiryBadge({ expiryDate, className = '', showIcon = true }: ExpiryBadgeProps) {
    // Don't render if no expiry date
    if (!expiryDate) {
        return null;
    }

    try {
        const status = getSimpleExpiryStatus(expiryDate);
        const Icon = status.severity === 'critical' ? AlertTriangle : Clock;

        return (
            <div
                className={`
                    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                    border ${status.color}
                    ${className}
                `}
            >
                {showIcon && <Icon className="w-3.5 h-3.5" />}
                <span>{status.message}</span>
            </div>
        );
    } catch (error) {
        console.error('ExpiryBadge error:', error, 'expiryDate:', expiryDate);
        return null;
    }
}

interface ExpiryDateDisplayProps {
    expiryDate: string | null | undefined;
    className?: string;
}

export function ExpiryDateDisplay({ expiryDate, className = '' }: ExpiryDateDisplayProps) {
    if (!expiryDate) return null;

    try {
        const status = getSimpleExpiryStatus(expiryDate);

        return (
            <div className={`flex items-center gap-2 text-sm ${className}`}>
                <Calendar className="w-4 h-4" />
                <span className={status.color.split(' ')[1]}>
                    {status.message}
                </span>
            </div>
        );
    } catch (error) {
        return null;
    }
}
