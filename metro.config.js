const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    alias: {
      '@': path.resolve(__dirname),  // Resolving the @ alias to the root directory
    },
  },
};
