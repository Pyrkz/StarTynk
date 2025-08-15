const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Reset cache on file changes
config.resetCache = true;

module.exports = withNativeWind(config, { input: "./src/styles/global.css" });