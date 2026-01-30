# Complete Guide: Editing Your Warranty Card Template

## 📝 Overview
This guide shows you how to customize your WARRANTY CARD.docx template with logos, images, custom pages, and branding - then save it for automatic warranty generation.

---

## 🎨 What You Can Customize

### ✅ Static Content (Always Appears)
- Company logo
- Header/footer images
- User manual pages
- Terms & conditions
- Warranty policy
- Contact information
- Background colors/designs
- Borders and styling

### ✅ Dynamic Content (Auto-filled per customer)
- Customer name, phone, email
- Address and city
- Product model and serial number
- Warranty ID
- Sale date
- Executive/plumber details
- Water testing results

---

## 🛠️ Step-by-Step Editing Process

### Step 1: Open Your Template

1. **Locate the file**: `src/assets/Warranty_pdf_template/WARRANTY CARD.docx`
2. **Open with Microsoft Word** (or LibreOffice/Google Docs)
3. **Enable editing** if prompted

---

### Step 2: Add Your Company Logo

#### Option A: Header Logo (Appears on all pages)

1. Click **Insert** → **Header** → **Edit Header**
2. Click **Insert** → **Pictures** → **This Device**
3. Select your logo file (PNG, JPG, or SVG)
4. **Resize** the logo:
   - Right-click → **Size and Position**
   - Set width to 150-200 pixels
   - Maintain aspect ratio
5. **Position** the logo:
   - Right-click → **Wrap Text** → **In Front of Text**
   - Drag to desired position (usually top-left or center)
6. Click **Close Header and Footer**

#### Option B: Page-Specific Logo

1. Navigate to the warranty card page
2. Click where you want the logo
3. **Insert** → **Pictures** → **This Device**
4. Select and resize as above
5. Position using text wrapping

**Pro Tip**: Use transparent PNG logos for best results!

---

### Step 3: Add Custom Pages

#### Adding a Cover Page

1. Go to **Insert** → **Cover Page**
2. Choose a template or create custom
3. Add your company name, logo, tagline
4. This becomes Page 1 (static)

#### Adding User Manual Pages

1. Click after the last page
2. **Insert** → **Page Break**
3. Add content:
   - Product specifications
   - Installation instructions
   - Safety warnings
   - Maintenance tips
4. Add images: **Insert** → **Pictures**
5. Add tables: **Insert** → **Table**

#### Adding Terms & Conditions

1. Create new page after user manual
2. Add heading: "Terms & Conditions"
3. List all warranty terms
4. Format with bullets or numbering

**Example Structure**:
```
Page 1: Cover Page (Logo, Company Name)
Page 2-4: User Manual (Product Info, Instructions)
Page 5: Warranty Card (EDITABLE - with placeholders)
Page 6: Terms & Conditions
Page 7: Contact Information
```

---

### Step 4: Design the Warranty Card Page

This is the **ONLY page** with placeholders that get auto-filled.

#### Layout Example:

```
╔═══════════════════════════════════════════════════════╗
║                    [YOUR LOGO HERE]                   ║
║                      EKOTEX                           ║
║        Energizing Future, eMpowering Excellence       ║
║          AN ISO 9001 - 2015 CERTIFIED COMPANY         ║
╠═══════════════════════════════════════════════════════╣
║                  WARRANTY CARD                         ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║  Bill No: {warrantyId}        Date: {saleDate}        ║
║                                                        ║
║  Name of Purchaser: {customerName}                    ║
║                                                        ║
║  Address: {address}                                   ║
║           {city}                                      ║
║                                                        ║
║  Phone No: {phone}                                    ║
║  Email: {email}                                       ║
║                                                        ║
║  Product Model: {productModel}                        ║
║  Serial Number: {serialNumber}                        ║
║                                                        ║
║  Executive: {executiveName} ({designation})           ║
║  Plumber: {plumberName}                               ║
║                                                        ║
║  Water Testing: Before: {waterTestingBefore} TDS      ║
║                 After: {waterTestingAfter} TDS        ║
║                                                        ║
║  [Dealer Stamp Box]                                   ║
║                                                        ║
║  Contact: ekotexelectricient@gmail.com                ║
╚═══════════════════════════════════════════════════════╝
```

#### Adding Placeholders:

1. **Type the placeholder exactly**: `{customerName}`
2. **Use curly braces**: `{` and `}`
3. **Match the exact name** from the list below
4. **No spaces inside braces**: ❌ `{ customerName }` ✅ `{customerName}`

**Available Placeholders**:
```
{warrantyId}           - Warranty ID
{customerName}         - Customer name
{phone}                - Phone number
{email}                - Email address
{address}              - Street address
{city}                 - City
{productModel}         - Product model
{serialNumber}         - Serial number
{saleDate}             - Sale date (DD/MM/YYYY)
{date}                 - Installation date
{executiveName}        - Sales executive
{designation}          - Executive title
{plumberName}          - Plumber name
{waterTestingBefore}   - TDS before
{waterTestingAfter}    - TDS after
{branchId}             - Branch ID
```

---

### Step 5: Add Styling & Formatting

#### Borders and Boxes

1. Select text/section
2. **Home** → **Borders** → **Borders and Shading**
3. Choose style, color, width
4. Apply to paragraph or page

#### Colors and Backgrounds

1. Select text
2. **Home** → **Font Color** or **Highlight**
3. For page background:
   - **Design** → **Page Color**
   - Choose color or **Fill Effects** for gradients

#### Tables for Layout

1. **Insert** → **Table**
2. Use for structured layout
3. Hide borders if needed:
   - Select table → **Design** → **Borders** → **No Border**

#### Fonts and Sizes

- **Company Name**: 24-36pt, Bold
- **Headings**: 16-20pt, Bold
- **Labels**: 11-12pt, Bold
- **Values**: 11-12pt, Regular
- **Fine Print**: 8-9pt

---

### Step 6: Add Images and Graphics

#### Product Images

1. **Insert** → **Pictures**
2. Select image file
3. Resize and position
4. **Wrap Text** → **Square** or **Tight**

#### QR Codes (Optional)

1. Use online QR generator (qr-code-generator.com)
2. Generate QR with your website/contact
3. Download as PNG
4. Insert into document

#### Watermarks

1. **Design** → **Watermark**
2. Choose **Custom Watermark**
3. Add text or image
4. Set transparency

---

### Step 7: Save Your Template

#### Important: Save in .docx format!

1. **File** → **Save As**
2. Choose location: `src/assets/Warranty_pdf_template/`
3. **File name**: `WARRANTY CARD.docx`
4. **Save as type**: Word Document (*.docx)
5. Click **Save**

**⚠️ DO NOT save as .doc (old format) - only .docx works!**

---

## 📤 Upload Template to App

### Method 1: Via Admin Panel (Recommended)

1. Open your app
2. Login as **Admin**
3. Go to **Template Management**
4. Click **"Upload New Template"**
5. Select your edited `WARRANTY CARD.docx`
6. Wait for upload confirmation
7. ✅ Template is now active!

### Method 2: Use Default Template

1. Copy your edited file to: `src/assets/Warranty_pdf_template/WARRANTY CARD.docx`
2. In **Template Management**, click **"Use Default Template"**
3. ✅ Template is now active!

---

## 🧪 Testing Your Template

### Test Workflow:

1. **Create a test sale**:
   - Go to Sub-Branch dashboard
   - Click "Create Sale"
   - Fill in test customer data
   - Submit

2. **Generate warranty**:
   - Click on the sale
   - Click "Download Word (.docx)"
   - Wait for download

3. **Verify output**:
   - Open downloaded file
   - Check all placeholders are filled
   - Verify logos/images appear
   - Check formatting is correct
   - Ensure static pages are unchanged

4. **If issues**:
   - Check placeholder spelling
   - Verify curly braces `{}`
   - Re-upload template
   - Try again

---

## 💡 Design Tips & Best Practices

### ✅ DO:
- Use high-resolution logos (300 DPI minimum)
- Keep warranty card page simple and clean
- Use consistent fonts throughout
- Test with sample data before finalizing
- Save backup copies of your template
- Use tables for structured layouts
- Add page numbers in footer
- Include company contact info on every page

### ❌ DON'T:
- Use complex formatting around placeholders
- Put placeholders inside text boxes (may not work)
- Use very large images (keeps file size down)
- Change placeholder names
- Forget to save as .docx
- Use special characters in placeholders
- Make warranty card page too cluttered

---

## 🎨 Template Design Examples

### Minimal Design
```
Simple border
Company logo top-center
Warranty card in table format
Clean typography
White background
```

### Professional Design
```
Gradient header
Large company logo
Bordered sections
Icons for each field
Subtle background pattern
```

### Premium Design
```
Full-color cover page
Multiple product images
Detailed user manual
Branded color scheme
Professional photography
```

---

## 🔧 Advanced Customization

### Conditional Sections (Future Feature)
Currently, all pages are included. In future versions, you'll be able to:
```
{#hasWarranty}
  This section only appears if warranty exists
{/hasWarranty}
```

### Multiple Products (Future Feature)
```
{#products}
  Product: {name} - Price: {price}
{/products}
```

### Custom Fields
If you need additional fields, contact your developer to add them to the Sale interface.

---

## 📋 Quick Reference Checklist

Before uploading your template:

- [ ] Logo added and positioned correctly
- [ ] All static pages designed (cover, manual, terms)
- [ ] Warranty card page has all needed placeholders
- [ ] Placeholders use correct syntax: `{fieldName}`
- [ ] Formatting looks good
- [ ] File saved as .docx (not .doc)
- [ ] File size under 10MB
- [ ] Tested with sample data
- [ ] Backup copy saved

---

## 🆘 Troubleshooting

### Problem: Placeholders not replaced
**Solution**: Check spelling, ensure curly braces, no spaces

### Problem: Images not showing
**Solution**: Use Insert → Pictures, not copy-paste

### Problem: Formatting breaks
**Solution**: Avoid complex formatting near placeholders

### Problem: File too large
**Solution**: Compress images, remove unused pages

### Problem: Upload fails
**Solution**: Check file is .docx, under 10MB, valid format

---

## 📞 Support

For help with template editing:
- Email: ekotexelectricient@gmail.com
- See: WORD_TEMPLATE_SETUP.md
- See: WARRANTY_TEMPLATE_QUICKSTART.md

---

**Last Updated**: January 29, 2026
**Template Version**: 1.0
