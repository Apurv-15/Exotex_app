import { useWindowDimensions } from 'react-native';

/**
 * Returns responsive layout helpers for iPad/tablet screens (≥768px wide).
 * Preserves existing mobile design below 768px.
 */
export function useTabletLayout() {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return {
        isTablet,
        /** Use 2 columns on tablets, 1 on mobile */
        numColumns: isTablet ? 2 : 1,
        /** Cap content width on tablets to avoid overstretching */
        contentMaxWidth: isTablet ? 860 : undefined,
        /** Extra horizontal padding on tablets */
        horizontalPadding: isTablet ? 40 : 16,
        /** Slightly larger font scale on tablets */
        fontScale: isTablet ? 1.05 : 1,
    };
}
