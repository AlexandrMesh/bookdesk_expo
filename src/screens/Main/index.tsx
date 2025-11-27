/* eslint-disable import/order */
import React, { FC, lazy, useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BottomTabBar, BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, ParamListBase, RouteProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import AddCustomBookIcon from '~assets/add.svg';
import GoalIcon from '~assets/goal.svg';
import HomeIcon from '~assets/home.svg';
import ProfileIcon from '~assets/profile.svg';
import StatIcon from '~assets/stat.svg';
import { COMPLETED, IN_PROGRESS, PLANNED } from '~constants/boardType';
import { BOTTOM_BAR_ADD_ICON, BOTTOM_BAR_ICON } from '~constants/dimensions';
import { DAILY } from '~constants/goals';
import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import {
  ABOUT_ROUTE,
  ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE,
  ADD_GOAL,
  BOOK_NOTE_ROUTE,
  CUSTOM_BOOKS_ROUTE,
  CUSTOM_CATEGORY_CHOOSER_ROUTE,
  EDIT_CUSTOM_BOOK_ROUTE,
  EDIT_GOAL,
  FITLERING_ROUTE,
  GOALS_NAVIGATOR_ROUTE,
  GOALS_ROUTE,
  GOAL_DETAILS,
  HOME_NAVIGATOR_ROUTE,
  HOME_ROUTE,
  PROFILE_NAVIGATOR_ROUTE,
  PROFILE_ROUTE,
  SEARCH_ROUTE,
  STAT_NAVIGATOR_ROUTE,
  STAT_ROUTE,
} from '~constants/routes';
import { useAppUpdates } from '~hooks/useAppUpdates';
import { initializationComplete } from '~redux/actions/authActions';
import { loadBookListFromLocalDB, setBookNotes, setBookVotes, userBookRatingsLoaded, setCategories } from '~redux/actions/booksActions';
import { getGoalItems, setGoal } from '~redux/actions/goalsActions';
import { getCheckingStatus } from '~redux/selectors/auth';
import { getGoalNumberOfPages, getGoalType } from '~redux/selectors/goals';
import Home from '~screens/Home';
import Splash from '~screens/Splash';
import colors from '~styles/colors';
import i18n from '~translations/i18n';
import { GoalType } from '~types/goals';
import BannerAd from '~UI/BannerAd';
import { Spinner } from '~UI/Spinner';
import {
  initDatabase,
  loadProfile,
  saveGuestProfile,
  loadGoal,
  loadBookNotes,
  loadUserVotes,
  loadBookRatings,
  loadCategories,
  hydrateBooksTableFromCache,
} from '~utils/boardStorage';
import { maybeAskForReview, recordAppOpen } from '~utils/reviewPrompt';

import ClearFilters from './ClearFilters';
import CloseComponent from './CloseComponent';
import EditComponent from './EditComponent';
import InSuspense from './InSuspense';
import { APP_CONFIG, initializeAppConfig } from '../../config/appConfig';

const Search = lazy(() => import('~screens/Search'));
const BookNote = lazy(() => import('~screens/Home/BookNote'));
const Filtering = lazy(() => import('~screens/Home/Filtering'));
const CategoryChooser = lazy(() => import('~screens/CustomBooks/AddCustomBook/CategoryChooser'));
const AddCustomBook = lazy(() => import('~screens/CustomBooks/AddCustomBook'));
const EditCustomBook = lazy(() => import('~screens/CustomBooks/EditCustomBook'));
const Statistic = lazy(() => import('~screens/Statistic'));
const Goals = lazy(() => import('~screens/Goals/Goals'));
const AddGoal = lazy(() => import('~screens/Goals/AddGoal'));
const EditGoal = lazy(() => import('~screens/Goals/EditGoal'));
const GoalDetails = lazy(() => import('~screens/Goals/GoalDetails'));
const About = lazy(() => import('~screens/Profile/About'));
const Profile = lazy(() => import('~screens/Profile'));
const Modals = lazy(() => import('~screens/Modals'));
const DateUpdater = lazy(() => import('~screens/Home/DateUpdater'));
const CoverViewer = lazy(() => import('~screens/Home/CoverViewer'));

const UnderConstruction = lazy(() => import('./UnderConstruction'));

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

type BottomTabRouteName = 'HomeNavigator' | 'StatNavigator' | 'AddCustomBookNavigator' | 'GoalsNavigator' | 'ProfileNavigator';

const TabBarWithBanner = (props: BottomTabBarProps) => (
  <>
    <BannerAd />
    {}
    <BottomTabBar {...props} />
  </>
);

const StatNavigator = () => {
  const { t } = useTranslation('statistic');

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary_dark,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral_medium,
        },
        headerTintColor: colors.neutral_light,
      }}
    >
      <Stack.Screen name={STAT_ROUTE} options={{ title: t('statistic') }}>
        {() => (
          <InSuspense>
            <Statistic />
          </InSuspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

type GoalsNavigatorProps = {
  hasGoal: boolean;
  goalType: GoalType | null;
};

const GoalsNavigator: FC<GoalsNavigatorProps> = ({ hasGoal, goalType }) => {
  const { t } = useTranslation('goals');

  return (
    <Stack.Navigator
      initialRouteName={hasGoal ? GOAL_DETAILS : GOALS_ROUTE}
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary_dark,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral_medium,
        },
        headerTintColor: colors.neutral_light,
      }}
    >
      <Stack.Screen
        name={GOALS_ROUTE}
        options={{
          title: t('readingTracker'),
        }}
      >
        {() => (
          <InSuspense>
            <Goals />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen name={ADD_GOAL} options={{ title: t('addGoal') }}>
        {() => (
          <InSuspense>
            <AddGoal />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen name={EDIT_GOAL} options={{ presentation: 'modal', title: t('editGoal') }}>
        {() => (
          <InSuspense>
            <EditGoal />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen
        name={GOAL_DETAILS}
        options={{
          title: t('goalFor', {
            date:
              goalType === DAILY
                ? new Date().toLocaleString(i18n.language, { day: 'numeric', month: 'long' })
                : new Date().toLocaleString(i18n.language, { month: 'long', year: 'numeric' }),
          }),
          headerLeft: undefined,
          headerRight: EditComponent,
        }}
      >
        {() => (
          <InSuspense>
            <GoalDetails />
          </InSuspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const HomeNavigator = () => {
  const { t } = useTranslation(['search', 'common']);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary_dark,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral_medium,
        },
        presentation: 'modal',
        headerTintColor: colors.neutral_light,
      }}
    >
      <Stack.Screen name={HOME_ROUTE} component={Home} options={{ headerShown: false }} />
      <Stack.Screen name={SEARCH_ROUTE} options={{ title: t('search') }}>
        {() => (
          <InSuspense>
            <Search />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen
        name={FITLERING_ROUTE}
        options={{
          headerRight: ClearFilters,
          title: t('common:categoriesTitle'),
        }}
      >
        {() => (
          <InSuspense>
            <Filtering />
          </InSuspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const AddCustomBookNavigator: FC = () => {
  const { t } = useTranslation(['customBook', 'common']);

  return (
    <Stack.Navigator
      initialRouteName={CUSTOM_BOOKS_ROUTE}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.primary_dark,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral_medium,
        },
        headerTintColor: colors.neutral_light,
      }}
    >
      <Stack.Screen name={CUSTOM_BOOKS_ROUTE} options={{ title: t('addCustomBook') }}>
        {() => (
          <InSuspense>
            <AddCustomBook />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen
        name={CUSTOM_CATEGORY_CHOOSER_ROUTE}
        options={{
          presentation: 'modal',
          title: t('common:genresTitle'),
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary_dark,
            shadowColor: 'transparent',
            borderBottomWidth: 1,
            borderBottomColor: colors.neutral_medium,
          },
          headerTintColor: colors.neutral_light,
        }}
      >
        {() => (
          <InSuspense>
            <CategoryChooser />
          </InSuspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

type ProfileNavigatorProps = {
  isUpdateAvailable: boolean;
  googlePlayUrl: string;
};

const ProfileNavigator: FC<ProfileNavigatorProps> = ({ isUpdateAvailable, googlePlayUrl }) => {
  const { t } = useTranslation(['profile', 'auth']);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary_dark,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral_medium,
        },
        headerTintColor: colors.neutral_light,
      }}
    >
      <Stack.Screen name={PROFILE_ROUTE} options={{ title: t('profile') }}>
        {() => (
          <InSuspense>
            <Profile isUpdateAvailable={isUpdateAvailable} googlePlayUrl={googlePlayUrl} />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen name={ABOUT_ROUTE} options={{ title: t('about') }}>
        {() => (
          <InSuspense>
            <About />
          </InSuspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

type MainNavigatorProps = {
  isUpdateAvailable: boolean;
  googlePlayUrl: string;
  hasGoal: boolean;
  goalType: GoalType | null;
};

type TabNavigatorProps = {
  isUpdateAvailable: boolean;
  googlePlayUrl: string;
  hasGoal: boolean;
  goalType: GoalType | null;
};

const getIcon = (focused: boolean, route: RouteProp<ParamListBase, string>) => {
  const icon = {
    HomeNavigator: (
      <HomeIcon width={BOTTOM_BAR_ICON.width} height={BOTTOM_BAR_ICON.height} fill={focused ? colors.neutral_light : colors.neutral_medium} />
    ),
    StatNavigator: (
      <StatIcon width={BOTTOM_BAR_ICON.width} height={BOTTOM_BAR_ICON.height} fill={focused ? colors.neutral_light : colors.neutral_medium} />
    ),
    AddCustomBookNavigator: (
      <AddCustomBookIcon
        width={BOTTOM_BAR_ADD_ICON.width}
        height={BOTTOM_BAR_ADD_ICON.height}
        strokeWidth={1.5}
        stroke={focused ? colors.neutral_light : colors.neutral_medium}
      />
    ),
    GoalsNavigator: (
      <GoalIcon width={BOTTOM_BAR_ICON.width} height={BOTTOM_BAR_ICON.height} fill={focused ? colors.neutral_light : colors.neutral_medium} />
    ),
    ProfileNavigator: (
      <ProfileIcon width={BOTTOM_BAR_ICON.width} height={BOTTOM_BAR_ICON.height} fill={focused ? colors.neutral_light : colors.neutral_medium} />
    ),
  } as Record<BottomTabRouteName, React.ReactElement>;

  const routeName = route.name as BottomTabRouteName;
  return icon[routeName] ?? null;
};

const TabNavigator: FC<TabNavigatorProps> = ({ isUpdateAvailable, googlePlayUrl, hasGoal, goalType }) => {
  const { t } = useTranslation(['common']);

  return (
    <Tab.Navigator
      initialRouteName={HOME_NAVIGATOR_ROUTE}
      backBehavior='history'
      screenOptions={({ route }) => ({
        tabBarStyle: { backgroundColor: colors.primary_dark, elevation: 0, borderTopWidth: 1, borderTopColor: colors.neutral_medium },
        tabBarShowLabel: false,
        headerShown: false,
        tabBarIcon: ({ focused }) => getIcon(focused, route),
      })}
      tabBar={TabBarWithBanner}
    >
      <Tab.Screen name={HOME_NAVIGATOR_ROUTE} component={HomeNavigator} />
      <Tab.Screen name={STAT_NAVIGATOR_ROUTE} component={StatNavigator} />
      <Tab.Screen name={ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE}>{() => <AddCustomBookNavigator />}</Tab.Screen>
      <Tab.Screen name={GOALS_NAVIGATOR_ROUTE}>{() => <GoalsNavigator goalType={goalType} hasGoal={hasGoal} />}</Tab.Screen>
      <Tab.Screen
        name={PROFILE_NAVIGATOR_ROUTE}
        options={{
          tabBarBadge: isUpdateAvailable ? t('common:alert') : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.success, color: colors.primary_dark },
        }}
      >
        {() => <ProfileNavigator isUpdateAvailable={isUpdateAvailable} googlePlayUrl={googlePlayUrl} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const MainNavigator: FC<MainNavigatorProps> = ({ isUpdateAvailable, googlePlayUrl, hasGoal, goalType }) => {
  const { t } = useTranslation(['books', 'customBook']);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary_dark,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: colors.neutral_medium,
        },
        headerTintColor: colors.neutral_light,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name='MainTabs' options={{ headerShown: false }}>
        {() => <TabNavigator isUpdateAvailable={isUpdateAvailable} googlePlayUrl={googlePlayUrl} goalType={goalType} hasGoal={hasGoal} />}
      </Stack.Screen>
      <Stack.Screen
        name={BOOK_NOTE_ROUTE}
        options={{
          headerRight: CloseComponent,
          title: t('books:bookNote'),
        }}
      >
        {() => (
          <InSuspense>
            <BookNote />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen
        name={EDIT_CUSTOM_BOOK_ROUTE}
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary_dark,
            shadowColor: 'transparent',
            borderBottomWidth: 1,
            borderBottomColor: colors.neutral_medium,
          },
          headerTintColor: colors.neutral_light,
          presentation: 'modal',
          title: t('customBook:editCustomBookTitle'),
        }}
      >
        {() => (
          <InSuspense>
            <EditCustomBook />
          </InSuspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const Main = () => {
  const { t } = useTranslation('common');
  const [shouldDisplayUnderConstructionView, setShouldDisplayUnderConstructionView] = useState(false);
  const [googlePlayUrl, setGooglePlayUrl] = useState('');

  const dispatch = useAppDispatch();
  // Хук для проверки EAS Updates
  const { checkAndInstallUpdate, isUpdateAvailable } = useAppUpdates();

  const checkingStatus = useAppSelector(getCheckingStatus);
  const hasGoal = !!useAppSelector(getGoalNumberOfPages);
  const goalType = useAppSelector(getGoalType);

  // Вспомогательная функция для загрузки категорий из локальной БД
  const loadCategoriesToRedux = useCallback(async () => {
    try {
      const { language } = i18n;
      const categoriesFromDB = await loadCategories(language);
      if (categoriesFromDB.length > 0) {
        dispatch(setCategories(categoriesFromDB));
        return;
      }
      // Если категорий нет, инициализируем из config/categories.ts
      const { initializeCategoriesFromJson } = await import('~utils/boardStorage');
      const initializedCategories = await initializeCategoriesFromJson(language);
      if (initializedCategories.length > 0) {
        dispatch(setCategories(initializedCategories));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, [dispatch]);

  const loadLocalData = useCallback(async () => {
    try {
      await hydrateBooksTableFromCache();
    } catch (error) {
      console.error('Error hydrating books table from cache:', error);
    }

    // Загружаем цель из локальной БД
    try {
      const localGoal = await loadGoal();
      if (localGoal) {
        dispatch(setGoal({ pages: localGoal.numberOfPages || 0, type: localGoal.goalType as GoalType }));
      }
    } catch (error) {
      console.error('Error loading goal from local DB:', error);
    }

    // Загружаем заметки из локальной БД
    try {
      const localBookNotes = await loadBookNotes();
      if (localBookNotes.length > 0) {
        dispatch(setBookNotes(localBookNotes));
      }
    } catch (error) {
      console.error('Error loading book notes from local DB:', error);
    }

    // Загружаем лайки из локальной БД
    try {
      const localUserVotes = await loadUserVotes();
      if (localUserVotes.length > 0) {
        dispatch(setBookVotes(localUserVotes));
      }
    } catch (error) {
      console.error('Error loading user votes from local DB:', error);
    }

    // Загружаем рейтинги из локальной БД
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
    } catch (error) {
      console.error('Error loading goal items from local DB:', error);
    }

    // Загружаем книги из локальной БД для досок
    try {
      const boardTypes = [PLANNED, IN_PROGRESS, COMPLETED] as const;
      for (const boardType of boardTypes) {
        try {
          await dispatch(loadBookListFromLocalDB({ boardType, shouldLoadMoreResults: false })).unwrap();
        } catch (error) {
          console.error(`Error loading books for board ${boardType} from local DB:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading books from local DB:', error);
    }
  }, [dispatch]);

  const initializeApp = useCallback(async () => {
    try {
      await initDatabase();
      await loadCategoriesToRedux();

      let profile = await loadProfile();

      if (!profile) {
        await saveGuestProfile();
        profile = await loadProfile();
      }

      await loadLocalData();

      dispatch(
        initializationComplete({
          profile: profile || null,
          isSignedIn: Boolean(profile?.email),
        }),
      );
    } catch (error) {
      console.error('Error in initializeApp:', error);
      dispatch(initializationComplete({ profile: null, isSignedIn: false }));
    }
  }, [dispatch, loadCategoriesToRedux, loadLocalData]);

  // Инициализация конфигурации приложения
  useEffect(() => {
    const initConfig = async () => {
      await initializeAppConfig();
      setGooglePlayUrl(APP_CONFIG.googlePlayUrl);

      if (APP_CONFIG.underConstruction) {
        setShouldDisplayUnderConstructionView(true);
      } else {
        recordAppOpen();
        initializeApp();
      }
    };

    initConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Проверка EAS Updates при запуске приложения
  useEffect(() => {
    checkAndInstallUpdate().catch(() => {
      // Игнорируем ошибки проверки обновлений
    });
  }, [checkAndInstallUpdate]);

  // Проверка EAS Updates после завершения проверки (если была)
  useEffect(() => {
    if (checkingStatus === SUCCEEDED) {
      // Мягкий запрос оценки приложения при выполнении локальных критериев
      maybeAskForReview().catch(() => {
        // Игнорируем ошибки StoreReview
      });
    }
  }, [checkingStatus]);

  if (shouldDisplayUnderConstructionView) {
    return (
      <InSuspense>
        <UnderConstruction />
      </InSuspense>
    );
  }

  // Показываем Splash только при первой инициализации (IDLE)
  if (checkingStatus === IDLE) {
    return <Splash />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainNavigator isUpdateAvailable={isUpdateAvailable} googlePlayUrl={googlePlayUrl} goalType={goalType} hasGoal={hasGoal} />
        <InSuspense>
          <>
            <Modals />
            <DateUpdater />
            <CoverViewer />
          </>
        </InSuspense>
        {/* Показываем спиннер во время инициализации */}
        {checkingStatus === PENDING && <Spinner label={t('syncingData')} />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Main;
