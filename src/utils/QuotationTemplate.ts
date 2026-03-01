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
            padding: 25px 35px;
            line-height: 1.4;
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
        
        .divider-line { border-top: 2px solid #9EC9E0; margin: 12px 0; }

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

        .totals-wrap { display: flex; justify-content: flex-end; margin-top: 15px; }
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
            padding: 6px 0;
            font-size: 11px;
            margin-top: 15px;
        }

        .bottom-section { display: flex; justify-content: space-between; margin-top: 20px; }
        .bank-details { font-size: 11px; line-height: 1.5; }
        .signatory-box { text-align: center; }
        .sign-img { width: 120px; height: 70px; object-fit: contain; margin: 5px 0; }

        .terms { font-size: 10px; line-height: 1.5; margin-top: 20px; }
        .page-footer { margin-top: 25px; font-size: 10px; font-weight: 700; text-align: center; color: #666; }
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
        <div class="bank-details">
            <strong style="font-size: 14px; text-decoration: underline;">Bank Details:</strong><br>
            Bank: <strong>RBL Bank</strong><br>
            Account #: <strong>409002386042</strong><br>
            IFSC Code: <strong>RATN0000070</strong><br>
            Branch: <strong>MUMBAI - FORT</strong>
        </div>
        <div class="signatory-box">
            <div style="font-size: 12px;">For AOP ELECTRIFICIENT PRIVATE LIMITED</div>
            <img class="sign-img" src="${signStampUri}" />
            <div style="font-weight: bold; font-size: 12px; border-top: 1px solid #ddd; padding-top: 5px;">Authorized Signatory</div>
        </div>
    </div>

    <div class="terms">
        <strong style="text-decoration: underline;">Terms and Conditions:</strong><br>
        • Payment Terms - 100% Before Installation | GST - 18% At actual<br>
        • Installation - at your end<br>
        • Delivery - Within 2 working days<br>
        • Warranty - 10 Year's Coil Warranty & 2 Years Panel Warranty.<br>
        • (45 days warranty Return Policy applies)
    </div>

    <div class="page-footer">Page 1 / 1 • This is a digitally signed document.</div>

</body>
</html>`;
};
