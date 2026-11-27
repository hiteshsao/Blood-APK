import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { navigationRef, consumePendingNavigation } from './navigationRef';
import SplashScreen from '../screens/common/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export const AppNavigator = () => {
  const { token, loading } = useAuth();
  const [introDone, setIntroDone] = useState(false);

  // 1. Animated opening: plays once, waits for auth to load, then fades into the app.
  if (!introDone) {
    return <SplashScreen ready={!loading} onFinish={() => setIntroDone(true)} />;
  }

  return (
    <NotificationProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          consumePendingNavigation();
        }}
      >
        {!token ? (
          <AuthNavigator />
        ) : (
          <MainNavigator />
        )}
      </NavigationContainer>
    </NotificationProvider>
  );
};

export default AppNavigator;
