import { NativeModules } from 'react-native';

import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import Constants from 'expo-constants';

import AuthService from '~http/services/auth';
import { clearBooksData, setBookNotes, setBookVotes, userBookRatingsLoaded } from '~redux/actions/booksActions';
import { clearData as clearCustomBooksData } from '~redux/actions/customBookActions';
import { clearData as clearGoalsData, setGoal } from '~redux/actions/goalsActions';
import { clearData as clearStatisticData } from '~redux/actions/statisticActions';
import { getT } from '~translations/i18n';
import {
  deleteGoal,
  deleteProfile,
  hasUserProfile,
  initDatabase,
  loadBookNotes,
  loadBookRatings,
  loadGoal,
  loadProfile,
  loadUserVotes,
  resetAllDatabaseData,
  saveBookNote,
  saveBookRating,
  saveGoal,
  saveGuestProfile,
  saveProfile,
  saveUserVotes,
} from '~utils/boardStorage';
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
  await initDatabase();

  // Если нет токена - проверяем наличие профиля, если нет - создаем гостевого пользователя
  if (!token) {
    // eslint-disable-next-line no-console
    console.log('🔓 [checkAuth] Токен не предоставлен, проверяем наличие профиля');
    try {
      // Проверяем, есть ли уже профиль в локальной БД
      let profile = await loadProfile();
      if (!profile) {
        // Профиля нет - создаем гостевого пользователя
        // eslint-disable-next-line no-console
        console.log('👤 [checkAuth] Профиля нет, создаем гостевого пользователя');
        await saveGuestProfile();
        profile = await loadProfile();
      } else {
        // eslint-disable-next-line no-console
        console.log('👤 [checkAuth] Профиль уже существует, используем его');

        // Загружаем данные из локальной БД (рейтинги, лайки, заметки, цель)
        // Загружаем цель из локальной БД
        try {
          const localGoal = await loadGoal();
          if (localGoal) {
            // eslint-disable-next-line no-console
            console.log('🎯 [checkAuth] Загружена цель из локальной БД');
            dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as any }));
          }
        } catch (error) {
          console.error('Error loading goal from local DB:', error);
        }

        // Загружаем заметки из локальной БД
        try {
          const localBookNotes = await loadBookNotes();
          if (localBookNotes.length > 0) {
            // eslint-disable-next-line no-console
            console.log('📝 [checkAuth] Загружены заметки из локальной БД');
            dispatch(setBookNotes(localBookNotes));
          }
        } catch (error) {
          console.error('Error loading book notes from local DB:', error);
        }

        // Загружаем лайки из локальной БД
        try {
          const localUserVotes = await loadUserVotes();
          if (localUserVotes.length > 0) {
            // eslint-disable-next-line no-console
            console.log('👍 [checkAuth] Загружены лайки из локальной БД');
            dispatch(setBookVotes(localUserVotes));
          }
        } catch (error) {
          console.error('Error loading user votes from local DB:', error);
        }

        // Загружаем рейтинги из локальной БД
        try {
          const localRatings = await loadBookRatings();
          if (localRatings.length > 0) {
            // eslint-disable-next-line no-console
            console.log('📖 [checkAuth] Загружены рейтинги из локальной БД');
            dispatch(userBookRatingsLoaded(localRatings));
          }
        } catch (error) {
          console.error('Error loading ratings from local DB:', error);
        }
      }
      return {
        profile: profile || getDefaultProfileState(),
        isGoogleAccount: false,
        isSignedIn: false,
      };
    } catch (error) {
      console.error('Error handling guest profile:', error);
      return {
        profile: getDefaultProfileState(),
        isGoogleAccount: false,
        isSignedIn: false,
      };
    }
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

    // Загружаем профиль из локальной БД
    await initDatabase();
    let profile = await loadProfile();

    let serverData: any = null;

    if (!profile) {
      // Если в локальной БД нет профиля, загружаем с сервера (первый раз)
      // eslint-disable-next-line no-console
      console.log('👤 [checkAuth] Профиля в локальной БД нет, загружаем с сервера (первый раз)');
      try {
        const { data } = await AuthService().checkAuth(token);
        serverData = data;
        if (data.profile) {
          profile = data.profile;
          await saveProfile(profile);
          // eslint-disable-next-line no-console
          console.log('👤 [checkAuth] Профиль сохранен в локальную БД');
        } else {
          // Если профиль пустой, значит токен недействителен - удаляем его
          await removeToken();
          return rejectWithValue('Invalid token - no profile returned');
        }
      } catch (error) {
        console.error('Error loading profile from server:', error);
        // При ошибке создаем гостевого пользователя
        await saveGuestProfile();
        profile = await loadProfile();
        serverData = null;
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('👤 [checkAuth] Загружен профиль из локальной БД - работаем только с локальной БД, без запросов к серверу');
      // Профиль уже есть - не делаем запросов к серверу, работаем только с локальной БД
    }

    if (profile) {
      // Загружаем цель из локальной БД
      try {
        await initDatabase();
        const localGoal = await loadGoal();
        if (localGoal) {
          // eslint-disable-next-line no-console
          console.log('🎯 [checkAuth] Загружена цель из локальной БД');
          dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as any }));
        } else if (serverData) {
          // Если в локальной БД нет цели, но есть данные с сервера (первый раз) - сохраняем
          const { numberOfPagesForGoal, goalType } = serverData;
          if (numberOfPagesForGoal) {
            // eslint-disable-next-line no-console
            console.log('🎯 [checkAuth] Цели в локальной БД нет, сохраняем с сервера (первый раз)');
            await saveGoal(numberOfPagesForGoal, goalType);
            dispatch(setGoal({ pages: numberOfPagesForGoal, type: goalType }));
          }
        }
      } catch (error) {
        console.error('Error loading goal from local DB:', error);
      }

      // Загружаем заметки из локальной БД
      try {
        await initDatabase();
        const localBookNotes = await loadBookNotes();
        if (localBookNotes.length > 0) {
          // eslint-disable-next-line no-console
          console.log('📝 [checkAuth] Загружены заметки из локальной БД');
          dispatch(setBookNotes(localBookNotes));
        } else if (serverData) {
          // Если в локальной БД нет заметок, но есть данные с сервера (первый раз) - сохраняем
          // eslint-disable-next-line no-console
          console.log('📝 [checkAuth] Заметок в локальной БД нет, сохраняем с сервера (первый раз)');
          const notes = serverData.userComments || [];
          dispatch(setBookNotes(notes));
          // Сохраняем заметки в локальную БД
          if (notes.length > 0) {
            for (const note of notes) {
              try {
                await saveBookNote(note.bookId, note.comment, note.added);
              } catch (error) {
                console.error(`Error saving note for book ${note.bookId}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading book notes from local DB:', error);
      }

      // Загружаем лайки из локальной БД
      try {
        await initDatabase();
        const localUserVotes = await loadUserVotes();
        if (localUserVotes.length > 0) {
          // eslint-disable-next-line no-console
          console.log('👍 [checkAuth] Загружены лайки из локальной БД');
          dispatch(setBookVotes(localUserVotes));
        } else if (serverData) {
          // Если в локальной БД нет лайков, но есть данные с сервера (первый раз) - сохраняем
          // eslint-disable-next-line no-console
          console.log('👍 [checkAuth] Лайков в локальной БД нет, сохраняем с сервера (первый раз)');
          const votes = serverData.userVotes || [];
          dispatch(setBookVotes(votes));
          // Сохраняем лайки в локальную БД
          if (votes.length > 0) {
            await saveUserVotes(votes);
          }
        }
      } catch (error) {
        console.error('Error loading user votes from local DB:', error);
      }

      // Загружаем рейтинги из локальной БД
      try {
        await initDatabase();
        const localRatings = await loadBookRatings();
        if (localRatings.length > 0) {
          // eslint-disable-next-line no-console
          console.log('📖 [checkAuth] Загружены рейтинги из локальной БД');
          dispatch(userBookRatingsLoaded(localRatings));
        } else if (serverData) {
          // Если в локальной БД нет рейтингов, но есть данные с сервера (первый раз) - сохраняем
          // eslint-disable-next-line no-console
          console.log('📖 [checkAuth] Рейтингов в локальной БД нет, сохраняем с сервера (первый раз)');
          const ratings = serverData.userBookRatings || [];
          dispatch(userBookRatingsLoaded(ratings));
          // Сохраняем рейтинги в локальную БД
          if (ratings.length > 0) {
            for (const rating of ratings) {
              try {
                await saveBookRating(rating.bookId, rating.rating);
              } catch (error) {
                console.error(`Error saving rating for book ${rating.bookId}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading ratings from local DB:', error);
      }

      return {
        profile,
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
          // Загружаем цель из локальной БД
          try {
            await initDatabase();
            const localGoal = await loadGoal();
            if (localGoal) {
              // eslint-disable-next-line no-console
              console.log('🎯 [signIn Google] Загружена цель из локальной БД');
              dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as any }));
            } else {
              // Если в локальной БД нет цели, используем с сервера (первый раз)
              if (data.numberOfPagesForGoal) {
                // eslint-disable-next-line no-console
                console.log('🎯 [signIn Google] Цели в локальной БД нет, используем с сервера');
                await saveGoal(data.numberOfPagesForGoal, data.goalType);
                dispatch(setGoal({ pages: data.numberOfPagesForGoal, type: data.goalType }));
              }
            }
          } catch (error) {
            console.error('Error loading goal from local DB:', error);
            // В случае ошибки используем данные с сервера
            if (data.numberOfPagesForGoal) {
              dispatch(setGoal({ pages: data.numberOfPagesForGoal, type: data.goalType }));
            }
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
              console.log('📖 [signIn Google] Рейтингов в локальной БД нет, сохраняем с сервера (первый раз)');
              const ratings = data.userBookRatings || [];
              dispatch(userBookRatingsLoaded(ratings));
              // Сохраняем рейтинги в локальную БД
              if (ratings.length > 0) {
                for (const rating of ratings) {
                  try {
                    await saveBookRating(rating.bookId, rating.rating);
                  } catch (error) {
                    console.error(`Error saving rating for book ${rating.bookId}:`, error);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error loading ratings from local DB:', error);
            dispatch(userBookRatingsLoaded(data.userBookRatings || []));
          }

          // Сохраняем профиль в локальную БД
          if (data.profile) {
            try {
              await initDatabase();
              await saveProfile(data.profile);
              // eslint-disable-next-line no-console
              console.log('👤 [signIn Google] Профиль сохранен в локальную БД');
            } catch (error) {
              console.error('Error saving profile to local DB:', error);
            }
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
          // Загружаем цель из локальной БД
          try {
            await initDatabase();
            const localGoal = await loadGoal();
            if (localGoal) {
              // eslint-disable-next-line no-console
              console.log('🎯 [signIn] Загружена цель из локальной БД');
              dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as any }));
            } else {
              // Если в локальной БД нет цели, используем с сервера (первый раз)
              if (data.numberOfPagesForGoal) {
                // eslint-disable-next-line no-console
                console.log('🎯 [signIn] Цели в локальной БД нет, используем с сервера');
                await saveGoal(data.numberOfPagesForGoal, data.goalType);
                dispatch(setGoal({ pages: data.numberOfPagesForGoal, type: data.goalType }));
              }
            }
          } catch (error) {
            console.error('Error loading goal from local DB:', error);
            // В случае ошибки используем данные с сервера
            if (data.numberOfPagesForGoal) {
              dispatch(setGoal({ pages: data.numberOfPagesForGoal, type: data.goalType }));
            }
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
              console.log('👍 [signIn] Лайков в локальной БД нет, сохраняем с сервера (первый раз)');
              const votes = data.userVotes || [];
              dispatch(setBookVotes(votes));
              // Сохраняем лайки в локальную БД
              if (votes.length > 0) {
                await saveUserVotes(votes);
              }
            }
          } catch (error) {
            console.error('Error loading user votes from local DB:', error);
            const votes = data.userVotes || [];
            dispatch(setBookVotes(votes));
            // Сохраняем лайки в локальную БД
            if (votes.length > 0) {
              try {
                await saveUserVotes(votes);
              } catch (saveError) {
                console.error('Error saving user votes:', saveError);
              }
            }
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
              console.log('📖 [signIn] Рейтингов в локальной БД нет, сохраняем с сервера (первый раз)');
              const ratings = data.userBookRatings || [];
              dispatch(userBookRatingsLoaded(ratings));
              // Сохраняем рейтинги в локальную БД
              if (ratings.length > 0) {
                for (const rating of ratings) {
                  try {
                    await saveBookRating(rating.bookId, rating.rating);
                  } catch (error) {
                    console.error(`Error saving rating for book ${rating.bookId}:`, error);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error loading ratings from local DB:', error);
            dispatch(userBookRatingsLoaded(data.userBookRatings || []));
          }

          // Сохраняем профиль в локальную БД
          if (data.profile) {
            try {
              await initDatabase();
              await saveProfile(data.profile);
              // eslint-disable-next-line no-console
              console.log('👤 [signIn] Профиль сохранен в локальную БД');
            } catch (error) {
              console.error('Error saving profile to local DB:', error);
            }
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
      // Сохраняем профиль в локальную БД
      if (data.profile) {
        try {
          await initDatabase();
          await saveProfile(data.profile);
          // eslint-disable-next-line no-console
          console.log('👤 [signUp] Профиль сохранен в локальную БД');
        } catch (error) {
          console.error('Error saving profile to local DB:', error);
        }
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
    // Удаляем цель и профиль из локальной БД при выходе
    try {
      await initDatabase();
      await deleteGoal();
      await deleteProfile();
    } catch (error) {
      console.error('Error deleting goal and profile on sign out:', error);
    }

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

export const resetData = createAsyncThunk(`${PREFIX}/resetData`, async (_, { dispatch }) => {
  try {
    await initDatabase();
    await resetAllDatabaseData();

    // Очищаем Redux state
    dispatch(clearBooksData());
    dispatch(clearCustomBooksData());
    dispatch(clearStatisticData());
    dispatch(clearGoalsData());

    // Явно устанавливаем цели в null, чтобы убедиться, что они очищены
    dispatch(setGoal({ pages: 0, type: 'daily' as any }));

    // Создаем нового гостевого пользователя с текущей датой регистрации
    // forceCreate=true чтобы принудительно создать нового пользователя даже если профиль был удален
    await saveGuestProfile(true);
    const newProfile = await loadProfile();
    if (newProfile) {
      // Обновляем Redux state с новым профилем через checkAuth
      // Вызываем checkAuth с пустым токеном, чтобы обновить состояние
      // Но не загружаем цели, так как их нет в БД после сброса
      dispatch(checkAuth(''));
    }

    // eslint-disable-next-line no-console
    console.log('✅ [resetData] Все данные приложения сброшены, создан новый гостевой пользователь');
  } catch (error) {
    console.error('Error resetting data:', error);
    throw error;
  }
});
