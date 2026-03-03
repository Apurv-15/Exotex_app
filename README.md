# Warranty & Service Management App — Master Documentation

## 🚀 Overview
This application is a comprehensive tool for managing product warranties, field visits, stock, complaints, and quotations. It is built using **React Native (Expo)** with **Supabase** as the backend.

---

## 🛠️ Backend Setup (Supabase)

### 1. Database Schema
To recreate the database and storage structure, run the SQL script found in:
`[MASTER_DATABASE_SETUP.sql](./MASTER_DATABASE_SETUP.sql)`

This script handles:
- **Tables**: `users`, `sales`, `stock`, `field_visits`, `complaints`, `quotations`.
- **Storage**: Buckets for `warranty-images` and `complaint-images`.
- **Security**: Row Level Security (RLS) policies for authenticated access.
- **Automation**: `updated_at` triggers and performance indexes.

### 2. Required Extensions
Ensure the `uuid-ossp` extension is enabled in your Supabase project (included in the master script).

---

## 📸 Storage & Images

### Storage Structure
- `warranty-images/`: Stores images for sales and warranty registrations.
- `complaint-images/`: Stores images uploaded during complaint submission.

### Upload Handling
The app uses a robust multi-stage upload process with local fallbacks:
1. Attempt upload to Supabase.
2. If network fails, save locally using `expo-file-system`.
3. Auto-syncing logic (where applicable).

---

## 📄 PDF & Document Templates

### Customization
PDF templates for Sales, Complaints, and Quotations are generated using HTML-to-PDF converters (`expo-print`).

- **Location**: `src/utils/` (e.g., `QuotationTemplate.ts`, `ComplaintTemplate.ts`).
- **Assets**: Logos and stamps are stored in `assets/Warranty_pdf_template/`.

### QR Codes
Warranty cards automatically generate QR codes for verification.

---

## 🔐 Security & Roles

### User Roles
- **Super Admin**: Full across-branch visibility and deletion rights.
- **Admin**: Full access to branch data and stock management.
- **User**: Access to branch-specific features (Sales, Visits, Complaints).

### RLS Policies
The system uses **Row Level Security** to ensure data isolation. Most tables require authentication (`TO authenticated`), while Complaints allow public insertion for customer feedback.

---

## 📱 Development & Deployment

### Environment Variables
Create a `.env` file with:
```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Running Locally
```bash
npx expo start
```

### Building the APK
```bash
eas build -p android --profile production
```

---

## 📋 Features Roadmap & Maintenance
- **Current**: iPad Responsive UI, Android-style animations, Success sound effects (`expo-av`).
- **Data Integrity**: Maintenance of stock levels is automatically triggered by sales.
- **Filtering**: Regional and branch-based filtering across all dashboards.
