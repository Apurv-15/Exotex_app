# Ekotex Warranty & Service Manager 🚀

A premium, enterprise-grade mobile application designed for Exotex to manage product warranties, field services, and supply chain logistics. Built with **React Native (Expo)** and powered by **Supabase**.

---

## ✨ Core Features

### 🛡️ Warranty & Sales Management
- **Digital Registration:** Seamlessly register new product sales with high-resolution image attachments.
- **QR Verification:** Automatically generate and verify product warranty cards via unique QR codes.
- **Sub-Branch Approval:** Advanced workflow allowing sub-branches to manually approve pending warranties for immediate generation.

### 🛠️ Field Service & Maintenance
- **Field Visit Documentation:** Specialized forms for **Residential** and **Industrial** site visits.
- **Complaint Lifecycle:** Track customer complaints from initial submission through technician assignment to final resolution.
- **Service Reports:** Auto-generate professional PDF service reports directly from the field.

### 📦 Intelligent Logistics
- **Stock Management:** Real-time inventory tracking with automated stock deduction upon sales.
- **Multi-Branch Filtering:** Regional and branch-based data isolation for Super Admins and Branch Managers.
- **Quotation Builder:** Professional quotation generation for spare parts and services.

### 🛰️ Advanced Offline-First Architecture (10/10 Production-Ready)
- **Zero Data Loss Guarantee:** All forms (Warranties, Complaints, Visits, Quotations) are instantly saved to a persistent **Local Sync Queue** (`AsyncStorage`) before Supabase transmission.
- **Optimistic Dashboard:** Sub-Branch dashboards merge live server data with local pending operations, showing users their work immediately even with no internet.
- **Intelligent Background Sync:** Auto-detects network restoration via `NetInfo` and `AppState` listeners to silently process the queue in the background.
- **Exponential Backoff:** Robust retry logic (`2^retryCount` minutes) prevents server spamming while ensuring eventual data delivery.
- **Global Sync Status UI:** 
    - **Offline Entry Interceptor:** Modal popups warn users of slow/no internet while confirming data is safe.
    - **Sync Progress Banner:** Real-time visibility of pending, syncing, and failed operations at the top of every screen.
    - **Manual Queue Manager:** Dedicated interface to retry, inspect, or discard failed operations individually.

### 🎨 Premium User Experience
- **iPad Optimized:** Fully responsive layouts tailored for both handheld mobile devices and technician tablets.
- **Rich Interaction:** Integrated haptic feedback and custom sound effects for professional feedback.
- **EAS Insights:** Real-time monitoring of app performance, reach, and user engagement.

---

## 🛠️ Technical Stack

- **Frontend:** React Native (Expo SDK 54)
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **State Management:** **Zustand** (Global Sync Store), Context API
- **Offline Engine:** Custom `SyncService` with background task orchestration
- **Storage:** `@react-native-async-storage/async-storage`, Expo Secure Store
- **PDF Engine:** `expo-print` with custom HTML templates
- **Release Pipeline:** EAS (Expo Application Services) with deterministic `package-lock.json` builds.

---

## 🚀 Getting Started

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (LTS)
2. Install [Expo Go](https://expo.dev/expo-go) on your mobile device.
3. Setup [EAS CLI](https://docs.expo.dev/build/setup/): `npm install -g eas-cli`

### Installation
```bash
git clone https://github.com/your-repo/Warranty_manage_app.git
cd Warranty_manage_app
npm install
```

### Environment Setup
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Running Locally
```bash
npx expo start
```

---

## 📱 Deployment

### Building for Play Store
The project uses EAS for production-grade Android builds:
```bash
eas build -p android --profile production
```

### Updates
To push non-native updates instantly to users:
```bash
eas update --auto
```

---

## 📋 Security & RLS
This application implements strict **Row Level Security (RLS)** in Supabase to ensure data privacy between different organizational branches. All mission-critical data requires authenticated access, while complaint submissions are available publicly to facilitate customer feedback.

---
*Developed for Exotex by Apurv*
