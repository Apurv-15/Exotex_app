# Warranty Card Template Quick Start

## What's New?
Your warranty card generation now supports **multi-page Word document templates**! 

Instead of generating a simple 1-page warranty card, you can now use a professional 5-6 page document that includes:
- ✅ Cover page
- ✅ User manual
- ✅ **Editable warranty card** (with customer details)
- ✅ Terms & conditions
- ✅ Warranty policy
- ✅ Contact information

## How It Works

### 1. Template Structure
- **Static Pages**: Pages without placeholders remain exactly as designed
- **Dynamic Page**: The warranty card page contains placeholders that get filled with customer data

### 2. Supported Placeholders
Use these in your Word template (with single curly braces):

```
{warrantyId}       → Warranty ID number
{customerName}     → Customer's full name  
{phone}            → Phone number
{address}          → Street address
{city}             → City name
{productModel}     → Product model name
{serialNumber}     → Serial number
{saleDate}         → Sale date (DD/MM/YYYY format)
```

### 3. Example Warranty Card Page
```
╔════════════════════════════════════════╗
║           EKOTEX WARRANTY CARD         ║
╠════════════════════════════════════════╣
║                                        ║
║  Warranty ID: {warrantyId}            ║
║  Date: {saleDate}                     ║
║                                        ║
║  Customer: {customerName}             ║
║  Phone: {phone}                       ║
║  Address: {address}, {city}           ║
║                                        ║
║  Product: {productModel}              ║
║  Serial: {serialNumber}               ║
║                                        ║
╚════════════════════════════════════════╝
```

## Setup Steps

### For Administrators:
1. Go to **Admin Dashboard** → **Template Management**
2. Click "Upload New Template"
3. Select your `.docx` file (prepared with placeholders)
4. Template is now active for all warranty generation

### For Sub-Branch Users:
1. Create a sale as usual through **Create Sale** screen
2. On the warranty card screen, you'll see two buttons:
   - **Download PDF** - Quick one-page PDF (default)
   - **Download Word (.docx)** - Full multi-page document (if admin uploaded template)
3. Click **Download Word (.docx)** to generate the full document

## File Locations

- **Current Template**: `src/assets/Warranty_pdf_template/WARRANTY CARD.docx`
- **Template Service**: `src/services/TemplateService.ts`
- **Admin Screen**: `src/screens/admin/TemplateManagement.tsx`
- **Download Screen**: `src/screens/warranty/WarrantyCard.tsx`

## Technical Details

### Dependencies
- `docxtemplater` - Template filling engine
- `pizzip` - Handles .docx ZIP structure
- `expo-file-system` - File operations
- `expo-sharing` - Share generated files

### Workflow
1. User creates a sale entry
2. System navigates to warranty card screen
3. User clicks "Download Word (.docx)"
4. System:
   - Loads template from storage
   - Fills placeholders with sale data
   - Generates new .docx file
   - Downloads/shares the file

### Storage
Templates are stored in:
- **Supabase Storage**: `warranty-templates` bucket
- **Local Config**: Stored in AsyncStorage/SecureStore as `WARRANTY_TEMPLATE_CONFIG`

## Troubleshooting

### ❌ "No Template Available"
**Solution**: Admin needs to upload a template via Template Management screen

### ❌ Template placeholders not replaced
**Solution**: Ensure placeholders use single curly braces `{placeholder}`, not double `{{placeholder}}`

### ❌ "Failed to generate document"
**Solutions**:
1. Check template file is valid .docx format
2. Ensure template is accessible (not deleted from storage)
3. Verify placeholders match exactly (case-sensitive)

### ❌ Formatting looks wrong
**Solutions**:
1. Use simple formatting around placeholders
2. Avoid complex tables or nested structures near placeholders
3. Test template with sample data before uploading

## Future Enhancements

### Planned Features:
- [ ] Multiple template versions
- [ ] Template preview before generation
- [ ] Conditional sections (show/hide based on data)
- [ ] Multi-product support (loops)
- [ ] PDF generation from .docx template
- [ ] Custom branding per branch

## Support

For detailed setup instructions, see: **WORD_TEMPLATE_SETUP.md**

For Supabase configuration, see: **SUPABASE_SETUP.md**

For security guidelines, see: **SECURITY.md**

---
**Last Updated**: January 29, 2026
