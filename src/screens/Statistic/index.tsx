import React, { FC } from 'react';

import { Dimensions, Text, View } from 'react-native';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { BOOKS_STATISTIC_ROUTE, PAGES_STATISTIC_ROUTE } from '~constants/routes';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import Books from './Books';
import Pages from './Pages';
import createStyles from './styles';

type Props = {
  t: TFunction;
};

const Tab = createMaterialTopTabNavigator();

const HeaderTabs: FC<Props> = ({ t }) => {
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const renderLazyPlaceholder = () => <View style={{ width: '100%', height: '100%', backgroundColor: themeColors.primary_dark }} />;

  const renderLabel = (label: string, focused: boolean) => (
    <View>
      <Text style={[styles.tabBarLabel, { color: focused ? themeColors.neutral_light : themeColors.neutral_medium }]}>{label}</Text>
    </View>
  );

  return (
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
          backgroundColor: themeColors.primary_dark,
          borderBottomWidth: 1,
          borderColor: themeColors.neutral_medium,
        },
        tabBarIndicatorStyle: { backgroundColor: themeColors.neutral_light },
      }}
    >
      <Tab.Screen name={BOOKS_STATISTIC_ROUTE} component={Books} options={{ tabBarLabel: ({ focused }) => renderLabel(t('books'), focused) }} />
      <Tab.Screen name={PAGES_STATISTIC_ROUTE} component={Pages} options={{ tabBarLabel: ({ focused }) => renderLabel(t('pages'), focused) }} />
    </Tab.Navigator>
  );
};

const Statistic = () => {
  const { t } = useTranslation('statistic');
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <HeaderTabs t={t} />
    </View>
  );
};

export default Statistic;
