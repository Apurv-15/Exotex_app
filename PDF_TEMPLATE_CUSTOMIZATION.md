# PDF Warranty Card Customization Guide

## 📍 Location
The PDF template is in: `src/screens/warranty/WarrantyCard.tsx`

Function: `generateWarrantyHTML()` (lines 64-251)

---

## 🎨 What You Can Customize

### ✅ Easy to Change:
- Company name and tagline
- Colors (borders, text, backgrounds)
- Font sizes and styles
- Layout spacing
- Contact information
- Footer text

### ⚠️ Requires Code Knowledge:
- Adding logo images
- Complex layouts
- Multiple pages
- Advanced styling

---

## 🛠️ Quick Customization Guide

### 1. Change Company Name

**Find** (line 201):
```html
<div class="logo-text">EKOTEX</div>
```

**Change to**:
```html
<div class="logo-text">YOUR COMPANY NAME</div>
```

---

### 2. Change Tagline

**Find** (line 202):
```html
<div class="tagline">Energizing Future, eMpowering Excellence.....</div>
```

**Change to**:
```html
<div class="tagline">Your Company Tagline Here</div>
```

---

### 3. Change Colors

#### Border Color
**Find** (line 80):
```css
border: 3px solid #0066cc;
```

**Change to** (example - red):
```css
border: 3px solid #cc0000;
```

#### Title Background
**Find** (line 104):
```css
background: linear-gradient(90deg, #0066cc, #00cc66);
```

**Change to** (example - purple to pink):
```css
background: linear-gradient(90deg, #7C3AED, #EC4899);
```

#### Text Colors
**Find** (line 90):
```css
color: #0066cc;
```

**Change to your brand color**:
```css
color: #YOUR_COLOR_HEX;
```

---

### 4. Change Font Sizes

**Company Name** (line 88):
```css
font-size: 36px;
```

**Warranty Title** (line 107):
```css
font-size: 22px;
```

**Labels** (line 129):
```css
font-weight: bold;
```

---

### 5. Add Logo Image

**Find** (line 200-206) and **replace**:

```html
<div class="header">
    <img src="YOUR_LOGO_URL" alt="Company Logo" style="width: 150px; margin-bottom: 10px;">
    <div class="logo-text">EKOTEX</div>
    <div class="tagline">Energizing Future, eMpowering Excellence.....</div>
    <div class="iso">AN ISO 9001 - 2015 CERTIFIED COMPANY</div>
    <div class="warranty-title">WARRANTY CARD</div>
    <div class="divider">✦</div>
</div>
```

**Logo URL Options**:
1. **Base64 encoded**: `data:image/png;base64,iVBORw0KG...`
2. **Online URL**: `https://yoursite.com/logo.png`
3. **Imported asset**: `require('../../assets/logo.png')`

---

### 6. Add More Fields

**Example**: Add Product Model and Serial Number

**Find** (line 227) and **add after**:

```html
<div class="form-row">
    <div><span class="label">Product Model:</span> <span class="value">${sale.productModel}</span></div>
</div>

<div class="form-row">
    <div><span class="label">Serial Number:</span> <span class="value">${sale.serialNumber}</span></div>
</div>
```

---

### 7. Change Contact Email

**Find** (line 237):
```html
<div class="contact-email">ekotexelectricient@gmail.com</div>
```

**Change to**:
```html
<div class="contact-email">your-email@company.com</div>
```

---

### 8. Customize Footer

**Find** (line 245-247):
```html
<div class="footer">
    Generated on ${new Date().toLocaleString('en-IN')} | Warranty ID: ${sale.warrantyId}
</div>
```

**Change to**:
```html
<div class="footer">
    © 2026 Your Company Name | Warranty ID: ${sale.warrantyId} | www.yourwebsite.com
</div>
```

---

## 🎨 Complete Example: Custom Branded Template

Here's a fully customized example:

```typescript
const generateWarrantyHTML = () => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px;
            background: white;
        }
        .container {
            max-width: 650px;
            margin: 0 auto;
            border: 4px solid #7C3AED;
            padding: 35px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
            background: linear-gradient(135deg, #7C3AED, #EC4899);
            padding: 20px;
            border-radius: 8px;
            color: white;
        }
        .logo {
            width: 120px;
            margin-bottom: 15px;
        }
        .logo-text {
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 3px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .tagline {
            font-size: 12px;
            font-style: italic;
            margin-top: 8px;
        }
        .warranty-title {
            background: white;
            color: #7C3AED;
            padding: 15px 50px;
            font-size: 24px;
            font-weight: bold;
            display: inline-block;
            margin: 25px 0;
            border-radius: 25px;
            border: 3px solid #7C3AED;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            padding: 12px;
            background: #F3F4F6;
            border-radius: 8px;
            border-left: 4px solid #7C3AED;
        }
        .label {
            font-weight: bold;
            color: #7C3AED;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .value {
            color: #1F2937;
            font-weight: 600;
            font-size: 14px;
            margin-top: 4px;
        }
        .full-width {
            grid-column: 1 / -1;
        }
        .stamp-box {
            border: 2px dashed #7C3AED;
            padding: 15px;
            margin: 20px 0;
            border-radius: 8px;
            background: #FAFAFA;
            text-align: center;
            min-height: 100px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            font-size: 11px;
            color: #6B7280;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Add your logo here -->
            <!-- <img src="YOUR_LOGO_URL" class="logo" alt="Logo"> -->
            <div class="logo-text">YOUR COMPANY</div>
            <div class="tagline">Your Tagline Here</div>
        </div>

        <div style="text-align: center;">
            <div class="warranty-title">WARRANTY CERTIFICATE</div>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <div class="label">Warranty ID</div>
                <div class="value">${sale.warrantyId}</div>
            </div>
            <div class="info-item">
                <div class="label">Date</div>
                <div class="value">${formattedDate}</div>
            </div>
            <div class="info-item full-width">
                <div class="label">Customer Name</div>
                <div class="value">${sale.customerName}</div>
            </div>
            <div class="info-item">
                <div class="label">Phone</div>
                <div class="value">${sale.phone}</div>
            </div>
            <div class="info-item">
                <div class="label">Email</div>
                <div class="value">${sale.email || 'N/A'}</div>
            </div>
            <div class="info-item full-width">
                <div class="label">Address</div>
                <div class="value">${sale.address}, ${sale.city}</div>
            </div>
            <div class="info-item">
                <div class="label">Product Model</div>
                <div class="value">${sale.productModel}</div>
            </div>
            <div class="info-item">
                <div class="label">Serial Number</div>
                <div class="value">${sale.serialNumber}</div>
            </div>
        </div>

        <div class="stamp-box">
            <div style="font-size: 12px; color: #6B7280; margin-bottom: 40px;">
                Dealer Stamp & Signature
            </div>
        </div>

        <div style="text-align: center; margin: 20px 0; padding: 15px; background: #FEF3C7; border-radius: 8px;">
            <div style="font-weight: bold; color: #92400E; margin-bottom: 5px;">
                📧 Contact Us
            </div>
            <div style="color: #7C3AED; font-weight: bold;">
                your-email@company.com
            </div>
        </div>

        <div class="footer">
            © 2026 Your Company Name | Warranty ID: ${sale.warrantyId}<br>
            Generated on ${new Date().toLocaleString('en-IN')}
        </div>
    </div>
</body>
</html>
`;
```

---

## 📝 Step-by-Step: How to Edit

### 1. Open the File
```bash
code src/screens/warranty/WarrantyCard.tsx
```

### 2. Find the Function
Search for: `generateWarrantyHTML`

### 3. Make Changes
- Edit HTML structure (lines 198-250)
- Edit CSS styles (lines 70-196)

### 4. Test Changes
1. Save the file
2. Refresh your web app
3. Create a test sale
4. Click "Download PDF"
5. Check the output

### 5. Iterate
- Make adjustments
- Test again
- Repeat until perfect

---

## 🎨 Color Schemes

### Professional Blue
```css
Primary: #0066cc
Secondary: #00cc66
Border: #0066cc
```

### Modern Purple
```css
Primary: #7C3AED
Secondary: #EC4899
Border: #7C3AED
```

### Corporate Gray
```css
Primary: #374151
Secondary: #6B7280
Border: #1F2937
```

### Vibrant Orange
```css
Primary: #F59E0B
Secondary: #EF4444
Border: #F59E0B
```

---

## 🖼️ Adding Logo (Detailed)

### Method 1: Base64 (Recommended)

1. **Convert your logo to Base64**:
   - Go to: https://base64.guru/converter/encode/image
   - Upload your logo
   - Copy the Base64 string

2. **Add to template**:
```html
<img src="data:image/png;base64,YOUR_BASE64_STRING_HERE" 
     style="width: 150px; margin-bottom: 15px;" 
     alt="Company Logo">
```

### Method 2: Import Asset

1. **Add logo to assets**:
   - Place logo in: `src/assets/logo.png`

2. **Import in component** (top of file):
```typescript
import CompanyLogo from '../../assets/logo.png';
```

3. **Use in template**:
```html
<img src="${CompanyLogo}" style="width: 150px;" alt="Logo">
```

### Method 3: Online URL

```html
<img src="https://yourwebsite.com/logo.png" 
     style="width: 150px;" 
     alt="Logo">
```

---

## 🔍 Available Data Fields

You can use these in your template:

```javascript
${sale.warrantyId}          // Warranty ID
${sale.customerName}        // Customer name
${sale.phone}               // Phone number
${sale.email}               // Email
${sale.address}             // Address
${sale.city}                // City
${sale.productModel}        // Product model
${sale.serialNumber}        // Serial number
${sale.executiveName}       // Sales executive
${sale.designation}         // Executive title
${sale.plumberName}         // Plumber name
${sale.waterTestingBefore}  // TDS before
${sale.waterTestingAfter}   // TDS after
${formattedDate}            // Formatted sale date
```

---

## ⚠️ Important Notes

1. **HTML/CSS Knowledge Required**: This is code-based customization
2. **Test Thoroughly**: Always test after changes
3. **Backup First**: Copy the original function before editing
4. **Browser Compatibility**: Some CSS may not work in PDF generation
5. **Keep It Simple**: Complex layouts may not render correctly

---

## 🆘 Troubleshooting

### PDF looks broken
- Simplify CSS
- Remove complex gradients
- Use basic layouts

### Logo not showing
- Use Base64 encoding
- Check image URL is accessible
- Verify image format (PNG/JPG)

### Colors not appearing
- Use hex codes (#RRGGBB)
- Avoid CSS variables
- Test in browser first

### Layout issues
- Use tables for structure
- Avoid flexbox/grid if problems
- Keep widths in pixels

---

## 📞 Need Help?

If you need assistance customizing the PDF template:
1. Share your requirements
2. Provide your logo/branding
3. Specify color scheme
4. I can help modify the code!

---

**Last Updated**: January 29, 2026
