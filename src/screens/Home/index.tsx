import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Animated, Dimensions, Easing, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SceneMap, TabView } from 'react-native-tab-view';

import { useAppSelector } from '~hooks';
import SettingsIcon from '~assets/settings.svg';
import { BOARD_SETTINGS_ROUTE } from '~constants/routes';
import { getHiddenBoards } from '~redux/selectors/common';

import { PENDING } from '~constants/loadingStatuses';
import useNetworkStatus from '~hooks/useNetworkStatus';
import { getRecommendations, getRecommendationsLoadingStatus, getRecommendationsLastUpdated } from '~redux/selectors/recommendations';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import CompletedBooks from './CompletedBooks';
import InProgressBooks from './InProgressBooks';
import PlannedBooks from './PlannedBooks';
import RecommendedBooks from './RecommendedBooks';
import createStyles from './styles';

const { width: screenWidth } = Dimensions.get('window');

// Scene maps for with and without recommendations
const renderSceneWithRecommendations = SceneMap({
  recommended: RecommendedBooks,
  planned: PlannedBooks,
  inProgress: InProgressBooks,
  completed: CompletedBooks,
});

const renderSceneWithoutRecommendations = SceneMap({
  planned: PlannedBooks,
  inProgress: InProgressBooks,
  completed: CompletedBooks,
});

type TabMeasurement = {
  x: number;
  width: number;
};

const VALID_BOARD_KEYS = ['recommended', 'planned', 'inProgress', 'completed'];

const Home = () => {
  const { t } = useTranslation('books');
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<any>();
  const hiddenBoards = useAppSelector(getHiddenBoards);
  const [index, setIndex] = useState(0);
  const [tabMeasurements, setTabMeasurements] = useState<Map<number, TabMeasurement>>(new Map());
  const [measurementsReady, setMeasurementsReady] = useState(false);
  const [indicatorVisible, setIndicatorVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hasCachedRecommendations, setHasCachedRecommendations] = useState<boolean | null>(null);

  // Check network status and recommendations
  const isOnline = useNetworkStatus();
  const recommendations = useAppSelector(getRecommendations);
  const recommendationsLoadingStatus = useAppSelector(getRecommendationsLoadingStatus);
  const lastUpdated = useAppSelector(getRecommendationsLastUpdated);
  const isRecommendationsLoading = recommendationsLoadingStatus === PENDING;

  // Check if we have cached recommendations (from Redux or local storage)
  const hasRecommendations = recommendations.length > 0 || lastUpdated !== null;

  // Check local cache for recommendations on mount
  useEffect(() => {
    const checkCachedRecommendations = async () => {
      try {
        const { getCachedRecommendations } = await import('~utils/aiRecommendations');
        const cached = await getCachedRecommendations();
        setHasCachedRecommendations(cached !== null && cached.books.length > 0);
      } catch {
        setHasCachedRecommendations(false);
      }
    };
    checkCachedRecommendations();
  }, []);

  // Determine if we should show the Recommended tab
  // Show if: has recommendations in Redux OR has cached recommendations OR is online (can load)
  const showRecommendedTab = hasRecommendations || hasCachedRecommendations === true || isOnline;

  // Blinking animation for "Recommended" tab when loading
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Only blink when: recommended tab is shown, loading, and not on the Recommended tab
    if (showRecommendedTab && isRecommendationsLoading && index !== 0) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => {
        animation.stop();
        blinkAnim.setValue(1);
      };
    } else {
      blinkAnim.setValue(1);
    }
  }, [isRecommendationsLoading, index, blinkAnim, showRecommendedTab]);

  const renderLazyPlaceholder = () => <View style={{ flex: 1, backgroundColor: themeColors.primary_dark }} />;

  // Validate hiddenBoards - only allow valid board keys
  const validHiddenBoards = useMemo(() => {
    if (!Array.isArray(hiddenBoards)) return [];
    return hiddenBoards.filter((key) => VALID_BOARD_KEYS.includes(key));
  }, [hiddenBoards]);

  const routes = useMemo(() => {
    const baseRoutes = [
      { key: 'planned', title: t('planned') },
      { key: 'inProgress', title: t('inProgress') },
      { key: 'completed', title: t('completed') },
    ];

    const allRoutes = showRecommendedTab
      ? [{ key: 'recommended', title: t('recommended') }, ...baseRoutes]
      : baseRoutes;

    // Only filter if we have valid hidden boards
    if (validHiddenBoards.length === 0) {
      return allRoutes;
    }

    const filteredRoutes = allRoutes.filter((route) => !validHiddenBoards.includes(route.key));

    // Always show at least one board (planned as fallback)
    if (filteredRoutes.length === 0) {
      return [{ key: 'planned', title: t('planned') }];
    }

    return filteredRoutes;
  }, [t, showRecommendedTab, validHiddenBoards]);

  // Select the appropriate scene renderer based on whether recommended tab is shown
  const renderScene = showRecommendedTab ? renderSceneWithRecommendations : renderSceneWithoutRecommendations;

  const handleTabLayout = useCallback(
    (tabIndex: number, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;

      // Округляем значения чтобы избежать микро-изменений
      const roundedX = Math.round(x * 100) / 100;
      const roundedWidth = Math.round(width * 100) / 100;

      setTabMeasurements((prev) => {
        const updated = new Map(prev);
        const existingMeasurement = prev.get(tabIndex);

        // Обновляем только если значения значительно изменились (больше 0.5px)
        const shouldUpdate =
          !existingMeasurement || Math.abs(existingMeasurement.x - roundedX) > 0.5 || Math.abs(existingMeasurement.width - roundedWidth) > 0.5;

        if (shouldUpdate) {
          updated.set(tabIndex, { x: roundedX, width: roundedWidth });

          // Сбрасываем предыдущий таймаут
          if (layoutTimeoutRef.current) {
            clearTimeout(layoutTimeoutRef.current);
          }

          // Даем время чтобы убедиться что все измерения завершились
          layoutTimeoutRef.current = setTimeout(() => {
            if (updated.size === routes.length) {
              setMeasurementsReady(true);
            }
          }, 100);

          return updated;
        }

        return prev;
      });
    },
    [routes.length],
  );

  // Сбрасываем измерения при изменении routes (например, при смене языка)
  useEffect(() => {
    // Намеренно сбрасываем состояние синхронно при изменении routes
    setMeasurementsReady(false);
    setTabMeasurements(new Map());
    setIndicatorVisible(false);
  }, [routes]);

  // Инициализируем индикатор после того как измерения готовы
  useEffect(() => {
    if (measurementsReady && !indicatorVisible) {
      // Даем время для правильной установки позиции индикатора
      const timeoutId = setTimeout(() => {
        setIndicatorVisible(true);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [measurementsReady, indicatorVisible]);

  useEffect(() => {
    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, []);

  // Автоматический скролл к активному табу
  useEffect(() => {
    if (!measurementsReady || !scrollViewRef.current) return;

    const measurement = tabMeasurements.get(index);
    if (!measurement) return;

    // Используем requestAnimationFrame для отложенного скролла
    const rafId = requestAnimationFrame(() => {
      if (!scrollViewRef.current) return;

      const scrollViewWidth = screenWidth;
      const tabX = measurement.x;
      const tabWidth = measurement.width;
      const tabCenter = tabX + tabWidth / 2;

      // Скроллим так чтобы таб был примерно в центре видимой области
      const targetScrollX = Math.max(0, tabCenter - scrollViewWidth / 2);

      scrollViewRef.current.scrollTo({
        x: targetScrollX,
        animated: true,
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [index, measurementsReady, tabMeasurements]);

  const handleTabPress = useCallback((tabIndex: number) => {
    setIndex(tabIndex);
  }, []);

  // Мемоизируем расчеты для индикатора чтобы избежать пересоздания интерполяций
  const indicatorData = useMemo(() => {
    if (!measurementsReady || tabMeasurements.size !== routes.length || routes.length === 0) {
      return null;
    }

    // inputRange must have at least 2 elements for interpolation
    const inputRange = routes.length === 1 ? [0, 1] : routes.map((_, i) => i);

    // Находим максимальную ширину для базового размера индикатора
    const measurements = Array.from(tabMeasurements.values());
    const maxWidth = Math.max(...measurements.map((m) => m.width), 100);

    // Получаем массивы позиций и ширин для интерполяции
    const outputRangeX =
      routes.length === 1
        ? [tabMeasurements.get(0)?.x ?? 0, tabMeasurements.get(0)?.x ?? 0]
        : inputRange.map((i) => {
            const measurement = tabMeasurements.get(i);
            return measurement?.x ?? 0;
          });

    const outputRangeWidth =
      routes.length === 1
        ? [tabMeasurements.get(0)?.width ?? 100, tabMeasurements.get(0)?.width ?? 100]
        : inputRange.map((i) => {
            const measurement = tabMeasurements.get(i);
            return measurement?.width ?? 100;
          });

    return {
      inputRange,
      maxWidth,
      outputRangeX,
      outputRangeWidth,
    };
  }, [measurementsReady, tabMeasurements, routes]);

  const tabBarStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: themeColors.primary_dark,
          borderBottomWidth: 1,
          borderColor: themeColors.neutral_medium,
        },
        scrollView: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: 2,
        },
        tab: {
          paddingHorizontal: 10,
          paddingVertical: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        indicator: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 2,
          backgroundColor: themeColors.neutral_light,
        },
        settingsButton: {
          paddingHorizontal: 12,
          paddingVertical: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [themeColors],
  );

  const renderTabBar = useCallback(
    (props: { position?: Animated.AnimatedInterpolation<number> }) => {
      const { position } = props;

      // Always render tabs, even without position/indicatorData
      return (
        <View style={tabBarStyles.container}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            style={tabBarStyles.scrollView}
            contentContainerStyle={tabBarStyles.scrollContent}
          >
            {routes.map((route, i) => {
              const isFocused = index === i;
              const isRecommendedTab = route.key === 'recommended';
              const shouldBlink = isRecommendedTab && isRecommendationsLoading && !isFocused;

              return (
                <Pressable key={route.key} onLayout={(event) => handleTabLayout(i, event)} onPress={() => handleTabPress(i)} style={tabBarStyles.tab}>
                  {shouldBlink ? (
                    <Animated.Text style={[styles.tabBarLabel, { color: themeColors.accent, opacity: blinkAnim }]}>{route.title}</Animated.Text>
                  ) : (
                    <Text style={[styles.tabBarLabel, { color: isFocused ? themeColors.neutral_light : themeColors.neutral_medium }]}>
                      {route.title}
                    </Text>
                  )}
                </Pressable>
              );
            })}
            {position && indicatorData && (
              <Animated.View
                style={[
                  tabBarStyles.indicator,
                  {
                    width: indicatorData.maxWidth,
                    opacity: indicatorVisible ? 1 : 0,
                    transform: [
                      {
                        translateX: position.interpolate({
                          inputRange: indicatorData.inputRange,
                          outputRange: indicatorData.outputRangeX.map((x, i) => {
                            const width = indicatorData.outputRangeWidth[i];
                            const offset = (indicatorData.maxWidth - width) / 2;
                            return x - offset;
                          }),
                          extrapolate: 'clamp',
                        }),
                      },
                      {
                        scaleX: position.interpolate({
                          inputRange: indicatorData.inputRange,
                          outputRange: indicatorData.outputRangeWidth.map((w) => w / indicatorData.maxWidth),
                          extrapolate: 'clamp',
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </ScrollView>
          <TouchableOpacity style={tabBarStyles.settingsButton} onPress={() => navigation.navigate(BOARD_SETTINGS_ROUTE)}>
            <SettingsIcon width={20} height={20} fill={themeColors.neutral_medium} />
          </TouchableOpacity>
        </View>
      );
    },
    [
      routes,
      index,
      handleTabLayout,
      handleTabPress,
      indicatorData,
      indicatorVisible,
      tabBarStyles,
      styles,
      themeColors,
      isRecommendationsLoading,
      blinkAnim,
      navigation,
    ],
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
        swipeEnabled={true}
      />
    </SafeAreaView>
  );
};

export default Home;
