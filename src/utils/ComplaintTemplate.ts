export const generateComplaintPDFHTML = (complaint: any, logoUri: string) => {
    const formattedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complaint Report - EKOTEX</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        
        .container {
            background-color: white;
            border: 1px solid #ddd;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #2D6A4F;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 10px;
        }
        
        .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #1B4332;
            letter-spacing: 2px;
        }
        
        .report-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 30px;
            color: #2D6A4F;
            text-transform: uppercase;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-header {
            background-color: #D8F3DC;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 15px;
            border-left: 5px solid #2D6A4F;
            margin-bottom: 15px;
            color: #1B4332;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .info-item {
            margin-bottom: 10px;
        }
        
        .info-label {
            font-weight: bold;
            font-size: 12px;
            color: #555;
            display: block;
            margin-bottom: 2px;
        }
        
        .info-value {
            font-size: 14px;
            color: #000;
        }
        
        .full-width {
            grid-column: span 2;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            background-color: #D8F3DC;
            color: #1B4332;
        }
        
        .footer {
            margin-top: 50px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-box {
            text-align: center;
            width: 200px;
        }
        
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
            font-size: 12px;
        }

        .meta-info {
            font-size: 10px;
            color: #999;
            text-align: center;
            margin-top: 40px;
        }

        @media print {
            body { background-color: white; padding: 0; }
            .container { border: none; box-shadow: none; width: 100%; max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUri}" alt="EKOTEX Logo" class="logo">
            <div class="company-name">EKOTEX</div>
            <div style="font-size: 12px; color: #666;">Energizing Future, eMpowering Excellence</div>
        </div>
        
        <div class="report-title">Complaint Registration Report</div>
        
        <div class="section">
            <div class="section-header">Reference & Status</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Complaint ID:</span><div class="info-value"><strong>${complaint.complaintId}</strong></div></div>
                <div class="info-item"><span class="info-label">Status:</span><div class="status-badge">${complaint.status}</div></div>
                <div class="info-item"><span class="info-label">Date of Complaint:</span><div class="info-value">${complaint.dateOfComplaint}</div></div>
                <div class="info-item"><span class="info-label">Invoice Number:</span><div class="info-value">${complaint.invoiceNo}</div></div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">Customer Information</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Customer Name:</span><div class="info-value">${complaint.customerName}</div></div>
                <div class="info-item"><span class="info-label">Contact Number:</span><div class="info-value">${complaint.customerPhone}</div></div>
                <div class="info-item full-width"><span class="info-label">Address / City:</span><div class="info-value">${complaint.city || 'N/A'}</div></div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">Complaint Details</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Category:</span><div class="info-value">${complaint.category}</div></div>
                <div class="info-item"><span class="info-label">Assigned Department:</span><div class="info-value">${complaint.assignedDepartment || 'N/A'}</div></div>
                <div class="info-item full-width"><span class="info-label">Description:</span><div class="info-value">${complaint.description}</div></div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">Resolution & Feedback</div>
            <div class="info-grid">
                <div class="info-item full-width"><span class="info-label">Action Taken:</span><div class="info-value">${complaint.actionTaken || 'Pending'}</div></div>
                <div class="info-item"><span class="info-label">Resolved By:</span><div class="info-value">${complaint.resolvedByName || 'N/A'} (${complaint.resolvedByDesignation || 'N/A'})</div></div>
                <div class="info-item"><span class="info-label">Client Confirmation:</span><div class="info-value">${complaint.clientConfirmation || 'N/A'}</div></div>
                <div class="info-item full-width"><span class="info-label">Client Feedback:</span><div class="info-value">${complaint.clientFeedback || 'N/A'}</div></div>
            </div>
        </div>

        <div class="footer">
            <div class="signature-box">
                <div class="signature-line">Authorized Signatory</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">Customer Signature</div>
            </div>
        </div>

        <div class="meta-info">
            Generated by EKOTEX Service Portal on ${new Date().toLocaleString('en-IN')}
        </div>
    </div>
</body>
</html>
    `;
};
