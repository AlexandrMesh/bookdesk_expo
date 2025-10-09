import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
import colors from '~styles/colors';
import AllBooks from './AllBooks';
import CompletedBooks from './CompletedBooks';
import InProgressBooks from './InProgressBooks';
import PlannedBooks from './PlannedBooks';
import styles from './styles';

const { width: screenWidth } = Dimensions.get('window');

const renderLazyPlaceholder = () => <View style={{ flex: 1, backgroundColor: colors.primary_dark }} />;

const renderScene = SceneMap({
  all: AllBooks,
  planned: PlannedBooks,
  inProgress: InProgressBooks,
  completed: CompletedBooks,
});

const Home = () => {
  const { t } = useTranslation('books');
  const [index, setIndex] = useState(0);
  
  const routes = [
    { key: 'all', title: t('recommended') },
    { key: 'planned', title: t('planned') },
    { key: 'inProgress', title: t('inProgress') },
    { key: 'completed', title: t('completed') },
  ];

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={tabBarStyles.indicator}
      style={tabBarStyles.tabBar}
      tabStyle={tabBarStyles.tab}
      labelStyle={styles.tabBarLabel}
      activeColor={colors.neutral_light}
      inactiveColor={colors.neutral_medium}
      pressColor="transparent"
      scrollEnabled={true}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: screenWidth }}
        renderTabBar={renderTabBar}
        lazy
        renderLazyPlaceholder={renderLazyPlaceholder}
        lazyPreloadDistance={0}
      />
    </SafeAreaView>
  );
};

const tabBarStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.primary_dark,
    borderBottomWidth: 1,
    borderColor: colors.neutral_medium,
  },
  tab: {
    paddingHorizontal: 8,
  },
  indicator: {
    backgroundColor: colors.neutral_light,
    height: 2,
  },
});

export default Home;
