import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

export const TemplateService = {
    fillDocxTemplate: async (templateUri: string, data: any, outputFileName: string): Promise<string | null> => {
        try {
            let content;

            if (Platform.OS === 'web') {
                const response = await fetch(templateUri);
                const arrayBuffer = await response.arrayBuffer();
                content = new Uint8Array(arrayBuffer);
            } else {
                const base64 = await FileSystem.readAsStringAsync(templateUri, {
                    encoding: 'base64',
                });
                content = Buffer.from(base64, 'base64');
            }

            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, {
                paragraphLoop: true,
                linebreaks: true,
            });

            // Set the data to be replaced
            doc.setData(data);

            try {
                // Render the document
                doc.render();
            } catch (error: any) {
                console.error('Error rendering docx template:', error);
                throw error;
            }

            if (Platform.OS === 'web') {
                const output = doc.getZip().generate({
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });
                const url = window.URL.createObjectURL(output);
                const link = document.createElement('a');
                link.href = url;
                link.download = outputFileName;
                link.click();
                window.URL.revokeObjectURL(url);
                return 'downloaded';
            } else {
                const base64Output = doc.getZip().generate({
                    type: 'base64',
                });

                // Use documentDirectory as string if property is missing from type
                const docDir = (FileSystem as any).documentDirectory;
                const fileUri = `${docDir}${outputFileName}`;

                await FileSystem.writeAsStringAsync(fileUri, base64Output, {
                    encoding: 'base64',
                });

                await Sharing.shareAsync(fileUri);
                return fileUri;
            }
        } catch (error) {
            console.error('Failed to fill docx template:', error);
            return null;
        }
    }
};
