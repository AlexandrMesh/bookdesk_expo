import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Animated, Dimensions, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SceneMap, TabView } from 'react-native-tab-view';

import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import CompletedBooks from './CompletedBooks';
import InProgressBooks from './InProgressBooks';
import PlannedBooks from './PlannedBooks';
import createStyles from './styles';

const { width: screenWidth } = Dimensions.get('window');

const renderScene = SceneMap({
  planned: PlannedBooks,
  inProgress: InProgressBooks,
  completed: CompletedBooks,
});

type TabMeasurement = {
  x: number;
  width: number;
};

const Home = () => {
  const { t } = useTranslation('books');
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [index, setIndex] = useState(0);
  const [tabMeasurements, setTabMeasurements] = useState<Map<number, TabMeasurement>>(new Map());
  const [measurementsReady, setMeasurementsReady] = useState(false);
  const [indicatorVisible, setIndicatorVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const renderLazyPlaceholder = () => <View style={{ flex: 1, backgroundColor: themeColors.primary_dark }} />;

  const routes = useMemo(
    () => [
      { key: 'planned', title: t('planned') },
      { key: 'inProgress', title: t('inProgress') },
      { key: 'completed', title: t('completed') },
    ],
    [t],
  );

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
    if (!measurementsReady || tabMeasurements.size !== routes.length) {
      return null;
    }

    const inputRange = routes.map((_, i) => i);

    // Находим максимальную ширину для базового размера индикатора
    const measurements = Array.from(tabMeasurements.values());
    const maxWidth = Math.max(...measurements.map((m) => m.width));

    // Получаем массивы позиций и ширин для интерполяции
    const outputRangeX = inputRange.map((i) => {
      const measurement = tabMeasurements.get(i);
      return measurement?.x ?? 0;
    });

    const outputRangeWidth = inputRange.map((i) => {
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
          backgroundColor: themeColors.primary_dark,
          borderBottomWidth: 1,
          borderColor: themeColors.neutral_medium,
        },
        scrollView: {
          flexGrow: 0,
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
      }),
    [themeColors],
  );

  const renderTabBar = useCallback(
    (props: { position?: Animated.AnimatedInterpolation<number> }) => {
      const { position } = props;

      if (!position || !indicatorData) {
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

                return (
                  <Pressable
                    key={route.key}
                    onLayout={(event) => handleTabLayout(i, event)}
                    onPress={() => handleTabPress(i)}
                    style={tabBarStyles.tab}
                  >
                    <Text style={[styles.tabBarLabel, { color: isFocused ? themeColors.neutral_light : themeColors.neutral_medium }]}>{route.title}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      }

      const { inputRange, maxWidth, outputRangeX, outputRangeWidth } = indicatorData;

      // scaleX для изменения ширины (вместо width)
      const scaleX = position.interpolate({
        inputRange,
        outputRange: outputRangeWidth.map((w) => w / maxWidth),
        extrapolate: 'clamp',
      });

      // translateX с компенсацией для scaleX (чтобы масштабирование шло от левого края)
      const translateX = position.interpolate({
        inputRange,
        outputRange: outputRangeX.map((x, i) => {
          // Компенсация: scaleX масштабирует от центра, поэтому при уменьшении
          // элемент смещается вправо. Нужно сдвинуть его обратно влево.
          const width = outputRangeWidth[i];
          const offset = (maxWidth - width) / 2;
          return x - offset;
        }),
        extrapolate: 'clamp',
      });

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

              return (
                <Pressable key={route.key} onLayout={(event) => handleTabLayout(i, event)} onPress={() => handleTabPress(i)} style={tabBarStyles.tab}>
                  <Text style={[styles.tabBarLabel, { color: isFocused ? themeColors.neutral_light : themeColors.neutral_medium }]}>{route.title}</Text>
                </Pressable>
              );
            })}
            <Animated.View
              style={[
                tabBarStyles.indicator,
                {
                  width: maxWidth,
                  opacity: indicatorVisible ? 1 : 0,
                  transform: [{ translateX }, { scaleX }],
                },
              ]}
            />
          </ScrollView>
        </View>
      );
    },
    [routes, index, handleTabLayout, handleTabPress, indicatorData, indicatorVisible, tabBarStyles, styles, themeColors],
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
