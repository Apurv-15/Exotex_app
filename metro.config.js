const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add pdf extension to asset extensions
config.resolver.assetExts.push('pdf');

// Ensure proper resolution of node_modules
config.resolver.nodeModulesPaths = [
    require('path').resolve(__dirname, 'node_modules'),
];

// Add source extensions for better module resolution
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
