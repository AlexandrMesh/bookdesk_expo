import { NativeModules } from 'react-native';

import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import Constants from 'expo-constants';

import AuthService from '~http/services/auth';
import { clearBooksData, setBookNotes, setBookVotes, userBookRatingsLoaded } from '~redux/actions/booksActions';
import { clearData as clearCustomBooksData } from '~redux/actions/customBookActions';
import { clearData as clearGoalsData, setGoal } from '~redux/actions/goalsActions';
import { clearData as clearStatisticData } from '~redux/actions/statisticActions';
import { getT } from '~translations/i18n';
import { initDatabase, loadBookNotes, loadBookRatings, loadUserVotes } from '~utils/boardStorage';
import { removeToken, saveToken } from '~utils/secureStorage';

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

export const checkAuth = createAsyncThunk(`${PREFIX}/checkAuth`, async (token: string, { dispatch, rejectWithValue }) => {
  if (!token) {
    return rejectWithValue('No token provided');
  }

  try {
    // Проверяем Google Sign-In статус (может быть недоступен при холодном старте)
    let isGoogleSignedIn = false;
    try {
      const GoogleSignin = await getGoogleSignin();
      isGoogleSignedIn = await GoogleSignin.isSignedIn();
    } catch {
      // Игнорируем ошибку Google Sign-In при проверке статуса
    }

    // Проверяем токен на сервере
    const { data } = await AuthService().checkAuth(token);

    if (data.profile) {
      const { numberOfPagesForGoal, goalType } = data;
      if (numberOfPagesForGoal) {
        dispatch(setGoal({ pages: numberOfPagesForGoal, type: goalType }));
      }
      // Загружаем заметки из локальной БД вместо сервера
      try {
        await initDatabase();
        const localBookNotes = await loadBookNotes();
        if (localBookNotes.length > 0) {
          // eslint-disable-next-line no-console
          console.log('📝 [checkAuth] Загружены заметки из локальной БД');
          dispatch(setBookNotes(localBookNotes));
        } else {
          // Если в локальной БД нет заметок, используем с сервера (первый раз)
          // eslint-disable-next-line no-console
          console.log('📝 [checkAuth] Заметок в локальной БД нет, используем с сервера');
          dispatch(setBookNotes(data.userComments || []));
        }
      } catch (error) {
        console.error('Error loading book notes from local DB:', error);
        // В случае ошибки используем данные с сервера
        dispatch(setBookNotes(data.userComments || []));
      }

      // Загружаем лайки из локальной БД вместо сервера
      try {
        await initDatabase();
        const localUserVotes = await loadUserVotes();
        if (localUserVotes.length > 0) {
          // eslint-disable-next-line no-console
          console.log('👍 [checkAuth] Загружены лайки из локальной БД');
          dispatch(setBookVotes(localUserVotes));
        } else {
          // Если в локальной БД нет лайков, используем с сервера (первый раз)
          // eslint-disable-next-line no-console
          console.log('👍 [checkAuth] Лайков в локальной БД нет, используем с сервера');
          dispatch(setBookVotes(data.userVotes || []));
        }
      } catch (error) {
        console.error('Error loading user votes from local DB:', error);
        // В случае ошибки используем данные с сервера
        dispatch(setBookVotes(data.userVotes || []));
      }

      // Загружаем рейтинги из локальной БД вместо сервера
      try {
        await initDatabase();
        const localRatings = await loadBookRatings();
        if (localRatings.length > 0) {
          // eslint-disable-next-line no-console
          console.log('📖 [checkAuth] Загружены рейтинги из локальной БД');
          dispatch(userBookRatingsLoaded(localRatings));
        } else {
          // Если в локальной БД нет рейтингов, используем с сервера (первый раз)
          // eslint-disable-next-line no-console
          console.log('📖 [checkAuth] Рейтингов в локальной БД нет, используем с сервера');
          dispatch(userBookRatingsLoaded(data.userBookRatings || []));
        }
      } catch (error) {
        console.error('Error loading ratings from local DB:', error);
        // В случае ошибки используем данные с сервера
        dispatch(userBookRatingsLoaded(data.userBookRatings || []));
      }

      return {
        profile: data.profile,
        isGoogleAccount: isGoogleSignedIn,
        isSignedIn: true,
      };
    }

    // Если профиль пустой, значит токен недействителен - удаляем его
    await removeToken();
    return rejectWithValue('Invalid token - no profile returned');
  } catch (error) {
    // При ошибке (токен недействителен) удаляем его
    try {
      await removeToken();
    } catch (storageError) {
      console.error('Error removing token from storage:', storageError);
    }

    return rejectWithValue(error);
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
          // Загружаем заметки из локальной БД вместо сервера
          try {
            await initDatabase();
            const localBookNotes = await loadBookNotes();
            if (localBookNotes.length > 0) {
              // eslint-disable-next-line no-console
              console.log('📝 [signIn] Загружены заметки из локальной БД');
              dispatch(setBookNotes(localBookNotes));
            } else {
              // eslint-disable-next-line no-console
              console.log('📝 [signIn] Заметок в локальной БД нет, используем с сервера');
              dispatch(setBookNotes(data.userComments || []));
            }
          } catch (error) {
            console.error('Error loading book notes from local DB:', error);
            dispatch(setBookNotes(data.userComments || []));
          }

          // Загружаем лайки из локальной БД вместо сервера
          try {
            await initDatabase();
            const localUserVotes = await loadUserVotes();
            if (localUserVotes.length > 0) {
              // eslint-disable-next-line no-console
              console.log('👍 [signIn Google] Загружены лайки из локальной БД');
              dispatch(setBookVotes(localUserVotes));
            } else {
              // eslint-disable-next-line no-console
              console.log('👍 [signIn Google] Лайков в локальной БД нет, используем с сервера');
              dispatch(setBookVotes(data.userVotes || []));
            }
          } catch (error) {
            console.error('Error loading user votes from local DB:', error);
            dispatch(setBookVotes(data.userVotes || []));
          }

          // Загружаем рейтинги из локальной БД вместо сервера
          try {
            await initDatabase();
            const localRatings = await loadBookRatings();
            if (localRatings.length > 0) {
              // eslint-disable-next-line no-console
              console.log('📖 [signIn Google] Загружены рейтинги из локальной БД');
              dispatch(userBookRatingsLoaded(localRatings));
            } else {
              // eslint-disable-next-line no-console
              console.log('📖 [signIn Google] Рейтингов в локальной БД нет, используем с сервера');
              dispatch(userBookRatingsLoaded(data.userBookRatings || []));
            }
          } catch (error) {
            console.error('Error loading ratings from local DB:', error);
            dispatch(userBookRatingsLoaded(data.userBookRatings || []));
          }

          // Сохраняем токен в безопасное хранилище
          if (data.token) {
            try {
              await saveToken(data.token);
            } catch (error) {
              console.error('Error saving token:', error);
              throw new Error('Failed to save authentication token');
            }
          } else {
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
          // Загружаем заметки из локальной БД вместо сервера
          try {
            await initDatabase();
            const localBookNotes = await loadBookNotes();
            if (localBookNotes.length > 0) {
              // eslint-disable-next-line no-console
              console.log('📝 [signIn] Загружены заметки из локальной БД');
              dispatch(setBookNotes(localBookNotes));
            } else {
              // eslint-disable-next-line no-console
              console.log('📝 [signIn] Заметок в локальной БД нет, используем с сервера');
              dispatch(setBookNotes(data.userComments || []));
            }
          } catch (error) {
            console.error('Error loading book notes from local DB:', error);
            dispatch(setBookNotes(data.userComments || []));
          }

          // Загружаем лайки из локальной БД вместо сервера
          try {
            await initDatabase();
            const localUserVotes = await loadUserVotes();
            if (localUserVotes.length > 0) {
              // eslint-disable-next-line no-console
              console.log('👍 [signIn Google] Загружены лайки из локальной БД');
              dispatch(setBookVotes(localUserVotes));
            } else {
              // eslint-disable-next-line no-console
              console.log('👍 [signIn Google] Лайков в локальной БД нет, используем с сервера');
              dispatch(setBookVotes(data.userVotes || []));
            }
          } catch (error) {
            console.error('Error loading user votes from local DB:', error);
            dispatch(setBookVotes(data.userVotes || []));
          }

          // Загружаем рейтинги из локальной БД вместо сервера
          try {
            await initDatabase();
            const localRatings = await loadBookRatings();
            if (localRatings.length > 0) {
              // eslint-disable-next-line no-console
              console.log('📖 [signIn] Загружены рейтинги из локальной БД');
              dispatch(userBookRatingsLoaded(localRatings));
            } else {
              // eslint-disable-next-line no-console
              console.log('📖 [signIn] Рейтингов в локальной БД нет, используем с сервера');
              dispatch(userBookRatingsLoaded(data.userBookRatings || []));
            }
          } catch (error) {
            console.error('Error loading ratings from local DB:', error);
            dispatch(userBookRatingsLoaded(data.userBookRatings || []));
          }

          // Сохраняем токен в безопасное хранилище
          if (data.token) {
            try {
              await saveToken(data.token);
            } catch (error) {
              console.error('Error saving token:', error);
              throw new Error('Failed to save authentication token');
            }
          } else {
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
      // Сохраняем токен в безопасное хранилище
      if (data.token) {
        try {
          await saveToken(data.token);
        } catch (error) {
          console.error('Error saving token:', error);
          throw new Error('Failed to save authentication token');
        }
      } else {
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
    await removeToken();
    dispatch(clearBooksData());
    dispatch(clearCustomBooksData());
    dispatch(clearStatisticData());
    dispatch(clearGoalsData());

    // Пытаемся выйти из Google Sign-In (может быть недоступен)
    try {
      const GoogleSignin = await getGoogleSignin();
      const isGoogleSignedIn = await GoogleSignin.isSignedIn();
      if (isGoogleSignedIn) {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      }
    } catch {
      // Игнорируем ошибки Google Sign-In
    }
  } catch (error) {
    // Даже при ошибке пытаемся удалить токен
    try {
      await removeToken();
    } catch (storageError) {
      console.error('Error removing token:', storageError);
    }
    throw error;
  }
});
