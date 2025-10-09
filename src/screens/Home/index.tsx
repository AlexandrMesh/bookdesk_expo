import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { TFunction } from 'i18next';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ALL_BOOKS_ROUTE, COMPLETED_BOOKS_ROUTE, IN_PROGRESS_BOOKS_ROUTE, PLANNED_BOOKS_ROUTE } from '~constants/routes';
import colors from '~styles/colors';
import AllBooks from './AllBooks';
import CompletedBooks from './CompletedBooks';
import InProgressBooks from './InProgressBooks';
import PlannedBooks from './PlannedBooks';
import styles from './styles';

const Tab = createMaterialTopTabNavigator();

const renderLabel = (label: string, focused: boolean) => (
  <View>
    <Text style={[styles.tabBarLabel, { color: focused ? colors.neutral_light : colors.neutral_medium }]}>{label}</Text>
  </View>
);

type Props = {
  t: TFunction;
};

const renderLazyPlaceholder = () => <View style={{ width: '100%', height: '100%', backgroundColor: colors.primary_dark }} />;

const HeaderTabs: FC<Props> = ({ t }) => (
  <Tab.Navigator
    initialRouteName={ALL_BOOKS_ROUTE}
    initialLayout={{
      width: Dimensions.get('window').width,
    }}
    screenOptions={{
      tabBarItemStyle: { width: 'auto' },
      lazy: true,
      lazyPlaceholder: renderLazyPlaceholder,
      tabBarStyle: {
        backgroundColor: colors.primary_dark,
        borderBottomWidth: 1,
        borderColor: colors.neutral_medium,
      },
      tabBarIndicatorStyle: { backgroundColor: colors.neutral_light },
    }}
  >
    <Tab.Screen name={ALL_BOOKS_ROUTE} component={AllBooks} options={{ tabBarLabel: ({ focused }) => renderLabel(t('recommended'), focused) }} />
    <Tab.Screen name={PLANNED_BOOKS_ROUTE} component={PlannedBooks} options={{ tabBarLabel: ({ focused }) => renderLabel(t('planned'), focused) }} />
    <Tab.Screen
      name={IN_PROGRESS_BOOKS_ROUTE}
      component={InProgressBooks}
      options={{ tabBarLabel: ({ focused }) => renderLabel(t('inProgress'), focused) }}
    />
    <Tab.Screen
      name={COMPLETED_BOOKS_ROUTE}
      component={CompletedBooks}
      options={{ tabBarLabel: ({ focused }) => renderLabel(t('completed'), focused) }}
    />
  </Tab.Navigator>
);

const Home = () => {
  const { t } = useTranslation('books');
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderTabs t={t} />
    </SafeAreaView>
  );
};

export default Home;
