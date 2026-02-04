export const THEME = {
    colors: {
        primary: "#B7E4C7", // Mint Green (exact Stitch)
        secondary: "#74C69D", // Darker Mint (exact Stitch)
        mintLight: "#D8F3DC", // Light Mint (exact Stitch)
        mintDark: "#74C69D", // Same as secondary
        background: "#F7FCF8", // Off-white mintish background (exact Stitch)
        text: "#1F2937", // Slate 800 (exact Stitch)
        textSecondary: "#64748B", // Slate 500
        white: "#FFFFFF",
        glassBorder: "rgba(255, 255, 255, 0.7)", // Stitch glass border
        glassBackground: "rgba(255, 255, 255, 0.4)", // Stitch glass background
        error: "#EF4444",
        success: "#10B981",
        warning: "#F59E0B",
    },
    spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        s: 8,
        m: 12,
        l: 16,
        xl: 20,
        xxl: 32, // '4xl' in Stitch
    },
    shadows: {
        glass: {
            shadowColor: "rgba(183, 228, 199, 0.15)", // Stitch glass shadow
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 1,
            shadowRadius: 32,
            elevation: 8,
        },
        small: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        }
    },
    fonts: {
        display: "Nunito-Bold",
        body: "Nunito-Regular",
        bold: "Nunito-Bold",
        black: "Nunito-Black",
        semiBold: "Nunito-SemiBold",
    }
};
