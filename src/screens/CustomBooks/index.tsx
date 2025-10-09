import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { TFunction } from 'i18next';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ADD_CUSTOM_BOOK_ROUTE, CUSTOM_BOOKS_LIST_ROUTE } from '~constants/routes';
import colors from '~styles/colors';
import AddCustomBook from './AddCustomBook';
import CustomBooksList from './CustomBooksList';
import styles from './styles';

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
    initialRouteName={ADD_CUSTOM_BOOK_ROUTE}
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
    <Tab.Screen
      name={ADD_CUSTOM_BOOK_ROUTE}
      component={AddCustomBook}
      options={{ tabBarLabel: ({ focused }) => renderLabel(t('addCustomBook'), focused) }}
    />
    <Tab.Screen
      name={CUSTOM_BOOKS_LIST_ROUTE}
      component={CustomBooksList}
      options={{ tabBarLabel: ({ focused }) => renderLabel(t('customBooks'), focused) }}
    />
  </Tab.Navigator>
);

const CustomBooks = () => {
  const { t } = useTranslation('customBook');
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderTabs t={t} />
    </SafeAreaView>
  );
};

export default CustomBooks;
