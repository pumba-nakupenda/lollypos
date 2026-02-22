/**
 * Utility functions for managing product expiry dates
 */

export interface ExpiryStatus {
    isExpired: boolean;
    isNearExpiry: boolean;
    daysRemaining: number;
    severity: 'critical' | 'warning' | 'normal';
    message: string;
}

/**
 * Calculate expiry status for a product
 * @param expiryDate - ISO date string
 * @param warningDays - Days before expiry to show warning (default: 30)
 * @returns ExpiryStatus object
 */
export function getExpiryStatus(expiryDate: string | null | undefined, warningDays: number = 30): ExpiryStatus {
    if (!expiryDate) {
        return {
            isExpired: false,
            isNearExpiry: false,
            daysRemaining: Infinity,
            severity: 'normal',
            message: ''
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isExpired = daysRemaining < 0;
    const isNearExpiry = daysRemaining >= 0 && daysRemaining <= 60; // 60 days = 2 months

    let severity: 'critical' | 'warning' | 'normal' = 'normal';
    let message = '';

    if (isExpired) {
        severity = 'critical';
        message = `Périmé depuis ${Math.abs(daysRemaining)} jour${Math.abs(daysRemaining) > 1 ? 's' : ''}`;
    } else if (daysRemaining === 0) {
        severity = 'critical';
        message = 'Expire aujourd\'hui';
    } else if (daysRemaining <= 30) {
        severity = 'critical';
        message = `Expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`;
    } else if (daysRemaining <= 60) {
        severity = 'warning';
        message = `Expire dans ${daysRemaining} jours`;
    }

    return {
        isExpired,
        isNearExpiry,
        daysRemaining,
        severity,
        message
    };
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(expiryDate: string | null | undefined): string {
    if (!expiryDate) return '';

    const date = new Date(expiryDate);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Get color classes based on expiry severity
 */
export function getExpiryColorClasses(severity: 'critical' | 'warning' | 'normal'): {
    bg: string;
    text: string;
    border: string;
} {
    switch (severity) {
        case 'critical':
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-400',
                border: 'border-red-500/20'
            };
        case 'warning':
            return {
                bg: 'bg-orange-500/10',
                text: 'text-orange-400',
                border: 'border-orange-500/20'
            };
        default:
            return {
                bg: 'bg-white/5',
                text: 'text-muted-foreground',
                border: 'border-white/10'
            };
    }
}
