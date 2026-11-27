/**
 * Phase 2 - Service Providers module. Importing this file once (App.js) plugs the module into the app:
 *   - a Home section (only rendered when features.services is ON)
 *   - the Services and Bookings bottom tabs (tabConfig only lists them when the flag is ON)
 *   - the extra stack screens
 * Nothing here runs any network call until the screens are opened.
 */
import { registerHomeSection } from '../../config/homeSections';
import { registerTabScreen } from '../../navigation/tabRegistry';
import { registerStackScreen } from '../../navigation/stackRegistry';
import HomeServicesSection from './HomeServicesSection';
import HomePartnerBanner from './HomePartnerBanner';
import ServicesHomeScreen from './screens/ServicesHomeScreen';
import BookingsScreen from './screens/BookingsScreen';
import ProviderListScreen from './screens/ProviderListScreen';
import ProviderDetailScreen from './screens/ProviderDetailScreen';
import BookServiceScreen from './screens/BookServiceScreen';
import BookingDetailScreen from './screens/BookingDetailScreen';
import ProviderRegisterScreen from './screens/ProviderRegisterScreen';
import ProviderHubScreen from './screens/ProviderHubScreen';

// Services-first Home: the services feed comes first (order 10), Blood Help sits in the middle
// (HomeScreen, order 50) and the partner banner closes the page (order 90).
registerHomeSection({ id: 'services', featureKey: 'services', order: 10, Component: HomeServicesSection });
registerHomeSection({ id: 'services-partner', featureKey: 'services', order: 90, Component: HomePartnerBanner });

registerTabScreen('Services', ServicesHomeScreen);
registerTabScreen('Bookings', BookingsScreen);

registerStackScreen('ProviderList', ProviderListScreen);
registerStackScreen('ProviderDetail', ProviderDetailScreen);
registerStackScreen('BookService', BookServiceScreen);
registerStackScreen('BookingDetail', BookingDetailScreen);
registerStackScreen('ProviderRegister', ProviderRegisterScreen);
registerStackScreen('ProviderHub', ProviderHubScreen);
