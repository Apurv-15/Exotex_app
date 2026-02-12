# Feature Implementation Plan: Photos Gallery Tab

## 1. Feature Overview
The goal is to add a dedicated "Photos" tab to the Main Branch Dashboard. This tab will serve as a centralized gallery to view all images uploaded to Supabase, aggregared from both **Sales** (Warranty) and **Field Visits**.

### Key Features
- **Unified Gallery**: Display images from both Sales and Field Visits in a single view.
- **Contextual Information**: Each photo will display relevant metadata (Customer/Site Name, Date, Type).
- **Filtering**: Users can filter photos by category (All, Sales, Field Visits).
- **Premium UI**: Utilize the existing Glassmorphism design system (`GlassPanel`) for a consistent, high-quality look.
- **Interactive Viewing**: Tap on any photo to view it in full screen.

## 2. Technical Architecture

### 2.1 Component Structure
We will introduce a new generic component and update the dashboard.

1.  **`src/components/PhotosGalleryContent.tsx`** (New Component)
    -   **Purpose**: Main container for the photo gallery.
    -   **Props**:
        -   `sales`: Array of `Sale` objects.
        -   `visits`: Array of `FieldVisit` objects.
    -   **State**:
        -   `filter`: 'All' | 'Sales' | 'Visits'
        -   `selectedImage`: For the full-screen modal.

2.  **`src/screens/dashboard/MainBranchDashboard.tsx`** (Update)
    -   **State Update**: Add `'Photos'` to the `activeTab` state.
    -   **UI Update**: Add a third button "Photos" to the tab switcher.
    -   **Render Logic**: Conditionally render `<PhotosGalleryContent />` when the Photos tab is active.

### 2.2 Data Transformation
Since images are stored as arrays of strings (`imageUrls`) within `Sale` and `FieldVisit` objects, we need a helper to flatten this data structure for the gallery.

**Data Interface for Gallery Item:**
```typescript
interface GalleryItem {
    id: string;          // Unique ID (composite of entity ID + index)
    url: string;         // Public Supabase URL
    type: 'Sale' | 'Visit';
    title: string;       // Customer Name or Site Name
    subtitle: string;    // Product Model or Visit Purpose
    date: string;        // Sale Date or Visit Date
    entityId: string;    // Original ID of the Sale or Visit
}
```

## 3. Detailed Implementation Steps

### Step 1: Create `PhotosGalleryContent` Component
Create a new file `src/components/PhotosGalleryContent.tsx`.

**Logic:**
1.  **Flatten Data**: inside a `useMemo`, iterate through `sales` and `visits`.
    -   For each `Sale`, map its `imageUrls` to `GalleryItem` objects.
    -   For each `FieldVisit`, map its `imageUrls` to `GalleryItem` objects.
    -   Sort the combined array by `date` (descending).
2.  **Filter Logic**: Apply filtering based on the selected `filter` state.

**UI Layout:**
-   **Header**: Title "Photo Gallery" with a relevant icon (e.g., `image-multiple`).
-   **Filter Chips**: "All", "Sales", "Field Visits" (using the existing pill-shaped design).
-   **Masonry/Grid Layout**: Use a 2-column or 3-column layout depending on screen width.
-   **Image Card**:
    -   Use `GlassPanel` as the container.
    -   Image aspect ratio: 1:1 or 4:3.
    -   Overlay or Footer: Show `title` and `date` with a translucent background.

### Step 2: Update `MainBranchDashboard.tsx`
1.  **Update Tab State**:
    ```typescript
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Analytics' | 'Photos'>('Dashboard');
    ```
2.  **Update Tab Switcher UI**:
    -   Modify the `GlassPanel` tab container to accept 3 items.
    -   Add the "Photos" pressable button.
3.  **Conditional Rendering**:
    ```tsx
    {activeTab === 'Dashboard' ? (
        // ... existing dashboard content
    ) : activeTab === 'Analytics' ? (
        // ... existing analytics content
    ) : (
        <PhotosGalleryContent sales={allSales} visits={allVisits} />
    )}
    ```

### Step 3: Styling & Polish
-   **Animations**: Add simple entry animations for the images using `Reanimated` (if available) or standard LayoutAnimation.
-   **Loading States**: Show a skeleton or loading spinner while images are being processed/loaded.
-   **Empty States**: Display a "No photos found" `GlassPanel` if the list is empty.

## 4. UI/UX Specifications (Aesthetic)

-   **Color Palette**: Use `THEME.colors.mintLight` and `THEME.colors.secondary` for accents to match the "Exotex" branding.
-   **Glass Effect**: Ensure the photo grid items use `rgba(255, 255, 255, 0.5)` with the standard `GlassPanel` styling.
-   **Typography**: Use `THEME.fonts.bold` for titles and `THEME.fonts.semiBold` for subtitles/dates.

## 5. Security & Performance
-   **Lazy Loading**: Ensure images use `resizeMode="cover"` and consider caching strategies if using `expo-image` (or standard `Image` with standard caching).
-   **Privacy**: Ensure only authorized users (Admin) can see these photos (handled by the parent Dashboard auth check).
