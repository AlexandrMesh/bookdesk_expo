import React, { useCallback, useEffect, useRef } from 'react';

import { View, Text, Pressable, Animated, Easing } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { Sparkles, AlertCircle, BookOpen, RefreshCw, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { PENDING, SUCCEEDED, FAILED, IDLE } from '~constants/loadingStatuses';
import { loadRecommendations, refreshRecommendations } from '~redux/actions/recommendationsActions';
import { getRecommendations, getRecommendationsLoadingStatus, getRecommendationsError } from '~redux/selectors/recommendations';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';
import Button from '~UI/Button';
import { IRecommendedBook } from '~utils/aiRecommendations';

import RecommendedBookItem from './RecommendedBookItem';
import createStyles from './styles';

const ITEM_HEIGHT = 240;

// Cast to any to avoid TypeScript issues with FlashList props
const VirtualizedFlashList: any = FlashList;

const RecommendedBooks = () => {
  const { t } = useTranslation(['books', 'recommendations', 'common']);
  const dispatch = useAppDispatch();
  const styles = useThemedStyles(createStyles);
  const themeColors = useThemeColors();

  const recommendations = useAppSelector(getRecommendations);
  const loadingStatus = useAppSelector(getRecommendationsLoadingStatus);
  const error = useAppSelector(getRecommendationsError);

  // Animations for sparkle stars
  const star1Opacity = useRef(new Animated.Value(0)).current;
  const star2Opacity = useRef(new Animated.Value(0)).current;
  const star3Opacity = useRef(new Animated.Value(0)).current;
  const star4Opacity = useRef(new Animated.Value(0)).current;
  const star1Scale = useRef(new Animated.Value(0.5)).current;
  const star2Scale = useRef(new Animated.Value(0.5)).current;
  const star3Scale = useRef(new Animated.Value(0.5)).current;
  const star4Scale = useRef(new Animated.Value(0.5)).current;

  // Start loading animation - blinking stars around the icon
  useEffect(() => {
    if (loadingStatus === PENDING) {
      const createStarAnimation = (opacityAnim: Animated.Value, scaleAnim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.5,
                duration: 400,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(800),
          ]),
        );
      };

      const anim1 = createStarAnimation(star1Opacity, star1Scale, 0);
      const anim2 = createStarAnimation(star2Opacity, star2Scale, 300);
      const anim3 = createStarAnimation(star3Opacity, star3Scale, 600);
      const anim4 = createStarAnimation(star4Opacity, star4Scale, 900);

      anim1.start();
      anim2.start();
      anim3.start();
      anim4.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
        anim4.stop();
        star1Opacity.setValue(0);
        star2Opacity.setValue(0);
        star3Opacity.setValue(0);
        star4Opacity.setValue(0);
        star1Scale.setValue(0.5);
        star2Scale.setValue(0.5);
        star3Scale.setValue(0.5);
        star4Scale.setValue(0.5);
      };
    }
  }, [loadingStatus, star1Opacity, star2Opacity, star3Opacity, star4Opacity, star1Scale, star2Scale, star3Scale, star4Scale]);

  // Load recommendations on mount
  useEffect(() => {
    if (loadingStatus === IDLE && recommendations.length === 0) {
      dispatch(loadRecommendations(false));
    }
  }, [loadingStatus, recommendations.length, dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(refreshRecommendations());
  }, [dispatch]);

  const getErrorMessage = useCallback(
    (errorCode: string): string => {
      switch (errorCode) {
        case 'NO_RECOMMENDATIONS_FOUND':
          return t('recommendations:errorNoRecommendations');
        case 'NETWORK_ERROR':
          return t('recommendations:errorNetwork');
        default:
          return t('recommendations:errorGeneric');
      }
    },
    [t],
  );

  const renderItem = useCallback(({ item }: { item: IRecommendedBook }) => <RecommendedBookItem book={item} />, []);

  const keyExtractor = useCallback((item: IRecommendedBook) => item.id, []);

  // Loading view with animated sparkle stars
  if (loadingStatus === PENDING) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <View style={styles.aiIconContainer}>
            {/* Main AI icon */}
            <Sparkles size={60} color={themeColors.accent} />
            
            {/* Animated stars around */}
            <Animated.View style={[styles.star, styles.star1, { opacity: star1Opacity, transform: [{ scale: star1Scale }] }]}>
              <Star size={16} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
            <Animated.View style={[styles.star, styles.star2, { opacity: star2Opacity, transform: [{ scale: star2Scale }] }]}>
              <Star size={12} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
            <Animated.View style={[styles.star, styles.star3, { opacity: star3Opacity, transform: [{ scale: star3Scale }] }]}>
              <Star size={14} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
            <Animated.View style={[styles.star, styles.star4, { opacity: star4Opacity, transform: [{ scale: star4Scale }] }]}>
              <Star size={10} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
          </View>
          <Text style={styles.loadingText}>{t('recommendations:loadingRecommendations')}</Text>
          <Text style={styles.loadingSubtext}>{t('recommendations:loadingSubtext')}</Text>
        </View>
      </View>
    );
  }

  // Error view
  if (loadingStatus === FAILED && error) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.errorContainer}>
          <AlertCircle size={60} color={themeColors.error} />
          <Text style={styles.errorText}>{getErrorMessage(error)}</Text>
          <Button style={styles.retryButton} titleStyle={styles.retryButtonTitle} title={t('common:retry')} onPress={handleRefresh} />
        </View>
      </View>
    );
  }

  // Empty state
  if (loadingStatus === SUCCEEDED && recommendations.length === 0) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            <BookOpen size={60} color={themeColors.neutral_medium} />
          </View>
          <Text style={styles.emptyTitle}>{t('recommendations:emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('recommendations:emptyDescription')}</Text>
          <Button style={styles.retryButton} titleStyle={styles.retryButtonTitle} title={t('recommendations:refresh')} onPress={handleRefresh} />
        </View>
      </View>
    );
  }

  // Recommendations list
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerWrapper}>
        <Sparkles size={16} color={themeColors.accent} />
        <Text style={styles.headerTitle}>{t('recommendations:poweredByAI')}</Text>
        <Pressable style={styles.refreshButton} onPress={handleRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <RefreshCw size={18} color={themeColors.neutral_light} />
        </Pressable>
      </View>
      <View style={styles.container}>
        <VirtualizedFlashList
          data={recommendations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={ITEM_HEIGHT}
          ListFooterComponent={
            <View style={styles.footerRefreshWrapper}>
              <Button style={styles.footerRefreshButton} titleStyle={styles.retryButtonTitle} title={t('recommendations:refresh')} onPress={handleRefresh} />
            </View>
          }
        />
      </View>
    </View>
  );
};

export default RecommendedBooks;
