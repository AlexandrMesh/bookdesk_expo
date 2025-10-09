import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Spinner } from '~UI/Spinner';
import { COMPLETED } from '~constants/boardType';
import { useAppDispatch, useAppSelector } from '~hooks';
import { loadStat } from '~redux/actions/statisticActions';
import { getShouldReloadStat } from '~redux/selectors/statistic';
import colors from '~styles/colors';
import styles from '../styles';

const Books = () => {
  const { t } = useTranslation(['statistic', 'common']);
  const [isLoadingStat, setIsLoadingStat] = useState(true);
  const [stat, setStat] = useState([]);
  const [booksReadPerMonth, setBooksReadPerMonth] = useState(0);
  const [booksReadPerYear, setBooksReadPerYear] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [averageReadingSpeed, setAverageReadingSpeed] = useState(0);
  const [maxValueForStat, setMaxValueForStat] = useState(10);

  const dispatch = useAppDispatch();
  const _loadStat = useCallback(() => dispatch(loadStat(COMPLETED)), [dispatch]);

  const shouldReloadStat = useAppSelector(getShouldReloadStat);

  const isFocused = useIsFocused();

  const fetchStat = useCallback(async () => {
    setIsLoadingStat(true);
    try {
      const { data, booksReadPerMonth, booksReadPerYear } = await _loadStat().unwrap();
      setStat(data.data as any);
      setTotalCount(data.totalCount);
      setAverageReadingSpeed(data.averageReadingSpeed);
      setMaxValueForStat(data.maxValue);
      setBooksReadPerMonth(booksReadPerMonth);
      setBooksReadPerYear(booksReadPerYear);
    } finally {
      setIsLoadingStat(false);
    }
  }, [_loadStat]);

  useEffect(() => {
    fetchStat();
  }, [fetchStat]);

  useEffect(() => {
    if (isFocused && shouldReloadStat) {
      fetchStat();
    }
  }, [isFocused, shouldReloadStat, fetchStat]);

  const barChartMaxWidth = 400;
  const maxValueToLimitBarChartMaxWidth = 6;

  return (
    <View style={styles.wrapper}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <View style={styles.statBlock}>
          {isLoadingStat ? (
            <View style={styles.viewWrapper}>
              <Spinner />
            </View>
          ) : (
            <>
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>
                  {t('completedBooks')} <Text style={styles.highlightedCount}>{t('common:count', { count: totalCount })}</Text>
                </Text>
              </View>
              <View style={styles.chartWrapper}>
                <BarChart
                  barWidth={32}
                  width={stat?.length <= maxValueToLimitBarChartMaxWidth ? barChartMaxWidth : undefined}
                  noOfSections={3}
                  scrollToEnd
                  maxValue={maxValueForStat}
                  barBorderRadius={4}
                  yAxisTextStyle={{ color: colors.neutral_light }}
                  xAxisColor={colors.neutral_light}
                  yAxisColor={colors.neutral_light}
                  xAxisLabelTextStyle={{ color: colors.neutral_light }}
                  data={stat}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.label}>
                  {t('readPerMonth')} <Text style={styles.highlightedCount}>{t('common:count', { count: booksReadPerMonth })}</Text>
                </Text>
                <Text style={styles.label}>
                  {t('readPerYear')} <Text style={styles.highlightedCount}>{t('common:count', { count: booksReadPerYear })}</Text>
                </Text>
                <Text style={styles.label}>
                  {t('averageReadingSpeed')} <Text style={styles.highlightedCount}>{t('common:count', { count: averageReadingSpeed })}</Text>
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Books;
