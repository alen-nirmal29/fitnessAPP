import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
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

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
        <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.dark.background,
          },
          headerTintColor: Colors.dark.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: Colors.dark.background,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen 
          name="onboarding/profile" 
          options={{ 
            title: "Your Profile",
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="onboarding/goals" 
          options={{ 
            title: "Fitness Goals",
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="onboarding/body-composition" 
          options={{ 
            title: "Body Composition",
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="onboarding/body-model" 
          options={{ 
            title: "Body Model",
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="onboarding/specific-goals" 
          options={{ 
            title: "Specific Goals",
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="workout/plan-selection" 
          options={{ 
            title: "Workout Plans",
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="workout/plan-generator" 
          options={{ 
            title: "Generate Workout Plan",
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="workout/plan-details" 
          options={{ 
            title: "Plan Details",
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="workout/session" 
          options={{ 
            title: "Workout Session",
            headerShown: true,
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="edit-profile" 
          options={{ 
            title: "Edit Profile",
            headerShown: false,
          }} 
        />
      </Stack>
      </View>
    </GestureHandlerRootView>
  );
}