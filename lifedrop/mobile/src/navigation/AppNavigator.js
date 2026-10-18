import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
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

  // 2. No token -> AuthStack (Login, Register)
  if (!token) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // 3. Authenticated -> Role based navigation
  // DONOR -> DonorTabs; RECIPIENT -> RecipientTabs
  return (
    <NavigationContainer>
      {role === 'DONOR' ? (
        <DonorNavigator />
      ) : (
        <RecipientNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
