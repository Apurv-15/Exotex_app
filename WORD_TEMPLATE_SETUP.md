# Word Template Setup Guide

## Overview
This guide explains how to set up a multi-page Word (.docx) template for warranty card generation. The template can contain 5-6 pages where only one page (the warranty card) is editable, and the rest remain static.

## Template Structure

Your Word document should follow this structure:

```
Page 1: Static Content (e.g., Cover Page)
Page 2: Static Content (e.g., User Manual)
Page 3: **EDITABLE WARRANTY CARD** (contains placeholders)
Page 4: Static Content (e.g., Terms & Conditions)
Page 5: Static Content (e.g., Additional Information)
Page 6: Static Content (e.g., Contact Information)
```

## Setting Up Placeholders

### Available Placeholders
In your editable warranty card page, use these placeholders:

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `{warrantyId}` | Unique warranty ID | WRT-2024-001 |
| `{customerName}` | Customer's full name | John Doe |
| `{phone}` | Customer phone number | +91 9876543210 |
| `{address}` | Customer address | 123 Main Street |
| `{city}` | Customer city | Mumbai |
| `{productModel}` | Product model name | EKOTEX-500W |
| `{serialNumber}` | Product serial number | SN12345678 |
| `{saleDate}` | Date of sale (formatted) | 29/01/2026 |

### How to Add Placeholders

1. Open your Word template
2. Navigate to the warranty card page
3. Place cursor where you want dynamic content
4. Type the placeholder exactly as shown above (including curly braces)
5. Example:
   ```
   Customer Name: {customerName}
   Warranty ID: {warrantyId}
   Product: {productModel}
   Serial Number: {serialNumber}
   Purchase Date: {saleDate}
   ```

## Template Best Practices

### 1. Keep Static Pages Untouched
- Pages without placeholders will remain exactly as designed
- You can include images, logos, formatted text, tables, etc.

### 2. Warranty Card Page Design
- Use tables for structured layout
- Apply borders and styling as needed
- Keep placeholder text readable
- Test with sample data before uploading

### 3. Formatting Tips
- Bold labels (e.g., **Customer Name:**)
- Use consistent font sizes
- Add company logo/branding
- Include ISO certification details
- Add contact information

## Example Warranty Card Page

```
╔═══════════════════════════════════════════════════╗
║                    EKOTEX                         ║
║     Energizing Future, eMpowering Excellence      ║
║        AN ISO 9001 - 2015 CERTIFIED COMPANY       ║
╠═══════════════════════════════════════════════════╣
║                  WARRANTY CARD                     ║
╠═══════════════════════════════════════════════════╣
║                                                    ║
║  Bill No: {warrantyId}        Date: {saleDate}    ║
║                                                    ║
║  Name of Purchaser: {customerName}                ║
║                                                    ║
║  Address: {address}                               ║
║           {city}                                  ║
║                                                    ║
║  Phone No: {phone}                                ║
║                                                    ║
║  Product Model: {productModel}                    ║
║  Serial Number: {serialNumber}                    ║
║                                                    ║
║  This warranty is valid for 1 year from purchase  ║
║                                                    ║
╚═══════════════════════════════════════════════════╝
```

## Uploading the Template

1. Go to the Admin Dashboard
2. Navigate to "Template Management"
3. Click "Upload New Template"
4. Select your .docx file
5. The template will be stored and used for all warranty generation

## Testing Your Template

After uploading:
1. Create a test sale entry
2. Generate the warranty document
3. Verify all pages appear correctly
4. Check that placeholders are replaced with actual data
5. Ensure static pages remain unchanged

## Troubleshooting

### Placeholders Not Replaced
- Ensure placeholders use curly braces: `{placeholder}`
- Check spelling matches exactly
- Remove any extra spaces inside braces

### Formatting Issues
- Avoid complex formatting around placeholders
- Use simple text formatting (bold, italic, underline)
- Test with different data lengths

### File Size
- Keep template under 10MB for optimal performance
- Compress images in static pages
- Remove unnecessary embedded objects

## Advanced Features

### Conditional Content (Future)
In future versions, you can use conditions:
```
{#hasWarranty}
This product has warranty
{/hasWarranty}
```

### Loops (For Multiple Products - Future)
```
{#products}
- {productName}: {productPrice}
{/products}
```

## Support

For issues or questions:
- Email: ekotexelectricient@gmail.com
- Check SUPABASE_SETUP.md for backend configuration
