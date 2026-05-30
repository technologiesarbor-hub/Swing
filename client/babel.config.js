/**
 * Babel config for Expo SDK 54 + Reanimated 4.
 *
 * `react-native-worklets/plugin` MUST be listed last. Without it,
 * `useSharedValue` / `useAnimatedStyle` callbacks silently never compile
 * into worklets, so animations never actually update on the UI thread.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
