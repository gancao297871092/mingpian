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

const config = mergeConfig(
  getRNConfig(__dirname),
  getExpoConfig(__dirname),
  {
    resolver: {
      resolveRequest: customResolveRequest,
    },
  },
);

// expo 的 transform-worker 输出 packed source map，但其 customSerializer 在
// dev bundle 时只返回 code 字符串，Metro 回退到默认 sourcemap 生成器会因
// 不识别 packed map 而报错（Unexpected module with full source map found）。
// 这里包一层：serializer 只返回字符串时，用 expo 的 sourceMapString 补齐 map。
const expoSerializer = config.serializer.customSerializer;
if (expoSerializer) {
  config.serializer.customSerializer = async (entryPoint, preModules, graph, options) => {
    const result = await expoSerializer(entryPoint, preModules, graph, options);
    if (typeof result !== 'string') {
      return result;
    }
    const { sourceMapString } = require('@expo/metro-config/build/serializer/sourceMap.js');
    const { getSortedModules } = require('@expo/metro-config/build/serializer/serializeChunks.js');
    const map = sourceMapString(
      [...preModules, ...getSortedModules([...graph.dependencies.values()], options)],
      {
        excludeSource: options.serializerOptions?.excludeSource ?? false,
        processModuleFilter: options.processModuleFilter,
        shouldAddToIgnoreList: options.shouldAddToIgnoreList,
      },
    );
    return { code: result, map };
  };
}

module.exports = config;
