export const generateQuotationHTML = (formData: any, logoUri: string, signStampUri: string, userRegion: string) => {

    /** Convert integer to Indian words for the PDF */
    const numberToWords = (num: number): string => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
            'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convert = (n: number): string => {
            if (n < 20) return ones[n];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
        };
        const res = convert(Math.round(num));
        return res ? res : 'Zero';
    };

    const fmt2 = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // MATH LOGIC
    const rate = parseFloat(formData.rate) || 0;
    const qty = parseFloat(formData.qty) || 0;
    const discountPerc = parseFloat(formData.discountPerc) || 0;

    const discountedRate = rate * (1 - discountPerc / 100);
    const taxableValue = discountedRate * qty;
    const gst = taxableValue * 0.18;
    const rawTotal = taxableValue + gst;
    const roundedTotal = Math.round(rawTotal);
    const roundOff = roundedTotal - rawTotal;
    const totalDiscount = (rate * qty) - taxableValue;

    const billingHtml = (formData.billingAddress || '').replace(/\n/g, '<br>');
    const shippingHtml = (formData.shippingAddress || formData.billingAddress || '').replace(/\n/g, '<br>');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation – ${formData.quotationNo}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        
        @page {
            size: A4;
            margin: 0;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Roboto', 'Arial', sans-serif;
            font-size: 12px;
            color: #111;
            background: #fff;
            padding: 20px 30px;
            line-height: 1.3;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
        }

        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .header-left { flex: 1; }
        .header-right { text-align: right; }

        .quotation-label {
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 5px;
            color: #6ab0d4;
            margin-bottom: 6px;
        }
        .company-name {
            font-size: 20px;
            font-weight: 700;
            color: #111;
            margin-bottom: 3px;
            text-transform: uppercase;
        }
        .company-info { font-size: 11px; line-height: 1.4; color: #111; }
        .original-label { font-size: 10px; font-weight: 700; color: #111; letter-spacing: 0.5px; }
        .logo { width: 130px; height: auto; margin-top: 5px; }

        /* Removed neon highlighter background-color: #FAED27; */
        .hl { font-weight: 700; display: inline-block; text-decoration: underline; }

        .meta-row { display: flex; gap: 0; margin-top: 10px; margin-bottom: 10px; }
        .meta-cell { flex: 1; font-size: 13px; }

        .addr-row { display: flex; gap: 20px; margin-bottom: 15px; }
        .addr-col { flex: 1; font-size: 11px; line-height: 1.4; }
        
        .divider-line { border-top: 2px solid #9EC9E0; margin: 8px 0; }

        table.items { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
        table.items th {
            padding: 6px 6px;
            text-align: left;
            font-weight: 700;
            font-size: 11px;
            border-top: 2px solid #9EC9E0;
            border-bottom: 2px solid #9EC9E0;
            background: #fff;
        }
        table.items td { padding: 8px 6px; vertical-align: top; border-bottom: 1px solid #f0f0f0; }
        .r { text-align: right; }
        .c { text-align: center; }

        .totals-wrap { display: flex; justify-content: flex-end; margin-top: 8px; }
        table.totals { width: 45%; border-collapse: collapse; font-size: 13px; }
        table.totals td { padding: 4px 6px; text-align: right; }
        .total-row td {
            font-size: 18px;
            font-weight: 700;
            border-top: 2px solid #111;
            padding-top: 6px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            border-top: 2px solid #9EC9E0;
            border-bottom: 2px solid #9EC9E0;
            padding: 4px 0;
            font-size: 11px;
            margin-top: 8px;
        }

        .bottom-section { display: flex; justify-content: space-between; margin-top: 10px; }
        .bank-details { font-size: 11px; line-height: 1.5; }
        .signatory-box { text-align: center; }
        .sign-img { width: 120px; height: 70px; object-fit: contain; margin: 5px 0; }

        .terms { font-size: 11px; line-height: 1.3; margin-top: 10px; color: #111; }
        .sust-box { margin-bottom: 10px; width: 80%; }
        .sust-text { font-size: 10px; font-weight: 400; color: #333; margin-bottom: 3px; }
        .leaf-icon { width: 40px; height: 40px; color: #2ecc71; }
    </style>
</head>
<body>

    <div class="header">
        <div class="header-left">
            <div class="quotation-label">Q U O T A T I O N</div>
            <div class="company-name">AOP ELECTRIFICIENT PRIVATE LIMITED</div>
            <div class="company-info">
                Head Office : GSTIN 27ABBCA8720E1ZW &nbsp; PAN ABBCA8720E<br>
                PLOT NO B 19/18, COCA COLA COMPOUND<br>
                Ambad MIDC, Nashik, MAHARASHTRA, 422010<br>
                Email: <strong>ekotexelectrificient@gmail.com</strong><br>
                Website: <strong>www.ekotexelectrificient.com</strong><br>
                <div style="margin-top:8px; font-size: 13px; font-weight: 700;">Branch Office : (${userRegion})</div>
            </div>
        </div>
        <div class="header-right">
            <div class="original-label">ORIGINAL FOR RECIPIENT</div>
            <img class="logo" src="${logoUri}" />
        </div>
    </div>

    <div class="meta-row">
        <div class="meta-cell"><strong>Quotation #: ${formData.quotationNo}</strong></div>
        <div class="meta-cell"><strong>Quotation Date: ${formData.quotationDate}</strong></div>
        <div class="meta-cell"><strong>Validity: ${formData.validity}</strong></div>
    </div>

    <div class="addr-row">
        <div class="addr-col">
            <span style="font-weight: 700; text-decoration: underline;">Customer Details:</span><br>
            <strong style="font-size: 14px;">${formData.customerName}</strong><br>
            <strong>${formData.companyName}</strong><br>
            Ph: ${formData.phone}<br>
            ${formData.email}
        </div>
        <div class="addr-col">
            <span style="font-weight: 700; text-decoration: underline;">Billing Address:</span><br>
            ${billingHtml}
        </div>
        <div class="addr-col">
            <span style="font-weight: 700; text-decoration: underline;">Shipping Address:</span><br>
            ${shippingHtml}
        </div>
    </div>

    <div class="divider-line"></div>
    <table class="items">
        <thead>
            <tr>
                <th style="width:5%">#</th>
                <th style="width:35%">Item</th>
                <th class="r" style="width:15%">Rate / Item</th>
                <th class="c" style="width:10%">Qty</th>
                <th class="r" style="width:12%">Taxable</th>
                <th class="r" style="width:12%">GST (18%)</th>
                <th class="r" style="width:11%">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>1</td>
                <td>
                    <strong style="font-size: 14px;">${formData.itemName}</strong><br>
                    <span style="color:#555; font-size: 11px;">${formData.itemDescription}</span>
                </td>
                <td class="r">
                    <strong>${fmt2(discountedRate)}</strong><br>
                    <span style="text-decoration: line-through; color: #999; font-size: 11px;">${fmt2(rate)}</span><br>
                    <span style="font-size: 11px;">(-${formData.discountPerc}%)</span>
                </td>
                <td class="c">${formData.qty} NOS</td>
                <td class="r">${fmt2(taxableValue)}</td>
                <td class="r">${fmt2(gst)}</td>
                <td class="r"><strong>${fmt2(taxableValue + gst)}</strong></td>
            </tr>
        </tbody>
    </table>
    <div class="divider-line"></div>

    <div class="totals-wrap">
        <table class="totals">
            <tr><td>Taxable Amount</td><td><strong>INR ${fmt2(taxableValue)}</strong></td></tr>
            <tr><td>GST 18.0%</td><td><strong>INR ${fmt2(gst)}</strong></td></tr>
            <tr><td>Round Off</td><td><strong>${roundOff > 0 ? '+' : ''}${roundOff.toFixed(2)}</strong></td></tr>
            <tr class="total-row">
                <td>Total</td>
                <td>INR ${fmt2(roundedTotal)}</td>
            </tr>
            <tr><td><span style="color: #666">Total Discount</span></td><td><strong>INR ${fmt2(totalDiscount)}</strong></td></tr>
        </table>
    </div>

    <div class="summary-row">
        <div>Total Items / Qty : 1 / ${formData.qty}</div>
        <div style="text-align: right">Total amount (in words): <strong>INR ${numberToWords(roundedTotal)} Rupees Only.</strong></div>
    </div>

    <div class="bottom-section">
        <!-- Bank Details Section Removed as per request -->
        <!-- 
        <div class="bank-details">
            <strong style="font-size: 14px; text-decoration: underline;">Bank Details:</strong><br>
            Bank: <strong>RBL Bank</strong><br>
            Account #: <strong>409002386042</strong><br>
            IFSC Code: <strong>RATN0000070</strong><br>
            Branch: <strong>MUMBAI - FORT</strong>
        </div>
        -->
        <div class="signatory-box">
            <div style="font-size: 12px;">For AOP ELECTRIFICIENT PRIVATE LIMITED</div>
            <img class="sign-img" src="${signStampUri}" />
            <div style="font-weight: bold; font-size: 12px; border-top: 1px solid #ddd; padding-top: 5px;">Authorized Signatory</div>
        </div>
    </div>

    <div class="terms">
        <div class="sust-box">
            <div class="sust-text">
                At <strong>EKOTEX</strong>, sustainability is more than a promise—it’s a practice. Through our
                ongoing environmental initiatives, we actively contribute to tree plantation
                drives in India and abroad. Whether it’s offsetting emissions or restoring green
                cover, we proudly support reforestation programs as part of our broader mission
                to promote a cleaner, greener planet.
            </div>
            <svg class="leaf-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8.12,20C11,20 14.27,15.5 17,8M8.27,18C7.38,18 6.54,17.22 6.54,16.26C6.54,15.47 7,14.74 8.19,13.64C8.85,13.04 9.11,12.73 9.42,12.06C9.17,13.33 8.35,14.65 7.63,15.42C7.3,15.77 7.08,16 7.08,16.26C7.08,16.5 7.19,16.73 7.82,16.73C8.44,16.73 8.79,16.4 9,16.03C9.33,15.46 9.44,14.88 10,14.03C10.74,12.91 11.53,11.5 11.53,10.15C11.53,9.5 11.3,9.04 10.96,8.73C11.69,8.4 12.44,8.19 13.04,8.19C14.6,8.19 17,10.3 17,13C17,17 12.35,20 8.12,20L8.27,18M21,2C18,2 14.5,3.5 12,7C14,10 21,11 21,11C21,11 21,2 21,2Z"/>
            </svg>
        </div>

        <strong style="font-size: 12px;">Terms and Conditions:</strong><br>
        <div style="font-size: 11px; margin-top: 3px;">Payment Terms - 100% Before Installation</div>

        <div style="font-size: 11px; margin-top: 2px;">GST - 18% At actual</div>
        
        <div style="font-size: 11px; margin-top: 2px;">Installation - at your end (Only Plumbing Exp)</div>

        <div style="font-size: 11px; margin-top: 2px;">Delivery - Within 2 days</div>

        <div style="font-size: 11px; margin-top: 2px;">Warranty - 10 Year's Coil Warranty & 2 Years Panel Warranty.</div>
        <div style="font-size: 11px;">(45 days warranty Return Policy for Residential only)</div>

        <div style="font-size: 11px; margin-top: 2px;">Material : 100% Stainless Steel</div>
    </div>

    <div class="page-footer">Page 1 / 1 • This is a digitally signed document.</div>

</body>
</html>`;
};
