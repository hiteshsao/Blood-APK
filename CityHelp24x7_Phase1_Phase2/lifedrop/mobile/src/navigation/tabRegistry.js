import HomeScreen from '../screens/home/HomeScreen';
import RequestsScreen from '../screens/requests/RequestsScreen';
import NearbyDonorsScreen from '../screens/recipient/NearbyDonorsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

/**
 * Maps a tab name from tabConfig to its screen component.
 * Later phases add their tab screens with registerTabScreen('Services', ServicesHomeScreen).
 * A tab whose screen is not registered is skipped, so a feature flag can never crash the app.
 */
const tabScreens = {
  Home: HomeScreen,
  Requests: RequestsScreen,
  Donors: NearbyDonorsScreen,
  Profile: ProfileScreen,
};

export const registerTabScreen = (name, component) => {
  tabScreens[name] = component;
};

export const getTabScreen = (name) => tabScreens[name] || null;

export default tabScreens;
