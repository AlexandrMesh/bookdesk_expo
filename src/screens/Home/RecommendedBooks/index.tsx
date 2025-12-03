import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { View, Text, Pressable, Animated, Easing, ToastAndroid } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { Sparkles, AlertCircle, BookOpen, RefreshCw, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { PLANNED, IN_PROGRESS, COMPLETED } from '~constants/boardType';
import { PENDING, SUCCEEDED, FAILED, IDLE } from '~constants/loadingStatuses';
import useNetworkStatus from '~hooks/useNetworkStatus';
import { loadRecommendations, refreshRecommendations } from '~redux/actions/recommendationsActions';
import { deriveBoard } from '~redux/selectors/books';
import { getRecommendations, getRecommendationsLoadingStatus, getRecommendationsError } from '~redux/selectors/recommendations';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';
import Button from '~UI/Button';
import { IRecommendedBook } from '~utils/aiRecommendations';

import RecommendedBookItem from './RecommendedBookItem';
import createStyles from './styles';

const MIN_BOOKS_FOR_ANALYSIS = 10;

const ITEM_HEIGHT = 240;

// Cast to any to avoid TypeScript issues with FlashList props
const VirtualizedFlashList: any = FlashList;

const RecommendedBooks = () => {
  const { t, i18n } = useTranslation(['books', 'recommendations', 'common']);
  const dispatch = useAppDispatch();
  const styles = useThemedStyles(createStyles);
  const themeColors = useThemeColors();
  const isOnline = useNetworkStatus();

  // Track language for auto-refresh on change
  const previousLanguageRef = useRef(i18n.language);

  const recommendations = useAppSelector(getRecommendations);
  const loadingStatus = useAppSelector(getRecommendationsLoadingStatus);
  const error = useAppSelector(getRecommendationsError);

  // Get user's total book count from all boards
  const plannedBoard = useAppSelector(deriveBoard(PLANNED));
  const inProgressBoard = useAppSelector(deriveBoard(IN_PROGRESS));
  const completedBoard = useAppSelector(deriveBoard(COMPLETED));

  // Calculate user books count and create set of existing titles for filtering
  const { userBooksCount, existingBookTitles } = useMemo(() => {
    const plannedBooks = plannedBoard?.data || [];
    const inProgressBooks = inProgressBoard?.data || [];
    const completedBooks = completedBoard?.data || [];
    const allUserBooks = [...plannedBooks, ...inProgressBooks, ...completedBooks];

    // Create set of existing book titles (lowercase for comparison)
    const titles = new Set<string>();
    allUserBooks.forEach((book) => {
      if (book.title) {
        titles.add(book.title.toLowerCase().trim());
      }
    });

    return {
      userBooksCount: allUserBooks.length,
      existingBookTitles: titles,
    };
  }, [plannedBoard, inProgressBoard, completedBoard]);

  const hasEnoughBooks = userBooksCount >= MIN_BOOKS_FOR_ANALYSIS;

  // Filter out books that are already in user's library
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      const recTitleLower = rec.title.toLowerCase().trim();
      return !existingBookTitles.has(recTitleLower);
    });
  }, [recommendations, existingBookTitles]);

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

  // Auto-load recommendations on mount (only if online)
  // Triggers when: component mounts AND (status is IDLE AND no recommendations) AND online
  useEffect(() => {
    if (loadingStatus === IDLE && recommendations.length === 0 && isOnline) {
      dispatch(loadRecommendations(false));
    }
  }, [loadingStatus, recommendations.length, dispatch, isOnline]);

  // Auto-refresh when language changes (only if online)
  useEffect(() => {
    const currentLanguage = i18n.language;
    if (previousLanguageRef.current !== currentLanguage && loadingStatus !== PENDING && isOnline) {
      previousLanguageRef.current = currentLanguage;
      // Refresh recommendations with new language
      dispatch(refreshRecommendations());
    }
  }, [i18n.language, loadingStatus, dispatch, isOnline]);

  const handleRefresh = useCallback(() => {
    if (!isOnline) {
      ToastAndroid.show(t('recommendations:errorNetwork'), ToastAndroid.SHORT);
      return;
    }
    dispatch(refreshRecommendations());
  }, [dispatch, isOnline, t]);

  const getErrorMessage = useCallback(
    (errorCode: string): string => {
      switch (errorCode) {
        case 'NO_RECOMMENDATIONS_FOUND':
          return t('recommendations:errorNoRecommendations');
        case 'NETWORK_ERROR':
          return t('recommendations:errorNetwork');
        case 'RATE_LIMIT_EXCEEDED':
          return t('recommendations:errorRateLimit');
        default:
          return t('recommendations:errorGeneric');
      }
    },
    [t],
  );

  const renderItem = useCallback(({ item }: { item: IRecommendedBook }) => <RecommendedBookItem book={item} />, []);

  const keyExtractor = useCallback((item: IRecommendedBook) => item.id, []);

  // Loading view with animated sparkle stars only
  if (loadingStatus === PENDING) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.loadingContainer}>
          <View style={styles.starsContainer}>
            {/* Only animated stars - no main icon */}
            <Animated.View style={[styles.starLoading, styles.starLoading1, { opacity: star1Opacity, transform: [{ scale: star1Scale }] }]}>
              <Star size={28} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
            <Animated.View style={[styles.starLoading, styles.starLoading2, { opacity: star2Opacity, transform: [{ scale: star2Scale }] }]}>
              <Star size={20} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
            <Animated.View style={[styles.starLoading, styles.starLoading3, { opacity: star3Opacity, transform: [{ scale: star3Scale }] }]}>
              <Star size={24} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
            <Animated.View style={[styles.starLoading, styles.starLoading4, { opacity: star4Opacity, transform: [{ scale: star4Scale }] }]}>
              <Star size={18} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
            <Animated.View style={[styles.starLoading, styles.starLoading5, { opacity: star1Opacity, transform: [{ scale: star2Scale }] }]}>
              <Star size={16} color={themeColors.gold} fill={themeColors.gold} />
            </Animated.View>
          </View>
          <Text style={styles.loadingText}>{hasEnoughBooks ? t('recommendations:loadingRecommendations') : t('recommendations:loadingSimple')}</Text>
          {hasEnoughBooks && <Text style={styles.loadingSubtext}>{t('recommendations:loadingSubtext')}</Text>}
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

  // Empty state - all recommendations added to boards
  const allRecommendationsAdded = recommendations.length > 0 && filteredRecommendations.length === 0;

  if (loadingStatus === SUCCEEDED && filteredRecommendations.length === 0) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrapper}>
            {allRecommendationsAdded ? <Sparkles size={60} color={themeColors.accent} /> : <BookOpen size={60} color={themeColors.neutral_medium} />}
          </View>
          <Text style={styles.emptyTitle}>{allRecommendationsAdded ? t('recommendations:allAddedTitle') : t('recommendations:emptyTitle')}</Text>
          <Text style={styles.emptyText}>
            {allRecommendationsAdded ? t('recommendations:allAddedDescription') : t('recommendations:emptyDescription')}
          </Text>
          <Button style={styles.retryButton} titleStyle={styles.retryButtonTitle} title={t('recommendations:refresh')} onPress={handleRefresh} />
        </View>
      </View>
    );
  }

  // Recommendations list (filtered to exclude books already in user's library)
  return (
    <View style={styles.wrapper}>
      <View style={styles.headerWrapper}>
        <Sparkles size={16} color={themeColors.accent} />
        <Text style={styles.headerTitle}>{hasEnoughBooks ? t('recommendations:poweredByAI') : t('recommendations:selectionForYou')}</Text>
        <Pressable style={styles.refreshButton} onPress={handleRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <RefreshCw size={18} color={themeColors.neutral_light} />
        </Pressable>
      </View>
      <View style={styles.container}>
        <VirtualizedFlashList
          data={filteredRecommendations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={ITEM_HEIGHT}
          ListFooterComponent={
            <View style={styles.footerRefreshWrapper}>
              <Button
                style={styles.footerRefreshButton}
                titleStyle={styles.retryButtonTitle}
                title={t('recommendations:refresh')}
                onPress={handleRefresh}
              />
            </View>
          }
        />
      </View>
    </View>
  );
};

export default RecommendedBooks;
