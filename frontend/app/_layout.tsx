import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Colors from "@/constants/colors";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Ensure everything is properly initialized before hiding splash screen
      const initializeApp = async () => {
        try {
          // Add a longer delay to ensure root layout is fully mounted
          await new Promise(resolve => setTimeout(resolve, 1000));
          await SplashScreen.hideAsync();
          // Add another delay after hiding splash screen
          setTimeout(() => {
            setIsReady(true);
          }, 500);
        } catch (error) {
          console.error('Error during app initialization:', error);
          setIsReady(true);
        }
      };
      
      initializeApp();
    }
  }, [loaded]);

  // Don't render anything until fonts are loaded and app is ready
  if (!loaded || !isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: Colors.dark.text }}>Loading...</Text>
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
        <StatusBar style="light" />
        <Slot />
      </View>
    </GestureHandlerRootView>
  );
}