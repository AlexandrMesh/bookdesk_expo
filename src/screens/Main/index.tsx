import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Constants from 'expo-constants';
import React, { FC, lazy, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { lt } from 'semver';
import AddCustomBookIcon from '~assets/add.svg';
import GoalIcon from '~assets/goal.svg';
import HomeIcon from '~assets/home.svg';
import ProfileIcon from '~assets/profile.svg';
import StatIcon from '~assets/stat.svg';
import { BOTTOM_BAR_ADD_ICON, BOTTOM_BAR_ICON } from '~constants/dimensions';
import { DAILY } from '~constants/goals';
import { IDLE, PENDING } from '~constants/loadingStatuses';
import {
  ABOUT_ROUTE,
  ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE,
  ADD_GOAL,
  BOOK_DETAILS_ROUTE,
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
  SIGN_IN_ROUTE,
  SIGN_UP_ROUTE,
  STAT_NAVIGATOR_ROUTE,
  STAT_ROUTE,
} from '~constants/routes';
import { useAppDispatch, useAppSelector } from '~hooks';
import { checkAuth, getConfig } from '~redux/actions/authActions';
import { getCheckingStatus, getIsSignedIn } from '~redux/selectors/auth';
import { getGoalNumberOfPages, getGoalType } from '~redux/selectors/goals';
import Home from '~screens/Home';
import Splash from '~screens/Splash';
import colors from '~styles/colors';
import i18n from '~translations/i18n';
import { GoalType } from '~types/goals';
import BannerAd from '~UI/BannerAd';
import { MAIN_CONFIG_URL, RESERVE_CONFIG_URL } from '../../config/api';
import ClearFilters from './ClearFilters';
import CloseComponent from './CloseComponent';
import EditComponent from './EditComponent';
import InSuspense from './InSuspense';

const Search = lazy(() => import('~screens/Search'));
const BookNote = lazy(() => import('~screens/Home/BookNote'));
const Filtering = lazy(() => import('~screens/Home/Filtering'));
const CategoryChooser = lazy(() => import('~screens/CustomBooks/AddCustomBook/CategoryChooser'));
const CustomBooks = lazy(() => import('~screens/CustomBooks'));
const EditCustomBook = lazy(() => import('~screens/CustomBooks/EditCustomBook'));
const Statistic = lazy(() => import('~screens/Statistic'));
const Goals = lazy(() => import('~screens/Goals/Goals'));
const AddGoal = lazy(() => import('~screens/Goals/AddGoal'));
const EditGoal = lazy(() => import('~screens/Goals/EditGoal'));
const GoalDetails = lazy(() => import('~screens/Goals/GoalDetails'));
const About = lazy(() => import('~screens/Profile/About'));
const Profile = lazy(() => import('~screens/Profile'));
const BookDetails = lazy(() => import('~screens/Home/BookDetails'));
const Modals = lazy(() => import('~screens/Modals'));
const DateUpdater = lazy(() => import('~screens/Home/DateUpdater'));
const SignIn = lazy(() => import('~screens/Auth/SignIn'));
const SignUp = lazy(() => import('~screens/Auth/SignUp'));

const UnderConstruction = lazy(() => import('./UnderConstruction'));
const UpdateApp = lazy(() => import('./UpdateApp'));
const NoConnection = lazy(() => import('./NoConnection'));

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabBarWithBanner = (props: any) => (
  <>
    <BannerAd />
    { }
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
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name={CUSTOM_BOOKS_ROUTE}>
        {() => (
          <InSuspense>
            <CustomBooks />
          </InSuspense>
        )}
      </Stack.Screen>
      <Stack.Screen name={CUSTOM_CATEGORY_CHOOSER_ROUTE} options={{ presentation: 'modal', title: t('common:categoriesTitle') }}>
        {() => (
          <InSuspense>
            <CategoryChooser />
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
          title: t('editCustomBookTitle'),
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

type ProfileNavigatorProps = {
  isTheLatestAppVersion: boolean;
  googlePlayUrl: string;
};

const ProfileNavigator: FC<ProfileNavigatorProps> = ({ isTheLatestAppVersion, googlePlayUrl }) => {
  const { t } = useTranslation('profile');

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
            <Profile isTheLatestAppVersion={isTheLatestAppVersion} googlePlayUrl={googlePlayUrl} />
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
  isTheLatestAppVersion: boolean;
  googlePlayUrl: string;
  hasGoal: boolean;
  goalType: GoalType | null;
};

const getIcon = (focused: boolean, route: any) => {
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
  };

  return (icon as any)[route.name];
};

const TabNavigator: FC<MainNavigatorProps> = ({ isTheLatestAppVersion, googlePlayUrl, hasGoal, goalType }) => {
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
          tabBarBadge: !isTheLatestAppVersion ? t('common:alert') : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.success, color: colors.primary_dark },
        }}
      >
        {() => <ProfileNavigator isTheLatestAppVersion={isTheLatestAppVersion} googlePlayUrl={googlePlayUrl} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const MainNavigator: FC<MainNavigatorProps> = ({ isTheLatestAppVersion, googlePlayUrl, hasGoal, goalType }) => {
  const { t } = useTranslation(['books']);

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
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {() => <TabNavigator isTheLatestAppVersion={isTheLatestAppVersion} googlePlayUrl={googlePlayUrl} goalType={goalType} hasGoal={hasGoal} />}
      </Stack.Screen>
      <Stack.Screen
        name={BOOK_DETAILS_ROUTE}
        options={{
          headerRight: CloseComponent,
          title: t('books:bookDetails'),
        }}
      >
        {() => (
          <InSuspense>
            <BookDetails />
          </InSuspense>
        )}
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
    </Stack.Navigator>
  );
};

const Main = () => {
  const [shouldDisplayUpdateView, setShouldDisplayUpdateView] = useState(false);
  const [shouldDisplayUnderConstructionView, setShouldDisplayUnderConstructionView] = useState(false);
  const [isTheLatestAppVersion, setIsTheLatestAppVersion] = useState(true);
  const [googlePlayUrl, setGooglePlayUrl] = useState('');
  const { isConnected } = useNetInfo();

  const dispatch = useAppDispatch();
  const _checkAuth = useCallback((token: string) => dispatch(checkAuth(token)), [dispatch]);
  const _getConfig = useCallback((url: string) => dispatch(getConfig(url)), [dispatch]);

  const checkingStatus = useAppSelector(getCheckingStatus);
  const hasGoal = !!useAppSelector(getGoalNumberOfPages);
  const goalType = useAppSelector(getGoalType);
  const isSignedIn = useAppSelector(getIsSignedIn);

  const checkAuthentication = useCallback(async () => {
    try {
      const token = (await AsyncStorage.getItem('token')) as string;
      await _checkAuth(token);
    } catch (e) {
      console.error(e);
    }
  }, [_checkAuth]);

  const getConfiguration = useCallback(
    async (url: string) => {
      try {
        const { minimumSupportedAppVersion, underConstruction, appVersion, googlePlayUrl } = await _getConfig(url).unwrap();
        const currentVersion = Constants.expoConfig?.version || '1.0.0';
        setIsTheLatestAppVersion(appVersion === currentVersion);
        setGooglePlayUrl(googlePlayUrl);
        if (minimumSupportedAppVersion && lt(currentVersion, minimumSupportedAppVersion)) {
          setShouldDisplayUpdateView(true);
        } else if (underConstruction) {
          setShouldDisplayUnderConstructionView(true);
        } else {
          await checkAuthentication();
        }
      } catch (error) {
        // If we have troubles with connection to MAIN_CONFIG_URL we will try to connect to RESERVE_CONFIG_URL
        console.error(error);
        getConfiguration(RESERVE_CONFIG_URL);
      }
    },
    [_getConfig, checkAuthentication],
  );

  useEffect(() => {
    getConfiguration(MAIN_CONFIG_URL);
  }, [getConfiguration]);

  if (shouldDisplayUnderConstructionView) {
    return (
      <InSuspense>
        <UnderConstruction />
      </InSuspense>
    );
  }

  if (shouldDisplayUpdateView) {
    return (
      <InSuspense>
        <UpdateApp />
      </InSuspense>
    );
  }

  if (isConnected === false) {
    return (
      <InSuspense>
        <NoConnection />
      </InSuspense>
    );
  }

  if (checkingStatus === IDLE || checkingStatus === PENDING) {
    return <Splash />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isSignedIn ? (
          <>
            <MainNavigator isTheLatestAppVersion={isTheLatestAppVersion} googlePlayUrl={googlePlayUrl} goalType={goalType} hasGoal={hasGoal} />
            <InSuspense>
              <>
                <Modals />
                <DateUpdater />
              </>
            </InSuspense>
          </>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name={SIGN_IN_ROUTE}>
              {() => (
                <InSuspense>
                  <SignIn />
                </InSuspense>
              )}
            </Stack.Screen>
            <Stack.Screen name={SIGN_UP_ROUTE}>
              {() => (
                <InSuspense>
                  <SignUp />
                </InSuspense>
              )}
            </Stack.Screen>
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default Main;
