import { NativeModules } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import Constants from 'expo-constants';

import { RU } from '~constants/languages';
import AuthService from '~http/services/auth';
import { clearBooksData, setBookNotes, setBookVotes, userBookRatingsLoaded } from '~redux/actions/booksActions';
import { clearData as clearCustomBooksData } from '~redux/actions/customBookActions';
import { clearData as clearGoalsData, setGoal } from '~redux/actions/goalsActions';
import { clearData as clearStatisticData } from '~redux/actions/statisticActions';
import i18n, { getT } from '~translations/i18n';

// Динамический импорт GoogleSignin для совместимости с Expo Go
let GoogleSigninModule: any = null;

const getGoogleSignin = async () => {
  const isExpoGo = Constants.appOwnership === 'expo';

  if (isExpoGo) {
    // Mock для Expo Go
    return {
      isSignedIn: async () => false,
      hasPlayServices: async () => {
        throw new Error('Google Sign-In is not available in Expo Go');
      },
      signIn: async () => {
        throw new Error('Google Sign-In is not available in Expo Go');
      },
      revokeAccess: async () => {},
      signOut: async () => {},
    };
  }

  if (!GoogleSigninModule) {
    try {
      const module = await import('@react-native-google-signin/google-signin');
      GoogleSigninModule = module.GoogleSignin;

      // Проверяем, что GoogleSignin был инициализирован в App.tsx
      // Если нет - конфигурируем здесь как fallback
      try {
        await GoogleSigninModule.isSignedIn();
      } catch {
        // Модуль не сконфигурирован, конфигурируем здесь
        GoogleSigninModule.configure({
          offlineAccess: true,
          webClientId: '798541911751-2bfmd87u0b4tlua24hs8k57r5pmag36e.apps.googleusercontent.com',
          scopes: ['email', 'profile'],
        });
        console.error('Google Sign-In configured in authActions');
      }
    } catch (error) {
      console.error('Google Sign-In not available:', error);
      // Fallback mock
      return {
        isSignedIn: async () => false,
        hasPlayServices: async () => {
          throw new Error('Google Sign-In is not available');
        },
        signIn: async () => {
          throw new Error('Google Sign-In is not available');
        },
        revokeAccess: async () => {},
        signOut: async () => {},
      };
    }
  }

  return GoogleSigninModule;
};

const PREFIX = 'AUTH';

export const authCheckingFailed = createAction(`${PREFIX}/authCheckingFailed`);
export const setSignInError = createAction<{ fieldName: string; error: string | null }>(`${PREFIX}/setSignInError`);
export const setSignUpError = createAction<{ fieldName: string; error: string | null }>(`${PREFIX}/setSignUpError`);

export const getConfig = createAsyncThunk(`${PREFIX}/getConfig`, async (url: string) => {
  try {
    const { data } = await axios({
      method: 'get',
      url,
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      },
      timeout: 5000,
    });
    const {
      apiUrl,
      imgUrl,
      googlePlayUrl,
      appVersion,
      underConstruction,
      underConstructionMessage,
      underConstructionMessageEn,
      enabledSupportAppModal,
      daysRegisteredUserFromNowToDisplaySupportAppModal,
      daysViewedSupportModalFromNowToDisplaySupportAppModal,
      appName,
      email,
      description,
      descriptionEn,
    } = data || {};
    await AsyncStorage.setItem('apiUrl', apiUrl);
    await AsyncStorage.setItem('imgUrl', imgUrl);
    await AsyncStorage.setItem('googlePlayUrl', googlePlayUrl);
    await AsyncStorage.setItem('appVersion', appVersion);
    await AsyncStorage.setItem('enabledSupportAppModal', enabledSupportAppModal);
    await AsyncStorage.setItem('daysRegisteredUserFromNowToDisplaySupportAppModal', daysRegisteredUserFromNowToDisplaySupportAppModal);
    await AsyncStorage.setItem('daysViewedSupportModalFromNowToDisplaySupportAppModal', daysViewedSupportModalFromNowToDisplaySupportAppModal);
    await AsyncStorage.setItem('underConstruction', underConstruction);
    await AsyncStorage.setItem('underConstructionMessage', i18n.language === RU ? underConstructionMessage : underConstructionMessageEn);
    await AsyncStorage.setItem('appName', appName);
    await AsyncStorage.setItem('email', email);
    await AsyncStorage.setItem('description', i18n.language === RU ? description : descriptionEn);

    return {
      apiUrl: data?.apiUrl,
      imgUrl: data?.imgUrl,
      minimumSupportedAppVersion: data?.minimumSupportedAppVersion,
      googlePlayUrl: data?.googlePlayUrl,
      underConstruction: data?.underConstruction,
      appVersion: data?.appVersion,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const signInFailed = createAsyncThunk(`${PREFIX}/signInFailed`, async (error: { response: { data: { fieldName: string; key: string } } }) => {
  const responseData = error?.response?.data;
  if (responseData) {
    const { fieldName, key } = responseData;
    return {
      fieldName,
      error: getT('errors')(key),
    };
  }
  return {
    fieldName: 'password',
    error: getT('errors')('serverNotAvailable'),
  };
});

export const checkAuth = createAsyncThunk(`${PREFIX}/checkAuth`, async (token: string, { dispatch }) => {
  if (!token) {
    dispatch(authCheckingFailed());
    return {
      profile: {},
      isGoogleAccount: false,
      isSignedIn: false,
    };
  }
  try {
    const GoogleSignin = await getGoogleSignin();
    const result = await Promise.all([GoogleSignin.isSignedIn(), AuthService().checkAuth(token)]);
    const isGoogleSignedIn = result[0];
    const { data } = result[1];
    if (data.profile) {
      const { numberOfPagesForGoal, goalType } = data;
      if (numberOfPagesForGoal) {
        dispatch(setGoal({ pages: numberOfPagesForGoal, type: goalType }));
      }
      dispatch(setBookVotes(data.userVotes));
      dispatch(setBookNotes(data.userComments));
      dispatch(userBookRatingsLoaded(data.userBookRatings));
      return {
        profile: data.profile,
        isGoogleAccount: isGoogleSignedIn,
        isSignedIn: true,
      };
    }
    // Если профиль пустой, значит токен недействителен - удаляем его
    await AsyncStorage.removeItem('token');
    return {
      profile: {},
      isGoogleAccount: false,
      isSignedIn: false,
    };
  } catch (error) {
    // При ошибке (токен недействителен) удаляем его из AsyncStorage
    try {
      await AsyncStorage.removeItem('token');
    } catch (storageError) {
      console.error('Error removing token from AsyncStorage:', storageError);
    }
    dispatch(signInFailed(error as any));
    throw error;
  }
});

export const signIn = createAsyncThunk(
  `${PREFIX}/signIn`,
  async ({ email, password, isGoogleAccount }: { email: string; password: string; isGoogleAccount?: boolean }, { dispatch }) => {
    if (isGoogleAccount) {
      try {
        const GoogleSignin = await getGoogleSignin();

        // Проверка Google Play Services
        try {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        } catch (playServicesError: any) {
          console.error('Google Play Services error:', playServicesError);
          throw new Error('Google Play Services недоступен. Пожалуйста, обновите Google Play Services.');
        }

        // Попытка входа через Google
        const userInfo = await GoogleSignin.signIn();

        if (!userInfo || !userInfo.data) {
          throw new Error('Не удалось получить данные пользователя от Google');
        }

        const { idToken, user } = userInfo.data;
        const googleEmail = user?.email;

        if (!idToken || !googleEmail) {
          throw new Error('Отсутствуют необходимые данные для авторизации');
        }

        console.error('Google Sign-In successful, sending to backend...');

        // Отправка данных на бэкенд
        const { data } = await AuthService().signIn({
          email: googleEmail,
          googleToken: idToken,
          language: NativeModules?.I18nManager?.localeIdentifier,
        });

        if (data) {
          if (data.numberOfPagesForGoal) {
            dispatch(setGoal({ pages: data.numberOfPagesForGoal, type: data.goalType }));
          }
          dispatch(setBookVotes(data.userVotes));
          dispatch(setBookNotes(data.userComments));
          dispatch(userBookRatingsLoaded(data.userBookRatings));

          // Сохраняем токен в AsyncStorage
          if (data.token) {
            try {
              await AsyncStorage.setItem('token', data.token);
              console.error('Google Sign-In: Token saved successfully');
            } catch (error) {
              console.error('Google Sign-In: Error saving token to AsyncStorage:', error);
              throw new Error('Failed to save authentication token');
            }
          } else {
            console.error('Google Sign-In: Token is missing from server response');
            throw new Error('Token is missing from server response');
          }

          return {
            isSignedIn: true,
            profile: data.profile,
            isGoogleAccount: true,
          };
        }
        return {
          profile: {},
          isSignedIn: false,
          isGoogleAccount: true,
        };
      } catch (error: any) {
        console.error('Google Sign-In error:', error);

        // Обработка специфичных ошибок Google Sign-In
        if (error.code === '-5') {
          // Пользователь отменил вход
          console.error('User cancelled Google Sign-In');
        } else if (error.code === '12501') {
          // Пользователь отменил вход (Android)
          console.error('User cancelled Google Sign-In');
        } else if (error.message?.includes('DEVELOPER_ERROR') || error.code === '10') {
          // Проблема с конфигурацией
          console.error('Google Sign-In configuration error. Check webClientId and SHA-1/SHA-256 in Google Console');
          error.response = {
            data: {
              fieldName: 'password',
              key: 'googleSignInConfigError',
            },
          };
        }

        dispatch(signInFailed(error as any));
        throw error;
      }
    } else {
      try {
        const { data } = await AuthService().signIn({ email, password });
        if (data) {
          if (data.numberOfPagesForGoal) {
            dispatch(setGoal({ pages: data.numberOfPagesForGoal, type: data.goalType }));
          }
          dispatch(setBookVotes(data.userVotes));
          dispatch(setBookNotes(data.userComments));
          dispatch(userBookRatingsLoaded(data.userBookRatings));

          // Сохраняем токен в AsyncStorage
          if (data.token) {
            try {
              await AsyncStorage.setItem('token', data.token);
              console.error('Sign-In: Token saved successfully');
            } catch (error) {
              console.error('Sign-In: Error saving token to AsyncStorage:', error);
              throw new Error('Failed to save authentication token');
            }
          } else {
            console.error('Sign-In: Token is missing from server response');
            throw new Error('Token is missing from server response');
          }

          return {
            isSignedIn: true,
            profile: data.profile,
            isGoogleAccount: false,
          };
        }
        return {
          profile: {},
          isSignedIn: false,
          isGoogleAccount: false,
        };
      } catch (error) {
        dispatch(signInFailed(error as any));
        throw error;
      }
    }
  },
);

export const signUp = createAsyncThunk(`${PREFIX}/signUp`, async ({ email, password }: { email: string; password: string }, { dispatch }) => {
  try {
    const { data } = await AuthService().signUp({ email, password, language: NativeModules?.I18nManager?.localeIdentifier });
    if (data) {
      // Сохраняем токен в AsyncStorage
      if (data.token) {
        try {
          await AsyncStorage.setItem('token', data.token);
          console.error('Sign-Up: Token saved successfully');
        } catch (error) {
          console.error('Sign-Up: Error saving token to AsyncStorage:', error);
          throw new Error('Failed to save authentication token');
        }
      } else {
        console.error('Sign-Up: Token is missing from server response');
        throw new Error('Token is missing from server response');
      }

      return {
        isSignedIn: true,
        profile: data.profile,
      };
    }
    return {
      isSignedIn: false,
      profile: {},
    };
  } catch (error) {
    const responseData = (error as any)?.response?.data;
    if (responseData) {
      const { fieldName, key } = responseData;
      dispatch(setSignUpError({ fieldName, error: getT('errors')(key) }));
    } else {
      dispatch(setSignUpError({ fieldName: 'password', error: getT('errors')('serverNotAvailable') }));
    }
    throw error;
  }
});

export const signOut = createAsyncThunk(`${PREFIX}/signOut`, async (_, { dispatch }) => {
  try {
    await AsyncStorage.removeItem('token');
    console.error('Sign-Out: Token removed successfully');
    dispatch(clearBooksData());
    dispatch(clearCustomBooksData());
    dispatch(clearStatisticData());
    dispatch(clearGoalsData());
    const GoogleSignin = await getGoogleSignin();
    const isGoogleSignedIn = await GoogleSignin.isSignedIn();
    if (isGoogleSignedIn) {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.error('Sign-Out error:', error);
    // Даже при ошибке пытаемся удалить токен
    try {
      await AsyncStorage.removeItem('token');
    } catch (storageError) {
      console.error('Error removing token during signOut:', storageError);
    }
    throw error;
  }
});
