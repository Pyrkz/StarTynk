module.exports = (config) => {
  // Determine environment from ENV variable or default to development
  const environment = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  
  // Environment-specific configurations
  const envConfig = {
    development: {
      name: "StarTynk Dev",
      slug: "startynk-dev",
      scheme: "startynk-dev"
    },
    staging: {
      name: "StarTynk Staging", 
      slug: "startynk-staging",
      scheme: "startynk-staging"
    },
    production: {
      name: "StarTynk",
      slug: "startynk",
      scheme: "startynk"
    }
  };

  const currentEnvConfig = envConfig[environment] || envConfig.development;

  return {
    expo: {
      name: process.env.EXPO_PUBLIC_APP_NAME || currentEnvConfig.name,
      slug: currentEnvConfig.slug,
      version: process.env.EXPO_PUBLIC_APP_VERSION || "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: process.env.EXPO_PUBLIC_APP_SCHEME || currentEnvConfig.scheme,
      userInterfaceStyle: "automatic",
      extra: {
        environment: environment
      },
      splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      ios: {
        supportsTablet: true
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/images/adaptive-icon.png",
          backgroundColor: "#ffffff"
        }
      },
      web: {
        bundler: "metro",
        // Fix for React 19 server-side rendering issues
        build: {
          babel: {
            include: [
              "expo-router"
            ]
          }
        }
      },
      plugins: [
        "expo-router"
      ],
      experiments: {
        tsconfigPaths: true,
        // Disable server-side rendering to avoid React 19 hooks issues
        typedRoutes: true
      }
    }
  };
};