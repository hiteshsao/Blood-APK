/**
 * Extra stack screens contributed by later phases (Service Providers, Directory, ...).
 * Phase modules call registerStackScreen('ProviderList', ProviderListScreen) at import time.
 */
const stackScreens = {};

export const registerStackScreen = (name, component) => {
  stackScreens[name] = component;
};

export const getExtraStackScreens = () => Object.entries(stackScreens);

export default stackScreens;
