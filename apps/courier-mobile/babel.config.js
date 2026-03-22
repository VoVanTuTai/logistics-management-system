module.exports = function(api) {
  api.cache(true);
  const expoPreset = require.resolve('babel-preset-expo');
  return {
    presets: [expoPreset],
    plugins: ['react-native-reanimated/plugin'],
  };
};
