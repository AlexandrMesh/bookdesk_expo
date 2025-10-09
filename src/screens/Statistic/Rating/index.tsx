import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spinner } from '~UI/Spinner';
import { COMPLETED } from '~constants/boardType';
import { useAppDispatch, useAppSelector } from '~hooks';
import { loadUsersStat } from '~redux/actions/statisticActions';
import { getShouldReloadStat } from '~redux/selectors/statistic';
import colors from '~styles/colors';
import styles from '../styles';

const Rating = () => {
  const { t } = useTranslation(['statistic', 'common']);
  const [isLoadingUsersStat, setIsLoadingUsersStat] = useState(true);
  const [usersStat, setUsersStat] = useState([]);
  const [currentUserPlace, setCurrentUserPlace] = useState(0);
  const [maxValueForRating, setMaxValueForRating] = useState(200);

  const dispatch = useAppDispatch();
  const _loadUsersStat = useCallback(() => dispatch(loadUsersStat(COMPLETED)), [dispatch]);

  const shouldReloadStat = useAppSelector(getShouldReloadStat);

  const isFocused = useIsFocused();

  const fetchUsersStat = useCallback(async () => {
    setIsLoadingUsersStat(true);
    try {
      const { data, currentUserPlace, maxValue } = await _loadUsersStat().unwrap();
      setUsersStat(data);
      setCurrentUserPlace(currentUserPlace);
      setMaxValueForRating(maxValue);
    } finally {
      setIsLoadingUsersStat(false);
    }
  }, [_loadUsersStat]);

  useEffect(() => {
    fetchUsersStat();
  }, [fetchUsersStat]);

  useEffect(() => {
    if (isFocused && shouldReloadStat) {
      fetchUsersStat();
    }
  }, [isFocused, shouldReloadStat, fetchUsersStat]);

  const barChartMaxWidth = 400;
  const maxValueToLimitBarChartMaxWidth = 6;

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <View style={styles.statBlock}>
          {isLoadingUsersStat ? (
            <View style={styles.viewWrapper}>
              <Spinner />
            </View>
          ) : (
            <>
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>{t('topReaders')}</Text>
              </View>
              <Text style={styles.subTitle}>{t('topReadersDescription')}</Text>
              <View style={styles.chartWrapper}>
                <BarChart
                  barWidth={32}
                  noOfSections={3}
                  barBorderRadius={4}
                  maxValue={maxValueForRating}
                  width={usersStat?.length <= maxValueToLimitBarChartMaxWidth ? barChartMaxWidth : undefined}
                  scrollToIndex={currentUserPlace - 1}
                  yAxisTextStyle={{ color: colors.neutral_light }}
                  xAxisColor={colors.neutral_light}
                  yAxisColor={colors.neutral_light}
                  xAxisLabelTextStyle={{ color: colors.neutral_light }}
                  data={usersStat}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.label}>
                  {t('placeInTheRating')} <Text style={styles.highlightedCount}>{currentUserPlace}</Text>
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Rating;
