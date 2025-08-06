const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for 3D model files
config.resolver.assetExts.push('glb', 'gltf');

// Ensure proper module resolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config; 