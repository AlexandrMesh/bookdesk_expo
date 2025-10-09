import React, { FC } from 'react';
import { Dimensions, View, Text } from 'react-native';
import { TFunction } from 'i18next';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import colors from '~styles/colors';
import { BOOKS_STATISTIC_ROUTE, PAGES_STATISTIC_ROUTE, RATING_STATISTIC_ROUTE } from '~constants/routes';
import { useTranslation } from 'react-i18next';
import styles from './styles';
import Books from './Books';
import Pages from './Pages';
import Rating from './Rating';

type Props = {
  t: TFunction;
};

const Tab = createMaterialTopTabNavigator();

const renderLazyPlaceholder = () => <View style={{ width: '100%', height: '100%', backgroundColor: colors.primary_dark }} />;

const renderLabel = (label: string, focused: boolean) => (
  <View>
    <Text style={[styles.tabBarLabel, { color: focused ? colors.neutral_light : colors.neutral_medium }]}>{label}</Text>
  </View>
);

const HeaderTabs: FC<Props> = ({ t }) => (
  <Tab.Navigator
    initialRouteName={BOOKS_STATISTIC_ROUTE}
    initialLayout={{
      width: Dimensions.get('window').width,
    }}
    screenOptions={{
      tabBarItemStyle: { width: 'auto' },
      lazy: true,
      swipeEnabled: false,
      lazyPlaceholder: renderLazyPlaceholder,
      tabBarStyle: {
        backgroundColor: colors.primary_dark,
        borderBottomWidth: 1,
        borderColor: colors.neutral_medium,
      },
      tabBarIndicatorStyle: { backgroundColor: colors.neutral_light },
    }}
  >
    <Tab.Screen name={BOOKS_STATISTIC_ROUTE} component={Books} options={{ tabBarLabel: ({ focused }) => renderLabel(t('books'), focused) }} />
    <Tab.Screen name={PAGES_STATISTIC_ROUTE} component={Pages} options={{ tabBarLabel: ({ focused }) => renderLabel(t('pages'), focused) }} />
    <Tab.Screen name={RATING_STATISTIC_ROUTE} component={Rating} options={{ tabBarLabel: ({ focused }) => renderLabel(t('rating'), focused) }} />
  </Tab.Navigator>
);

const Statistic = () => {
  const { t } = useTranslation('statistic');
  return (
    <View style={styles.container}>
      <HeaderTabs t={t} />
    </View>
  );
};

export default Statistic;
