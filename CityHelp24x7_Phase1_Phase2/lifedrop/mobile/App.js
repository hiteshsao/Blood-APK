import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from './src/context/AuthContext';
import { AppConfigProvider } from './src/context/AppConfigContext';
import { CityProvider } from './src/context/CityContext';
import './src/modules/services';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  // Fonts load in a moment; keep the brand colour on screen so the animated intro
  // (AppNavigator -> SplashScreen) starts only once, with the right fonts.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.brand.dark }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppConfigProvider>
          <CityProvider>
            <StatusBar style="dark" backgroundColor="#F5F7FB" />
            <AppNavigator />
          </CityProvider>
        </AppConfigProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
