const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for Rive animations
config.resolver.assetExts.push('riv');

// Ensure proper module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;