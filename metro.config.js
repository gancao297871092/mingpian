const { getDefaultConfig: getRNConfig, mergeConfig } = require('@react-native/metro-config');
const { getDefaultConfig: getExpoConfig } = require('expo/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const customResolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const absolutePath = path.resolve(__dirname, moduleName.replace('@/', './src/'));
    return context.resolveRequest(context, absolutePath, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = mergeConfig(
  getRNConfig(__dirname),
  getExpoConfig(__dirname),
  {
    resolver: {
      resolveRequest: customResolveRequest,
    },
  },
);
