import AsyncStorage from '@react-native-async-storage/async-storage';

import { RU } from '~constants/languages';
import i18n from '~translations/i18n';

export interface AppConfig {
  apiUrl: string;
  imgUrl: string;
  minimumSupportedAppVersion: string;
  appVersion: string;
  googlePlayUrl: string;
  underConstruction: string;
  underConstructionMessage: string;
  underConstructionMessageEn: string;
  enabledSupportAppModal: string;
  daysRegisteredUserFromNowToDisplaySupportAppModal: string;
  daysViewedSupportModalFromNowToDisplaySupportAppModal: string;
  appName: string;
  email: string;
  description: string;
  descriptionEn: string;
}

export const APP_CONFIG: AppConfig = {
  apiUrl: 'http://82.146.40.13:3000',
  imgUrl: 'http://82.146.40.13',
  minimumSupportedAppVersion: '',
  appVersion: '5.0.0',
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=com.bookdesk',
  underConstruction: '',
  underConstructionMessage: '',
  underConstructionMessageEn: '',
  enabledSupportAppModal: 'true',
  daysRegisteredUserFromNowToDisplaySupportAppModal: '10',
  daysViewedSupportModalFromNowToDisplaySupportAppModal: '30',
  appName: 'BookDesk',
  email: 'mobileemailap@gmail.com',
  description:
    'BookDesk: Читательский дневник - это быстрое и удобное приложение для хранения информации о книгах, которые Вы прочитали или планируете прочитать.\nПриложение содержит в себе 4 доски:\n- Рекомендую\n- Планирую\n- Читаю\n- Прочитано\nВ них Вы можете добавлять желаемые книги.\nПреимущества приложения заключаются в удобной статистике, поиске и фильтрации книг.\nБольшая база книг в которой Вы можете найти подходящую для чтения.\nПоиск, множество категорий и обложки помогут найти необходимые книги.\nВы с лёгкостью можете посмотреть все Ваши прочитанные книги, а так же дату прочтения.\nВести статистику прочитанных книг с BookDesk легко!',
  descriptionEn:
    'BookDesk: Reading Diary is the fast and convenient application for storing information about books you have read or plan to read.\nThe application contains 4 boards:\n- Recommended\n- Will read\n- Read\n- Have read\nYou can add the books you want to them.\nThe advantages of the application include convenient statistics, searching and filtering books.\nA large database of books in which you can find something suitable for reading.\nSearch, many categories and covers will help you find the books you need.\nYou can easily see all your read books, as well as the date of reading.\nIt is easy to keep statistics of books you have read with BookDesk!',
};

/**
 * Инициализирует конфигурацию приложения, сохраняя данные в AsyncStorage
 */
export const initializeAppConfig = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem('apiUrl', APP_CONFIG.apiUrl);
    await AsyncStorage.setItem('imgUrl', APP_CONFIG.imgUrl);
    await AsyncStorage.setItem('googlePlayUrl', APP_CONFIG.googlePlayUrl);
    await AsyncStorage.setItem('enabledSupportAppModal', APP_CONFIG.enabledSupportAppModal);
    await AsyncStorage.setItem('daysRegisteredUserFromNowToDisplaySupportAppModal', APP_CONFIG.daysRegisteredUserFromNowToDisplaySupportAppModal);
    await AsyncStorage.setItem(
      'daysViewedSupportModalFromNowToDisplaySupportAppModal',
      APP_CONFIG.daysViewedSupportModalFromNowToDisplaySupportAppModal,
    );
    await AsyncStorage.setItem('underConstruction', APP_CONFIG.underConstruction);
    await AsyncStorage.setItem(
      'underConstructionMessage',
      i18n.language === RU ? APP_CONFIG.underConstructionMessage : APP_CONFIG.underConstructionMessageEn,
    );
    await AsyncStorage.setItem('appName', APP_CONFIG.appName);
    await AsyncStorage.setItem('email', APP_CONFIG.email);
    await AsyncStorage.setItem('description', i18n.language === RU ? APP_CONFIG.description : APP_CONFIG.descriptionEn);
  } catch (error) {
    console.error('Error initializing app config:', error);
  }
};
