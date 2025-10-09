import React from 'react';
import { I18nextProvider } from 'react-i18next';
import 'react-native-gesture-handler';
import { Provider } from 'react-redux';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import { MobileAds } from 'yandex-mobile-ads';
import configureStore from './src/redux/store/configureStore';
import Main from './src/screens/Main';
import i18n from './src/translations/i18n';

// GoogleSignin.configure({
//   offlineAccess: true,
//   webClientId: '798541911751-2bfmd87u0b4tlua24hs8k57r5pmag36e.apps.googleusercontent.com',
// });

const App = () => {
  // React.useEffect(() => {
  //   (async () => {
  //     await MobileAds.initialize();
  //   })();
  // }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <Provider store={configureStore}>
        <Main />
      </Provider>
    </I18nextProvider>
  );
};

export default App;
