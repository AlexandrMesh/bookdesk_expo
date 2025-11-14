import { NativeModules } from 'react-native';

import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import Constants from 'expo-constants';

import { COMPLETED, IN_PROGRESS, PLANNED } from '~constants/boardType';
import AuthService from '~http/services/auth';
import {
  clearBooksData,
  loadBookList,
  loadBookListFromLocalDB,
  setBookNotes,
  setBookVotes,
  userBookRatingsLoaded,
} from '~redux/actions/booksActions';
import { clearData as clearCustomBooksData } from '~redux/actions/customBookActions';
import { clearData as clearGoalsData, getGoalItems, setGoal } from '~redux/actions/goalsActions';
import { clearData as clearStatisticData } from '~redux/actions/statisticActions';
import { getT } from '~translations/i18n';
import { IProfile } from '~types/auth';
import {
  deleteGoal,
  deleteProfile,
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
  saveGoalItems,
  saveGuestProfile,
  saveProfile,
  saveUserVotes,
  setSyncWithLocalDatabaseCompleted,
  setSyncDatabaseCompleted,
} from '~utils/boardStorage';
import { getToken, removeToken, saveToken } from '~utils/secureStorage';

// Динамический импорт GoogleSignin для совместимости с Expo Go
let GoogleSigninModule: any = null;

const getDefaultProfileState = (): IProfile => ({
  _id: '',
  email: '',
  registered: null,
  updated: null,
  supportApp: {
    confirmed: false,
    viewedAt: null,
  },
});

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
export const initializationComplete = createAction<{ profile: IProfile | null; isSignedIn: boolean }>(`${PREFIX}/initializationComplete`);

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

/**
 * Простая функция авторизации - только проверяет логин/пароль и сохраняет токен
 */
export const signin = createAsyncThunk(
  `${PREFIX}/signin`,
  async ({ email, password }: { email: string; password: string }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await AuthService().signIn({ email, password });

      if (data && data.token) {
        // Сохраняем токен
        await saveToken(data.token);
        // eslint-disable-next-line no-console
        console.log('✅ [signin] Токен сохранен');

        return {
          token: data.token,
        };
      } else {
        return rejectWithValue('Token is missing from server response');
      }
    } catch (error: any) {
      const responseData = error?.response?.data;
      if (responseData) {
        const { fieldName, key } = responseData;
        dispatch(setSignInError({ fieldName, error: getT('errors')(key) }));
      } else {
        dispatch(setSignInError({ fieldName: 'password', error: getT('errors')('serverNotAvailable') }));
      }
      return rejectWithValue(error);
    }
  },
);

/**
 * Проверка валидности токена и синхронизация всех данных с API в локальную БД
 */
export const checkAuthAndSyncDB = createAsyncThunk(`${PREFIX}/checkAuthAndSyncDB`, async (_, { dispatch, rejectWithValue }) => {
  await initDatabase();

  // Сначала проверяем, не была ли уже выполнена синхронизация
  const existingProfile = await loadProfile();
  if (existingProfile?.syncDatabaseCompleted) {
    // eslint-disable-next-line no-console
    console.log('✅ [checkAuthAndSyncDB] syncDatabaseCompleted уже true, синхронизация не требуется');
    return {
      profile: existingProfile as IProfile,
      isSignedIn: !!existingProfile?.email,
    };
  }

  const token = await getToken();
  if (!token) {
    return rejectWithValue('No token available');
  }

  try {
    // Проверяем валидность токена и загружаем все данные с сервера
    // eslint-disable-next-line no-console
    console.log('🔄 [checkAuthAndSyncDB] Начинаем синхронизацию данных с сервера');

    const { data } = await AuthService().checkAuth(token);

    if (!data || !data.profile) {
      // Токен недействителен - удаляем его
      await removeToken();
      return rejectWithValue('Invalid token - no profile returned');
    }

    const serverData = data;
    const serverProfile = serverData.profile;

    // Сохраняем профиль (пока без syncDatabaseCompleted)
    await saveProfile({
      ...serverProfile,
      syncDatabaseCompleted: false,
    });
    // eslint-disable-next-line no-console
    console.log('👤 [checkAuthAndSyncDB] Профиль сохранен в локальную БД');

    // Загружаем и сохраняем цель
    if (serverData.numberOfPagesForGoal) {
      // eslint-disable-next-line no-console
      console.log('🎯 [checkAuthAndSyncDB] Сохраняем цель с сервера в локальную БД');
      await saveGoal(serverData.numberOfPagesForGoal, serverData.goalType);
      dispatch(setGoal({ pages: serverData.numberOfPagesForGoal, type: serverData.goalType }));
    }

    // Загружаем и сохраняем заметки
    const notes = serverData.userComments || [];
    if (notes.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`📝 [checkAuthAndSyncDB] Сохраняем ${notes.length} заметок с сервера в локальную БД`);
      dispatch(setBookNotes(notes));
      for (const note of notes) {
        try {
          await saveBookNote(note.bookId, note.comment, note.added);
        } catch (error) {
          console.error(`Error saving note for book ${note.bookId}:`, error);
        }
      }
    }

    // Загружаем и сохраняем лайки
    const votes = serverData.userVotes || [];
    if (votes.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`👍 [checkAuthAndSyncDB] Сохраняем ${votes.length} лайков с сервера в локальную БД`);
      dispatch(setBookVotes(votes));
      await saveUserVotes(votes);
    }

    // Загружаем и сохраняем рейтинги
    const ratings = serverData.userBookRatings || [];
    if (ratings.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`📖 [checkAuthAndSyncDB] Сохраняем ${ratings.length} рейтингов с сервера в локальную БД`);
      dispatch(userBookRatingsLoaded(ratings));
      for (const rating of ratings) {
        try {
          await saveBookRating(rating.bookId, rating.rating);
        } catch (error) {
          console.error(`Error saving rating for book ${rating.bookId}:`, error);
        }
      }
    }

    // Загружаем и сохраняем журнал страниц (goal items)
    const goalItems = serverData.goalItems || [];
    if (goalItems.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`📊 [checkAuthAndSyncDB] Сохраняем ${goalItems.length} записей журнала страниц с сервера в локальную БД`);
      await saveGoalItems(goalItems);
      await dispatch(getGoalItems()).unwrap();
    }

    // Загружаем книги с сервера для всех досок (PLANNED, IN_PROGRESS, COMPLETED)
    // eslint-disable-next-line no-console
    console.log('📚 [checkAuthAndSyncDB] Загружаем книги с сервера для досок (PLANNED, IN_PROGRESS, COMPLETED)');
    const boardTypes = [PLANNED, IN_PROGRESS, COMPLETED] as const;
    for (const boardType of boardTypes) {
      try {
        // eslint-disable-next-line no-console
        console.log(`📚 [checkAuthAndSyncDB] Загружаем книги для доски: ${boardType} с сервера`);
        await dispatch(loadBookList({ boardType, shouldLoadMoreResults: false })).unwrap();
      } catch (error) {
        console.error(`Error loading books for board ${boardType} from server:`, error);
        // Продолжаем загрузку других досок даже при ошибке
      }
    }

    // Загружаем даты книг (если они есть в данных сервера)
    // Примечание: даты книг обычно приходят вместе с книгами, но если есть отдельный endpoint, его нужно добавить
    // Здесь предполагаем, что даты приходят вместе с книгами в loadBookList

    // После успешной загрузки всех данных - устанавливаем syncDatabaseCompleted = true
    // eslint-disable-next-line no-console
    console.log('✅ [checkAuthAndSyncDB] Все данные загружены с сервера, устанавливаем syncDatabaseCompleted=true');
    await setSyncDatabaseCompleted(true);
    await saveProfile({
      ...serverProfile,
      syncDatabaseCompleted: true,
    });

    // Проверяем, что значение действительно сохранилось
    const savedProfile = await loadProfile();
    if (savedProfile && savedProfile.syncDatabaseCompleted !== true) {
      console.warn(`⚠️ [checkAuthAndSyncDB] syncDatabaseCompleted не установлен правильно! Текущее значение: ${savedProfile.syncDatabaseCompleted}`);
      // Пытаемся установить еще раз
      await setSyncDatabaseCompleted(true);
    } else {
      // eslint-disable-next-line no-console
      console.log(`✅ [checkAuthAndSyncDB] syncDatabaseCompleted успешно установлен: ${savedProfile?.syncDatabaseCompleted}`);
    }

    // eslint-disable-next-line no-console
    console.log('✅ [checkAuthAndSyncDB] Синхронизация завершена успешно');

    const finalProfile = savedProfile || { ...serverProfile, syncDatabaseCompleted: true };
    return {
      profile: finalProfile as IProfile,
      isSignedIn: true,
    };
  } catch (error) {
    console.error('Error in checkAuthAndSyncDB:', error);
    // При ошибке удаляем недействительный токен
    try {
      await removeToken();
    } catch (storageError) {
      console.error('Error removing token from storage:', storageError);
    }
    return rejectWithValue(error);
  }
});

export const checkAuth = createAsyncThunk(`${PREFIX}/checkAuth`, async (token: string, { dispatch, rejectWithValue }) => {
  await initDatabase();

  // Сначала проверяем, есть ли профиль и установлен ли syncWithLocalDatabaseCompleted
  let profile: IProfile | null = await loadProfile();

  // Если syncWithLocalDatabaseCompleted = true, работаем только с локальной БД, не проверяем токен
  // НО: если профиль гость (guest_), а есть токен - это ошибка, нужно загрузить с сервера
  if (profile?.syncWithLocalDatabaseCompleted) {
    // Проверяем, не является ли профиль гостевым
    const isGuestProfile = profile._id && profile._id.startsWith('guest_');
    const hasEmail = profile.email && profile.email.trim() !== '';

    // Если профиль гость, но есть токен - это ошибка, нужно загрузить с сервера
    if (isGuestProfile && token && !hasEmail) {
      // eslint-disable-next-line no-console
      console.log(`⚠️ [checkAuth] Обнаружен гостевой профиль (${profile._id}), но есть токен. Загружаем профиль с сервера.`);
      // Сбрасываем флаг syncWithLocalDatabaseCompleted, чтобы загрузить с сервера
      await setSyncWithLocalDatabaseCompleted(false);
      // Сбрасываем profile, чтобы загрузить с сервера
      profile = null;
    } else {
      // eslint-disable-next-line no-console
      console.log('✅ [checkAuth] syncWithLocalDatabaseCompleted=true, работаем только с локальной БД');

      // Загружаем все данные из локальной БД
      try {
        const localGoal = await loadGoal();
        if (localGoal) {
          dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as any }));
        }
      } catch (error) {
        console.error('Error loading goal from local DB:', error);
      }

      try {
        const localBookNotes = await loadBookNotes();
        if (localBookNotes.length > 0) {
          dispatch(setBookNotes(localBookNotes));
        }
      } catch (error) {
        console.error('Error loading book notes from local DB:', error);
      }

      try {
        const localUserVotes = await loadUserVotes();
        if (localUserVotes.length > 0) {
          dispatch(setBookVotes(localUserVotes));
        }
      } catch (error) {
        console.error('Error loading user votes from local DB:', error);
      }

      try {
        const localRatings = await loadBookRatings();
        if (localRatings.length > 0) {
          dispatch(userBookRatingsLoaded(localRatings));
        }
      } catch (error) {
        console.error('Error loading ratings from local DB:', error);
      }

      // Загружаем goal items из локальной БД
      try {
        await dispatch(getGoalItems()).unwrap();
        // eslint-disable-next-line no-console
        console.log('📊 [checkAuth] Goal items загружены из локальной БД в Redux state');
      } catch (error) {
        console.error('Error loading goal items from local DB:', error);
      }

      // Загружаем книги из локальной БД для досок (кроме ALL - она не сохраняется)
      // eslint-disable-next-line no-console
      console.log('📚 [checkAuth] Загружаем книги из локальной БД для досок (PLANNED, IN_PROGRESS, COMPLETED)');
      try {
        const boardTypes = [PLANNED, IN_PROGRESS, COMPLETED] as const;
        for (const boardType of boardTypes) {
          try {
            // eslint-disable-next-line no-console
            console.log(`📚 [checkAuth] Загружаем книги для доски: ${boardType} из локальной БД`);
            await dispatch(loadBookListFromLocalDB({ boardType, shouldLoadMoreResults: false })).unwrap();
          } catch (error) {
            console.error(`Error loading books for board ${boardType} from local DB:`, error);
            // Продолжаем загрузку других досок даже при ошибке
          }
        }
        // eslint-disable-next-line no-console
        console.log('✅ [checkAuth] Все книги загружены из локальной БД');
      } catch (error) {
        console.error('Error loading books from local DB:', error);
        // Продолжаем работу даже при ошибке загрузки книг
      }

      const isUserSignedIn = profile.email && profile.email.trim() !== '';
      const profileForReturn: IProfile = {
        ...profile,
        syncWithLocalDatabaseCompleted: profile.syncWithLocalDatabaseCompleted ?? false,
        isNewUser: profile.isNewUser ?? false,
      };
      // eslint-disable-next-line no-console
      console.log(
        `👤 [checkAuth] Возвращаем профиль (syncWithLocalDatabaseCompleted=true): email=${profileForReturn.email || 'нет'}, _id=${profileForReturn._id || 'нет'}, isSignedIn=${isUserSignedIn}`,
      );
      return {
        profile: profileForReturn,
        isGoogleAccount: false,
        isSignedIn: isUserSignedIn,
      };
    }
  }

  // Если нет токена - проверяем наличие профиля, если нет - создаем гостевого пользователя
  if (!token) {
    // eslint-disable-next-line no-console
    console.log('🔓 [checkAuth] Токен не предоставлен, проверяем наличие профиля');
    try {
      // Проверяем, есть ли уже профиль в локальной БД
      profile = await loadProfile();
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

      // Определяем, залогинен ли пользователь: если у профиля есть email, значит пользователь залогинен
      const isUserSignedIn = profile && profile.email && profile.email.trim() !== '';
      // Проверяем наличие токена в хранилище для дополнительной проверки
      const storedToken = await getToken();
      const hasValidToken = !!storedToken;

      // eslint-disable-next-line no-console
      console.log(`👤 [checkAuth] Профиль загружен: email=${profile?.email || 'нет'}, isSignedIn=${isUserSignedIn}, hasToken=${hasValidToken}`);

      return {
        profile: profile || getDefaultProfileState(),
        isGoogleAccount: false,
        isSignedIn: isUserSignedIn && hasValidToken,
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

    // Если есть токен и syncWithLocalDatabaseCompleted = false - загружаем все данные с сервера
    // Если токена нет - работаем только с локальной БД
    let serverData: any = null;

    if (token) {
      // Есть токен и syncWithLocalDatabaseCompleted = false - загружаем все данные с сервера
      // eslint-disable-next-line no-console
      console.log('👤 [checkAuth] Есть токен и syncWithLocalDatabaseCompleted=false, загружаем все данные с сервера');
      try {
        const { data } = await AuthService().checkAuth(token);
        serverData = data;
        if (data.profile) {
          const serverProfile = data.profile;
          profile = serverProfile;
          await saveProfile({ ...serverProfile, syncWithLocalDatabaseCompleted: false }); // Пока не установим true
          // eslint-disable-next-line no-console
          console.log('👤 [checkAuth] Профиль загружен с сервера и сохранен в локальную БД');
        } else {
          // Если профиль пустой, значит токен недействителен - удаляем его
          await removeToken();
          return rejectWithValue('Invalid token - no profile returned');
        }
      } catch (error) {
        console.error('Error loading profile from server:', error);
        // При ошибке загрузки с сервера - работаем с локальной БД
        // Если локального профиля нет - создаем гостевого пользователя
        if (!profile) {
          await saveGuestProfile();
          const loadedProfile = await loadProfile();
          if (loadedProfile) {
            profile = loadedProfile as IProfile;
          } else {
            profile = getDefaultProfileState();
          }
        }
        serverData = null;
        // Удаляем недействительный токен
        await removeToken();
      }
    } else {
      // Токена нет - работаем только с локальной БД
      // eslint-disable-next-line no-console
      console.log('👤 [checkAuth] Токена нет, работаем только с локальной БД');
      if (!profile) {
        // Если профиля нет - создаем гостевого пользователя
        await saveGuestProfile();
        const loadedProfile = await loadProfile();
        if (loadedProfile) {
          profile = loadedProfile as IProfile;
        } else {
          profile = getDefaultProfileState();
        }
      }
    }

    if (profile) {
      // Если есть данные с сервера - используем их и обновляем локальную БД
      // Если данных с сервера нет - загружаем из локальной БД
      if (serverData) {
        // eslint-disable-next-line no-console
        console.log('📥 [checkAuth] Используем данные с сервера и обновляем локальную БД');

        // Загружаем и сохраняем цель с сервера
        try {
          const { numberOfPagesForGoal, goalType } = serverData;
          if (numberOfPagesForGoal) {
            // eslint-disable-next-line no-console
            console.log('🎯 [checkAuth] Сохраняем цель с сервера в локальную БД');
            await saveGoal(numberOfPagesForGoal, goalType);
            dispatch(setGoal({ pages: numberOfPagesForGoal, type: goalType }));
          }
        } catch (error) {
          console.error('Error saving goal from server:', error);
        }

        // Загружаем и сохраняем заметки с сервера
        try {
          const notes = serverData.userComments || [];
          // eslint-disable-next-line no-console
          console.log(`📝 [checkAuth] Сохраняем ${notes.length} заметок с сервера в локальную БД`);
          dispatch(setBookNotes(notes));
          if (notes.length > 0) {
            for (const note of notes) {
              try {
                await saveBookNote(note.bookId, note.comment, note.added);
              } catch (error) {
                console.error(`Error saving note for book ${note.bookId}:`, error);
              }
            }
          }
        } catch (error) {
          console.error('Error saving book notes from server:', error);
        }

        // Загружаем и сохраняем лайки с сервера
        try {
          const votes = serverData.userVotes || [];
          // eslint-disable-next-line no-console
          console.log(`👍 [checkAuth] Сохраняем ${votes.length} лайков с сервера в локальную БД`);
          dispatch(setBookVotes(votes));
          if (votes.length > 0) {
            await saveUserVotes(votes);
          }
        } catch (error) {
          console.error('Error saving user votes from server:', error);
        }

        // Загружаем и сохраняем рейтинги с сервера
        try {
          const ratings = serverData.userBookRatings || [];
          // eslint-disable-next-line no-console
          console.log(`📖 [checkAuth] Сохраняем ${ratings.length} рейтингов с сервера в локальную БД`);
          dispatch(userBookRatingsLoaded(ratings));
          if (ratings.length > 0) {
            for (const rating of ratings) {
              try {
                await saveBookRating(rating.bookId, rating.rating);
              } catch (error) {
                console.error(`Error saving rating for book ${rating.bookId}:`, error);
              }
            }
          }
        } catch (error) {
          console.error('Error saving ratings from server:', error);
        }

        // Загружаем и сохраняем журнал страниц (goal items) с сервера
        try {
          const goalItems = serverData.goalItems || [];
          // eslint-disable-next-line no-console
          console.log(`📊 [checkAuth] Сохраняем ${goalItems.length} записей журнала страниц с сервера в локальную БД`);
          if (goalItems.length > 0) {
            await saveGoalItems(goalItems);
            // Загружаем goal items в Redux state
            await dispatch(getGoalItems()).unwrap();
            // eslint-disable-next-line no-console
            console.log('📊 [checkAuth] Goal items загружены в Redux state');
          }
        } catch (error) {
          console.error('Error saving goal items from server:', error);
        }

        // Загружаем книги с сервера для досок (кроме ALL - она не сохраняется)
        // Это происходит только один раз, когда syncWithLocalDatabaseCompleted = false
        // eslint-disable-next-line no-console
        console.log('📚 [checkAuth] Загружаем книги с сервера для досок (PLANNED, IN_PROGRESS, COMPLETED)');
        try {
          const boardTypes = [PLANNED, IN_PROGRESS, COMPLETED] as const;
          for (const boardType of boardTypes) {
            try {
              // eslint-disable-next-line no-console
              console.log(`📚 [checkAuth] Загружаем книги для доски: ${boardType} с сервера`);
              await dispatch(loadBookList({ boardType, shouldLoadMoreResults: false })).unwrap();
            } catch (error) {
              console.error(`Error loading books for board ${boardType} from server:`, error);
              // Продолжаем загрузку других досок даже при ошибке
            }
          }
          // eslint-disable-next-line no-console
          console.log('✅ [checkAuth] Все книги загружены с сервера и сохранены в локальную БД');
        } catch (error) {
          console.error('Error loading books from server:', error);
          // Продолжаем работу даже при ошибке загрузки книг
        }

        // После успешной загрузки всех данных с сервера - устанавливаем syncWithLocalDatabaseCompleted = true
        // Это гарантирует, что в следующий раз checkAuth будет работать только с локальной БД
        // НЕ удаляем токен!
        // eslint-disable-next-line no-console
        console.log('✅ [checkAuth] Все данные загружены с сервера, устанавливаем syncWithLocalDatabaseCompleted=true');
        // Сохраняем полный профиль с сервера с установленным флагом syncWithLocalDatabaseCompleted = true
        // ВАЖНО: используем serverProfile, чтобы сохранить все поля включая email и _id
        if (serverData?.profile) {
          const serverProfile = serverData.profile;
          await saveProfile({ ...serverProfile, syncWithLocalDatabaseCompleted: true });
          // Обновляем локальную переменную profile
          profile = { ...serverProfile, syncWithLocalDatabaseCompleted: true } as IProfile;
          // eslint-disable-next-line no-console
          console.log(
            `👤 [checkAuth] Профиль сохранен с email=${serverProfile.email || 'нет'}, _id=${serverProfile._id || 'нет'}, syncWithLocalDatabaseCompleted=true`,
          );
        } else if (profile) {
          // Если serverProfile недоступен, используем текущий profile (fallback)
          await saveProfile({ ...profile, syncWithLocalDatabaseCompleted: true });
          // eslint-disable-next-line no-console
          console.log(
            `⚠️ [checkAuth] serverProfile недоступен, используем текущий profile: email=${profile.email || 'нет'}, _id=${profile._id || 'нет'}`,
          );
        }

        // После установки флага загружаем книги из локальной БД (они уже сохранены после загрузки с сервера)
        // eslint-disable-next-line no-console
        console.log('📚 [checkAuth] Загружаем книги из локальной БД для досок (PLANNED, IN_PROGRESS, COMPLETED)');
        try {
          const boardTypes = [PLANNED, IN_PROGRESS, COMPLETED] as const;
          for (const boardType of boardTypes) {
            try {
              // eslint-disable-next-line no-console
              console.log(`📚 [checkAuth] Загружаем книги для доски: ${boardType} из локальной БД`);
              await dispatch(loadBookListFromLocalDB({ boardType, shouldLoadMoreResults: false })).unwrap();
            } catch (error) {
              console.error(`Error loading books for board ${boardType} from local DB:`, error);
              // Продолжаем загрузку других досок даже при ошибке
            }
          }
          // eslint-disable-next-line no-console
          console.log('✅ [checkAuth] Все книги загружены из локальной БД');
        } catch (error) {
          console.error('Error loading books from local DB:', error);
          // Продолжаем работу даже при ошибке загрузки книг
        }
      } else {
        // Данных с сервера нет - загружаем из локальной БД
        // eslint-disable-next-line no-console
        console.log('📥 [checkAuth] Загружаем данные из локальной БД');

        // Загружаем цель из локальной БД
        try {
          await initDatabase();
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
          await initDatabase();
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
          await initDatabase();
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
          await initDatabase();
          const localRatings = await loadBookRatings();
          if (localRatings.length > 0) {
            // eslint-disable-next-line no-console
            console.log('📖 [checkAuth] Загружены рейтинги из локальной БД');
            dispatch(userBookRatingsLoaded(localRatings));
          }
        } catch (error) {
          console.error('Error loading ratings from local DB:', error);
        }

        // Загружаем goal items из локальной БД
        try {
          await dispatch(getGoalItems()).unwrap();
          // eslint-disable-next-line no-console
          console.log('📊 [checkAuth] Goal items загружены из локальной БД в Redux state');
        } catch (error) {
          console.error('Error loading goal items from local DB:', error);
        }
      }

      // Определяем, залогинен ли пользователь: если у профиля есть email, значит пользователь залогинен
      const isUserSignedIn = profile.email && profile.email.trim() !== '';

      // eslint-disable-next-line no-console
      console.log(`👤 [checkAuth] Профиль загружен (с токеном): email=${profile.email || 'нет'}, isSignedIn=${isUserSignedIn}`);

      return {
        profile,
        isGoogleAccount: isGoogleSignedIn,
        isSignedIn: isUserSignedIn,
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

    // Сохраняем syncWithLocalDatabaseCompleted перед сбросом
    const existingProfile = await loadProfile();
    const wasSyncCompleted = existingProfile?.syncWithLocalDatabaseCompleted ?? false;

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

    // Если syncWithLocalDatabaseCompleted был true, сохраняем его
    if (wasSyncCompleted) {
      await setSyncWithLocalDatabaseCompleted(true);
      const newProfile = await loadProfile();
      if (newProfile) {
        await saveProfile({ ...newProfile, syncWithLocalDatabaseCompleted: true });
      }
    }

    const newProfile = await loadProfile();
    if (newProfile) {
      // Обновляем Redux state с новым профилем через checkAuth
      // Вызываем checkAuth с пустым токеном, чтобы обновить состояние
      // Но не загружаем цели, так как их нет в БД после сброса
      dispatch(checkAuth(''));
    }

    // eslint-disable-next-line no-console
    console.log(
      `✅ [resetData] Все данные приложения сброшены, создан новый гостевой пользователь, syncWithLocalDatabaseCompleted=${wasSyncCompleted}`,
    );
  } catch (error) {
    console.error('Error resetting data:', error);
    throw error;
  }
});
