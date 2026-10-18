import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DonorHomeScreen from '../screens/donor/DonorHomeScreen';
import DonorRequestsScreen from '../screens/donor/DonorRequestsScreen';
import DonorHistoryScreen from '../screens/donor/DonorHistoryScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { shadows } from '../theme/shadows';

const Tab = createBottomTabNavigator();

export const DonorNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryRed,
        tabBarInactiveTintColor: colors.lightMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Requests') {
            iconName = focused ? 'water' : 'water-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DonorHomeScreen} />
      <Tab.Screen name="Requests" component={DonorRequestsScreen} />
      <Tab.Screen name="History" component={DonorHistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF', // White bottom tab bar as specified
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    paddingTop: 8,
    ...shadows.tabBar,
  },
  tabBarLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    letterSpacing: 0.1,
  },
});

export default DonorNavigator;
