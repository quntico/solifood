export const BRANDS = {
    solimaq: {
        id: 'solimaq',
        name: 'Solimaq',
        label: 'Solimaq Center',
        colors: {
            // #FFD60A -> HSL(48, 96%, 53%) (Solifood Yellow)
            primary: '48 96% 53%',
            // Darker accent
            secondary: '38 92% 50%',
            // Dark text on yellow
            primaryForeground: '222.2 47.4% 11.2%',
        },
        // Default logo path (can be overridden by quotation.logo)
        defaultLogo: '/solimaq_logo.png'
    },
    solifood: {
        id: 'solifood',
        name: 'Solifood',
        label: 'Solifood Industrial',
        colors: {
            // #FFD60A -> HSL(48, 96%, 53%)
            primary: '48 96% 53%',
            // Darker accent
            secondary: '38 92% 50%',
            // Dark text on yellow for readability
            primaryForeground: '222.2 47.4% 11.2%',
        },
        defaultLogo: '/solifood-logo.png'
    }
};

export const DEFAULT_BRAND = 'solifood';
