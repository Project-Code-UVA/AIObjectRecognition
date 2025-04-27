import 'dotenv/config';

export default {
  expo: {
    name: "A.Eyes",
    slug: "a-eyes",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    newArchEnabled: true,
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "A.Eyes needs access to your camera to capture images for analysis and description."
      },
      newArchEnabled: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: ["android.permission.CAMERA"],
      newArchEnabled: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "A.Eyes needs access to your camera to capture images for analysis and description."
        }
      ]
    ],
    extra: {
      HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    },
  },
};