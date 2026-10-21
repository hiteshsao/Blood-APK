import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { navigationRef, consumePendingNavigation } from './navigationRef';
import SplashScreen from '../screens/common/SplashScreen';
import AuthNavigator from './AuthNavigator';
import DonorNavigator from './DonorNavigator';
import RecipientNavigator from './RecipientNavigator';

export const AppNavigator = () => {
  const { token, role, loading } = useAuth();

  // 1. Loading state -> SplashScreen
  if (loading) {
    return <SplashScreen />;
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
        ) : role === 'DONOR' ? (
          <DonorNavigator />
        ) : (
          <RecipientNavigator />
        )}
      </NavigationContainer>
    </NotificationProvider>
  );
};

export default AppNavigator;
