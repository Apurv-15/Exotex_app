import { Asset } from 'expo-asset';
import { Paths, File } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Converts a local asset module to a Base64 data URI for more robust image loading in PDFs/WebViews.
 * This is especially useful for standalone Android/iOS builds where local file:// URIs may fail to load.
 */
export const getAssetBase64 = async (assetModule: any): Promise<string> => {
    try {
        const asset = Asset.fromModule(assetModule);
        await asset.downloadAsync();
        
        if (Platform.OS === 'web') {
            // On web, we can try to fetch the asset and convert it to base64 for maximum compatibility
            try {
                const response = await fetch(asset.uri);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (webError) {
                console.warn('Web asset base64 conversion failed, using URI:', webError);
                return asset.uri;
            }
        }

        // Determine mime type from asset extension
        const assetUri = asset.uri || '';
        const extension = assetUri.split('.').pop()?.toLowerCase().split('?')[0];
        let mimeType = 'image/png';
        if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
        else if (extension === 'svg') mimeType = 'image/svg+xml';

        // On Android standalone builds, asset.localUri can be:
        //   - null
        //   - a relative path like "assets_images_logo.png" (not a valid file:// URI)
        // So we explicitly download to a cache file to guarantee a valid file:// path.
        let localUri = asset.localUri;
        const isValidLocalUri = localUri && localUri.startsWith('file://');

        let file: File;
        if (!isValidLocalUri) {
            // Download the asset to a guaranteed local cache location
            const cacheFile = new File(Paths.cache, `asset_${asset.hash || Date.now()}.${extension || 'png'}`);
            
            // Check if already cached from a previous call
            if (!cacheFile.exists) {
                // asset.uri can be a CDN https:// URL or a bundled asset:// URI
                await File.downloadFileAsync(asset.uri, cacheFile);
            }
            file = cacheFile;
        } else {
            file = new File(localUri!);
        }

        const base64 = await file.base64();
        
        return `data:${mimeType};base64,${base64}`;
    } catch (error) {
        console.error('Error converting asset to base64:', error);
        // Fallback to whatever URI we have if conversion fails
        try {
            return Asset.fromModule(assetModule).uri;
        } catch {
            return '';
        }
    }
};
