export interface Shop {
    id: number
    name: string
    slug: string
    logo_url?: string
    phone: string
    address: string
    colors: {
        primary: string
        secondary: string
        accent: string
    }
}

export const shops: Shop[] = [
    {
        id: 1,
        name: 'Luxya',
        slug: 'luxya',
        phone: '+221 77 235 47 47',
        address: 'Fass delorme 13x22',
        colors: {
            primary: "0 84% 60%",    // Red
            secondary: "43 100% 70%", // Gold
            accent: "0 100% 50%"    // Bright Red
        }
    },
    {
        id: 2,
        name: 'Homtek',
        slug: 'homtek',
        phone: '+221 77 235 47 47',
        address: 'Fass delorme 13x22',
        colors: {
            primary: "217 91% 60%",   // Blue
            secondary: "215 20% 65%", // Silver/Gray
            accent: "214 100% 50%"   // Bright Blue
        }
    },
    {
        id: 3,
        name: 'Lolly Agency',
        slug: 'lolly-agency',
        phone: '+221 77 235 47 47',
        address: 'Fass delorme 13x22',
        colors: {
            primary: "280 80% 60%",   // Purple
            secondary: "280 20% 65%", // Lavender
            accent: "280 100% 50%"   // Bright Purple
        }
    }
]
