# Using the WARRANTY CARD.docx Template

## Current Template Location
`src/assets/Warranty_pdf_template/WARRANTY CARD.docx`

## Template Structure
This is a multi-page Word document containing:
- **Page 1-5**: Static user manual and product information pages
- **Page 6**: Editable warranty card with placeholders

## Required Placeholders in the Template
The warranty card page should contain these placeholders:

```
{warrantyId}      - Warranty/Bill number (e.g., WAR-490502)
{saleDate}        - Purchase date (e.g., 27/01/2026)
{customerName}    - Customer name (e.g., Apurv Deshmukh)
{address}         - Street address (e.g., 4/402 Highland Residency)
{city}            - City name (e.g., Mumbai)
{phone}           - Phone number (e.g., d4242323)
{productModel}    - Product model
{serialNumber}    - Serial number
```

## How It Works

### 1. Admin Uploads Template
- Admin goes to Template Management
- Uploads the WARRANTY CARD.docx file to Supabase storage
- System stores the template URL in local storage

### 2. User Generates Warranty
- User creates a sale with customer details
- On the warranty card screen, clicks "Download Word (.docx)"
- System fills the placeholders with actual customer data
- Generates a complete warranty document

### 3. Output
- All static pages remain unchanged
- Only the warranty card page gets filled with customer data
- User receives a professional multi-page warranty document

## Template Format
The placeholders must use **single curly braces**: `{placeholder}`

❌ Wrong: `{{customerName}}`
✅ Correct: `{customerName}`

## Testing the Template
To test if your template works correctly:
1. Open WARRANTY CARD.docx in Microsoft Word
2. Use Find (Ctrl+F / Cmd+F) to search for `{`
3. Verify all placeholders match the names listed above
4. Check that placeholders are on the warranty card page
5. Save the file

## Admin Setup
1. Go to **Admin Dashboard** → **Template Management**
2. Click **Upload New Template**
3. Select `WARRANTY CARD.docx`
4. Template becomes active immediately

## Fallback
If no template is uploaded, the system uses the default HTML-based PDF generation.
