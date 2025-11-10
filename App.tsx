import React from 'react';

import Constants from 'expo-constants';
import { I18nextProvider } from 'react-i18next';
import 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import configureStore from './src/redux/store/configureStore';
import Main from './src/screens/Main';
import i18n from './src/translations/i18n';
import { initDatabase } from './src/utils/boardStorage';

// Условная инициализация нативных модулей
// Работает только в production build, не в Expo Go
const initializeNativeModules = async () => {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (!isExpoGo) {
    try {
      // Google Sign In
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        offlineAccess: true,
        webClientId: '798541911751-2bfmd87u0b4tlua24hs8k57r5pmag36e.apps.googleusercontent.com',
        scopes: ['email', 'profile'],
      });
      console.error('Google Sign In initialized');
    } catch (error) {
      console.error('Google Sign In not available:', error);
    }

    try {
      // Yandex Mobile Ads
      const { MobileAds } = await import('yandex-mobile-ads');
      await MobileAds.initialize();
      console.error('Yandex Mobile Ads initialized');
    } catch (error) {
      console.error('Yandex Mobile Ads not available:', error);
    }
  } else {
    console.error('Running in Expo Go - native modules disabled');
  }
};

const App = () => {
  React.useEffect(() => {
    initializeNativeModules();
    // Инициализируем базу данных при старте приложения
    initDatabase().catch((error) => {
      console.error('Error initializing database:', error);
    });
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <Provider store={configureStore}>
        <Main />
      </Provider>
    </I18nextProvider>
  );
};

export default App;
