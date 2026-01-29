# Image Upload Configuration

## ✅ Implemented Features

### 1. **File Type Restrictions**
- ✅ Only **JPEG, JPG, and PNG** files allowed
- ✅ Validation at picker level (before selection)
- ✅ Validation at upload level (server-side)
- ❌ Other formats (GIF, WEBP, BMP, etc.) are rejected

### 2. **File Size Limits**
- ✅ Maximum size: **3MB per image**
- ✅ Automatic compression for oversized images
- ✅ Images resized to max 1920px width
- ✅ JPEG quality set to 80% for compression

### 3. **Automatic Image Compression**
When an image exceeds 3MB:
1. Image is resized (max width: 1920px)
2. Converted to JPEG format
3. Quality reduced to 80%
4. If still > 3MB, upload is rejected

### 4. **User-Friendly Error Messages**
- Invalid file type → "Please select a JPEG or PNG image"
- File too large → "Image is too large (X.XXmb). Maximum size is 3MB"

## 📋 Supabase Storage Policies

Use these simple policies (file size is handled by the app):

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'warranty-images' );

CREATE POLICY "Anyone can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'warranty-images' );
```

## 🎯 How It Works

### User Flow:
1. **User selects image** → File type checked (JPEG/PNG only)
2. **Image validated** → Size checked (must be ≤ 3MB)
3. **If > 3MB** → Automatically compressed
4. **Upload to Supabase** → Stored in `warranty-images/sales-images/`
5. **Success** → Public URL returned and saved to database

### Technical Details:
```typescript
// File types allowed
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

// Max file size
const MAX_SIZE = 3 * 1024 * 1024; // 3MB

// Compression settings
{
  maxWidth: 1920,
  quality: 0.8, // 80%
  format: 'image/jpeg'
}
```

## 🔍 Validation Points

### 1. Client-Side (Image Picker)
```typescript
// In CreateSaleStep2.tsx
const fileExtension = uri.split('.').pop()?.toLowerCase();
const allowedExtensions = ['jpg', 'jpeg', 'png'];
if (!allowedExtensions.includes(fileExtension)) {
    // Show error
}
```

### 2. Server-Side (Upload)
```typescript
// In SalesService.ts
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
if (!allowedTypes.includes(blob.type)) {
    throw new Error('Invalid file type');
}
```

### 3. Size Check
```typescript
if (blob.size > MAX_SIZE) {
    // Compress or reject
}
```

## 📊 Storage Structure

```
warranty-images/
└── sales-images/
    ├── WAR-123456_0_1234567890.jpg  (Product Front)
    ├── WAR-123456_1_1234567891.jpg  (Serial Number)
    ├── WAR-123456_2_1234567892.jpg  (Invoice)
    └── WAR-123456_3_1234567893.jpg  (Installation)
```

## 🐛 Error Handling

### Invalid File Type
```
Error: Invalid file type: image/gif. Only JPEG, JPG, and PNG are allowed.
```

### File Too Large
```
Error: Image is too large (4.5MB). Maximum size is 3MB.
```

### Upload Failed
```
Error: Failed to upload image
```

## ✨ Benefits

1. **Bandwidth Optimization** - Compressed images = faster uploads
2. **Storage Efficiency** - Smaller files = lower costs
3. **Consistent Format** - All images stored as JPEG
4. **User Experience** - Automatic compression (no manual resizing needed)
5. **Security** - Only safe image formats allowed

## 🔧 Configuration

To change limits, edit `SalesService.ts`:

```typescript
// Change max file size
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Change compression quality
quality: 0.9 // 90%

// Change max width
const maxWidth = 2560;

// Add more file types
const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

## 📝 Testing Checklist

- [ ] Upload JPEG image < 3MB → ✅ Should work
- [ ] Upload PNG image < 3MB → ✅ Should work
- [ ] Upload JPEG image > 3MB → ✅ Should compress and upload
- [ ] Upload GIF image → ❌ Should reject with error
- [ ] Upload PDF file → ❌ Should reject with error
- [ ] Upload 4 images successfully → ✅ All should appear in Supabase Storage

## 🚀 Next Steps

1. Create the storage bucket in Supabase
2. Apply the storage policies
3. Test image uploads
4. Monitor storage usage in Supabase dashboard
