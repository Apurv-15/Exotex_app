import { THEME } from './theme';

export const REGION_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    'Mumbai': { bg: '#D1FAE5', text: '#059669', icon: 'city' },
    'Delhi': { bg: '#FEF3C7', text: '#D97706', icon: 'city-variant' },
    'Bangalore': { bg: '#E0E7FF', text: '#4F46E5', icon: 'office-building' },
    'Chennai': { bg: '#DBEAFE', text: '#2563EB', icon: 'home-city' },
    'Kolkata': { bg: '#FCE7F3', text: '#DB2777', icon: 'city-variant-outline' },
    'Hyderabad': { bg: '#FFEDD5', text: '#EA580C', icon: 'domain' },
    'Pune': { bg: '#F3E8FF', text: '#9333EA', icon: 'town-hall' },
    'default': { bg: '#F3F4F6', text: '#6B7280', icon: 'map-marker' },
};

export const getRegionColor = (city: string) => REGION_COLORS[city] || REGION_COLORS['default'];

export const PRODUCT_MODELS = [
    'EKO-GREEN G3',
    'EKO-GREEN G5',
    'EKO-GREEN G6',
    'EKO-GREEN G33',
    'EKO-GREEN G130',
    'EKO-GREEN G230',
    'EKO-GREEN G330',
    'EKO-GREEN G530',
    'EKO-GREEN G600',
];

export const calculateDaysRemaining = (saleDate: string) => {
    const start = new Date(saleDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 45 - diffDays;

    return {
        days: remaining,
        isExpired: remaining <= 0,
        label: remaining <= 0 ? (remaining === 0 ? 'Today' : `Expired ${Math.abs(remaining)} days ago`) : `${remaining} Days Left`,
        color: remaining > 15 ? THEME.colors.success : (remaining > 0 ? THEME.colors.warning : THEME.colors.error)
    };
};

export const calculateDaysPassed = (dateStr: string) => {
    if (!dateStr) return 0;
    try {
        const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
        let d: Date;
        if (parts[0].length === 4) { // YYYY-MM-DD
            d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else { // DD/MM/YYYY
            d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        const diff = new Date().getTime() - d.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    } catch (e) {
        return 0;
    }
};
