import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

export interface WarrantyTemplateData {
    // Customer Details
    warrantyId: string;
    customerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;

    // Product Details
    productModel: string;
    serialNumber: string;

    // Sale Details
    saleDate: string;
    date: string;

    // Executive/Plumber Details
    executiveName: string;
    designation: string;
    plumberName: string;

    // Water Testing
    waterTestingBefore: string;
    waterTestingAfter: string;

    // Branch
    branchId: string;
}

export const TemplateService = {
    /**
     * Fills a multi-page Word (.docx) template with warranty data
     * 
     * The template can contain 5-6 pages where:
     * - Static pages (e.g., user manual, terms) remain unchanged
     * - The warranty card page contains placeholders that get replaced
     * 
     * Supported placeholders:
     * {warrantyId}, {customerName}, {phone}, {address}, {city},
     * {productModel}, {serialNumber}, {saleDate}
     * 
     * @param templateUri - URI to the .docx template file
     * @param data - Object containing the warranty data to fill
     * @param outputFileName - Name for the generated file
     * @returns File URI on success, null on failure
     */
    fillDocxTemplate: async (
        templateUri: string,
        data: WarrantyTemplateData,
        outputFileName: string
    ): Promise<string | null> => {
        try {
            console.log('📄 Starting Word template generation...');
            console.log('Template URI:', templateUri);
            console.log('Output file:', outputFileName);
            console.log('Data to fill:', JSON.stringify(data, null, 2));

            let content;

            // Load template based on platform
            if (Platform.OS === 'web') {
                console.log('🌐 Loading template for web platform...');
                const response = await fetch(templateUri);
                if (!response.ok) {
                    throw new Error(`Failed to fetch template: ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                content = new Uint8Array(arrayBuffer);
                console.log('✅ Template loaded successfully (web)');
            } else {
                console.log('📱 Loading template for native platform...');
                const base64 = await FileSystem.readAsStringAsync(templateUri, {
                    encoding: 'base64',
                });
                content = Buffer.from(base64, 'base64');
                console.log('✅ Template loaded successfully (native)');
            }

            // Parse the Word document
            console.log('📦 Parsing Word document structure...');
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
                nullGetter: function (part: any) {
                    // Return empty string for undefined values instead of throwing error
                    console.warn(`⚠️ Placeholder "${part.value}" not found in data`);
                    return '';
                },
            });

            // Set the data to be replaced
            console.log('🔄 Setting template data...');
            doc.setData(data);

            try {
                // Render the document (replace placeholders)
                console.log('⚙️ Rendering document with data...');
                doc.render();
                console.log('✅ Document rendered successfully');
            } catch (error: any) {
                console.error('❌ Error rendering docx template:', error);

                // Provide detailed error information
                if (error.properties && error.properties.errors) {
                    console.error('Template errors:', error.properties.errors);
                }

                throw new Error(
                    `Template rendering failed: ${error.message}. ` +
                    `Please check that your template uses correct placeholder format: {placeholderName}`
                );
            }

            // Generate and save/download the filled document
            if (Platform.OS === 'web') {
                console.log('💾 Generating file for web download...');
                const output = doc.getZip().generate({
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });

                const url = window.URL.createObjectURL(output);
                const link = document.createElement('a');
                link.href = url;
                link.download = outputFileName;
                link.click();

                // Cleanup
                setTimeout(() => window.URL.revokeObjectURL(url), 100);

                console.log('✅ File downloaded successfully');
                return 'downloaded';
            } else {
                console.log('💾 Generating file for native sharing...');
                const base64Output = doc.getZip().generate({
                    type: 'base64',
                });

                // Use documentDirectory as string if property is missing from type
                const docDir = (FileSystem as any).documentDirectory;
                const fileUri = `${docDir}${outputFileName}`;

                console.log('📝 Writing file to:', fileUri);
                await FileSystem.writeAsStringAsync(fileUri, base64Output, {
                    encoding: 'base64',
                });

                console.log('📤 Sharing file...');
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    UTI: 'com.microsoft.word.doc',
                });

                console.log('✅ File shared successfully');
                return fileUri;
            }
        } catch (error: any) {
            console.error('❌ Failed to fill docx template:', error);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack,
            });
            return null;
        }
    },

    /**
     * Validates that a template file exists and is accessible
     */
    validateTemplate: async (templateUri: string): Promise<boolean> => {
        try {
            if (Platform.OS === 'web') {
                const response = await fetch(templateUri, { method: 'HEAD' });
                return response.ok;
            } else {
                const fileInfo = await FileSystem.getInfoAsync(templateUri);
                return fileInfo.exists;
            }
        } catch (error) {
            console.error('Template validation failed:', error);
            return false;
        }
    },

    /**
     * Formats sale data for template filling
     * Maps all Sale fields to template placeholders
     */
    formatSaleDataForTemplate: (sale: any): WarrantyTemplateData => {
        const defaultDate = new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        return {
            // Customer Details
            warrantyId: sale.warrantyId || '',
            customerName: sale.customerName || '',
            phone: sale.phone || '',
            email: sale.email || '',
            address: sale.address || '',
            city: sale.city || '',

            // Product Details
            productModel: sale.productModel || '',
            serialNumber: sale.serialNumber || '',

            // Sale Details
            saleDate: sale.saleDate || defaultDate,
            date: sale.date || defaultDate,

            // Executive/Plumber Details
            executiveName: sale.executiveName || '',
            designation: sale.designation || '',
            plumberName: sale.plumberName || '',

            // Water Testing
            waterTestingBefore: sale.waterTestingBefore || '',
            waterTestingAfter: sale.waterTestingAfter || '',

            // Branch
            branchId: sale.branchId || '',
        };
    },
};
