export const generateFieldVisitHTML = (formData: any, logoUri: string, signStampUri?: string) => {
    const formattedDate = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const isResidential = formData.propertyType === 'Residential';

    // Helper to render array fields as comma-separated strings
    const formatArray = (arr: string[] | string) => {
        if (Array.isArray(arr)) return arr.join(', ') || 'N/A';
        return arr || 'N/A';
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Field Visit Report - EKOTEX</title>
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
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 10px;
        }
        
        .company-name {
            font-size: 36px;
            font-weight: bold;
            color: #000;
            letter-spacing: 4px;
        }
        
        .tagline {
            font-size: 12px;
            font-style: italic;
            color: #666;
            margin-top: 5px;
        }
        
        .report-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 30px;
            text-transform: uppercase;
            text-decoration: underline;
        }
        
        .section {
            margin-bottom: 25px;
        }
        
        .section-header {
            background-color: #f8fafc;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 16px;
            border-left: 4px solid #000;
            margin-bottom: 15px;
            text-transform: uppercase;
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
            font-size: 13px;
            color: #555;
            display: block;
            margin-bottom: 2px;
        }
        
        .info-value {
            font-size: 14px;
            padding: 4px 8px;
            background-color: #fff;
            border-bottom: 1px solid #eee;
        }
        
        .full-width {
            grid-column: span 2;
        }
        
        .footer {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }
        
        .signature-box {
            text-align: center;
            width: 200px;
        }
        
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 10px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .stamp-area {
            border: 1px dashed #ccc;
            height: 100px;
            width: 180px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #999;
            margin-bottom: 10px;
        }

        .meta-info {
            font-size: 10px;
            color: #999;
            text-align: right;
            margin-top: 40px;
        }

        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .container {
                border: none;
                box-shadow: none;
                width: 100%;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUri}" alt="EKOTEX Logo" class="logo">
            <div class="company-name">EKOTEX</div>
            <div class="tagline">Energizing Future, eMpowering Excellence.....</div>
        </div>
        
        <div class="report-title">Field Visit Report (${formData.propertyType || 'General'})</div>
        
        <div class="section">
            <div class="section-header">1. Client & Site Information</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Date of Visit:</span><div class="info-value">${formData.dateOfVisit}</div></div>
                <div class="info-item"><span class="info-label">Branch Name:</span><div class="info-value">${formData.branchName}</div></div>
                <div class="info-item"><span class="info-label">Sales / Engineer Name:</span><div class="info-value">${formData.salesEngineerName}</div></div>
                <div class="info-item"><span class="info-label">Client / Company Name:</span><div class="info-value">${formData.clientCompanyName}</div></div>
                <div class="info-item full-width"><span class="info-label">Site Address:</span><div class="info-value">${formData.siteAddress}</div></div>
                <div class="info-item"><span class="info-label">Contact Person:</span><div class="info-value">${formData.contactPersonName}</div></div>
                <div class="info-item"><span class="info-label">Designation:</span><div class="info-value">${formData.designation}</div></div>
                <div class="info-item"><span class="info-label">Mobile Number:</span><div class="info-value">${formData.mobileNumber}</div></div>
                <div class="info-item"><span class="info-label">Email ID:</span><div class="info-value">${formData.emailId}</div></div>
            </div>
        </div>

        ${isResidential ? `
        <div class="section">
            <div class="section-header">2. Residential Details</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Tank Capacity:</span><div class="info-value">${formData.tankCapacity || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Current TDS:</span><div class="info-value">${formData.waterTDS || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Pipe Size:</span><div class="info-value">${formData.pipeLineSize || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Has Water Purifier:</span><div class="info-value">${formData.hasWaterPurifier ? 'Yes (' + formData.waterPurifierBrand + ')' : 'No'}</div></div>
                <div class="info-item"><span class="info-label">Water Quality Issues:</span><div class="info-value">${formatArray(formData.waterQualityIssues)}</div></div>
                <div class="info-item"><span class="info-label">Health Concerns:</span><div class="info-value">${formatArray(formData.healthConcerns)}</div></div>
                <div class="info-item"><span class="info-label">Appliance Issues:</span><div class="info-value">${formatArray(formData.applianceIssues)}</div></div>
                <div class="info-item"><span class="info-label">Cleaning Concerns:</span><div class="info-value">${formatArray(formData.cleaningConcerns)}</div></div>
            </div>
        </div>
        ` : `
        <div class="section">
            <div class="section-header">2. Water Quality & Application Details</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Water Source:</span><div class="info-value">${formatArray(formData.waterSource)} ${formData.waterSourceOther ? '(' + formData.waterSourceOther + ')' : ''}</div></div>
                <div class="info-item"><span class="info-label">Daily Consumption:</span><div class="info-value">${formData.dailyWaterConsumption || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Purpose of Usage:</span><div class="info-value">${formatArray(formData.purposeOfWaterUsage)}</div></div>
                <div class="info-item"><span class="info-label">Water Hardness (PPM):</span><div class="info-value">${formData.waterHardnessPPM || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Scaling Observed:</span><div class="info-value">${formData.scalingIssueObserved || 'N/A'}</div></div>
                <div class="info-item full-width"><span class="info-label">Scaling Description:</span><div class="info-value">${formData.scalingDescription || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Application Area:</span><div class="info-value">${formatArray(formData.applicationArea)}</div></div>
                <div class="info-item"><span class="info-label">Pipeline Size:</span><div class="info-value">${formData.pipeLineSize || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Operating Pressure:</span><div class="info-value">${formData.operatingPressure || 'N/A'}</div></div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">3. Existing System & Problems</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Existing Treatment:</span><div class="info-value">${formData.existingWaterTreatment || 'N/A'}</div></div>
                <div class="info-item full-width"><span class="info-label">System Details:</span><div class="info-value">${formData.existingSystemDetails || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Problems Faced:</span><div class="info-value">${formatArray(formData.problemsFaced)}</div></div>
                <div class="info-item"><span class="info-label">Maintenance Frequency:</span><div class="info-value">${formData.maintenanceFrequency || 'N/A'}</div></div>
                <div class="info-item full-width"><span class="info-label">Customer Expectations:</span><div class="info-value">${formData.customerExpectations || 'N/A'}</div></div>
            </div>
        </div>
        `}

        <div class="section">
            <div class="section-header">Technical Observations & Action Plan</div>
            <div class="info-grid">
                <div class="info-item"><span class="info-label">Installation Feasible:</span><div class="info-value">${formData.ekotexInstallationFeasible || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Recommended Model:</span><div class="info-value">${formData.recommendedEkotexModel || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Quantity Required:</span><div class="info-value">${formData.quantityRequired || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Customer Interest:</span><div class="info-value">${formData.customerInterestLevel || 'N/A'}</div></div>
                <div class="info-item"><span class="info-label">Next Action:</span><div class="info-value">${formatArray(formData.nextActionRequired)}</div></div>
                <div class="info-item"><span class="info-label">Follow-up Date:</span><div class="info-value">${formData.expectedFollowUpDate || 'N/A'}</div></div>
                <div class="info-item full-width"><span class="info-label">Engineer Remarks:</span><div class="info-value">${formData.salesEngineerRemarks || 'N/A'}</div></div>
                <div class="info-item full-width"><span class="info-label">Customer Remarks:</span><div class="info-value">${formData.customerRemarks || 'N/A'}</div></div>
            </div>
        </div>

        <div class="footer">
            <div class="signature-box">
                <div class="stamp-area">Company Stamp</div>
                <div class="signature-line">Authorized Signatory</div>
            </div>
            
            <div class="signature-box">
                <div style="height: 100px;"></div>
                <div class="signature-line">Customer Signature</div>
            </div>
        </div>

        <div class="meta-info">
            Generated on ${new Date().toLocaleString('en-IN')} | EKOTEX Digital Field Report
        </div>
    </div>
</body>
</html>
    `;
};
