# 🛡️ Exotex Warranty Manager

[![Expo](https://img.shields.io/badge/Expo-54.0-blue.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb.svg)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

A high-end, professional warranty management solution built with **React Native** and **Expo**. Designed for businesses to streamline sales entry, generate professional warranty cards from templates, and track analytics in real-time.

---

## 🚀 Key Features

- **📄 Smart Template System**: Upload and manage `.docx` templates. The app automatically fills placeholders with customer data using `docxtemplater`.
- **📊 Real-time Analytics**: Visualized sales data and trends using `react-native-chart-kit`.
- **🛍️ Sales Management**: Intuitive forms for entry of sales, products, and customer details.
- **⚡ Supabase Backend**: Fast, secure data storage with real-time sync and built-in authentication.
- **🎨 Premium UI/UX**: Modern interface featuring glassmorphism, smooth animations, and a polished user experience.
- **📱 Cross-Platform**: Optimized for both iOS and Android via Expo.

---

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, TypeScript
- **UI Components**: React Native Paper, Expo Linear Gradient, SVG
- **Database & Auth**: Supabase
- **Document Processing**: Pizzip, Docxtemplater, Expo Print
- **Networking**: Axios

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (to test locally)

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Warranty_manage_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key

4. **Start the development server**
   ```bash
   npx expo start
   ```
   Scan the QR code with your **Expo Go** app (Android) or **Camera** app (iOS).

---

## 📖 Detailed Guides

This project includes comprehensive documentation for specific features:

| Guide | Description |
| :--- | :--- |
| [📂 Template Usage](TEMPLATE_USAGE.md) | How to use the template system. |
| [📝 Word Template Setup](WORD_TEMPLATE_SETUP.md) | Creating `.docx` files with placeholders. |
| [🎨 PDF Customization](PDF_TEMPLATE_CUSTOMIZATION.md) | Styling and customizing the output. |
| [🗄️ Supabase Setup](SUPABASE_SETUP.md) | Configuring the database and RLS. |
| [� Supabase Quick Start](QUICK_START_SUPABASE.md) | 5-minute database connection guide. |
| [�🔑 Security](SECURITY.md) | Data privacy and security protocols. |
| [🚀 Project Quick Start](WARRANTY_TEMPLATE_QUICKSTART.md) | Rapid deployment guide. |

### 🏷️ Supported Template Placeholders

When creating your `.docx` templates, you can use the following placeholders:

- **Customer**: `{customerName}`, `{phone}`, `{email}`, `{address}`, `{city}`
- **Product**: `{productModel}`, `{serialNumber}`
- **Sale**: `{warrantyId}`, `{saleDate}`, `{date}`
- **Internal**: `{executiveName}`, `{designation}`, `{plumberName}`, `{branchId}`
- **Testing**: `{waterTestingBefore}`, `{waterTestingAfter}`

---

## 📸 Project Structure

```text
.
├── src/
│   ├── components/     # High-level UI components
│   ├── screens/        # Main application screens (Admin, Sales, Warranty, etc.)
│   ├── services/       # API and Supabase logic
│   ├── navigation/     # React Navigation configuration
│   ├── utils/          # Helper functions
│   └── assets/         # Images, fonts, and static files
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
└── ...
```

---

## 👤 Author

**Apurv**
- GitHub: [@apurv1525](https://github.com/apurv1525)

---

## 📄 License

This project is private and proprietary. All rights reserved.
