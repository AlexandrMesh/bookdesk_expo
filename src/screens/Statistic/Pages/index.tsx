import { useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Spinner } from '~UI/Spinner';
import { useAppDispatch, useAppSelector } from '~hooks';
import { loadPagesStat } from '~redux/actions/statisticActions';
import { getShouldReloadStat } from '~redux/selectors/statistic';
import colors from '~styles/colors';
import styles from '../styles';

const Pages = () => {
  const { t } = useTranslation(['statistic', 'common']);
  const [isLoadingPagesStat, setIsLoadingPagesStat] = useState(true);
  const [pagesStat, setPagesStat] = useState([]);
  const [pagesReadPerMonth, setPagesReadPerMonth] = useState(0);
  const [pagesReadPerYear, setPagesReadPerYear] = useState(0);
  const [totalPagesCount, setTotalPagesCount] = useState(0);
  const [averageReadingPagesSpeed, setAverageReadingPagesSpeed] = useState(0);
  const [maxValueForPagesStat, setMaxValueForPagesStat] = useState(10);

  const dispatch = useAppDispatch();
  const _loadPagesStat = useCallback(() => dispatch(loadPagesStat()), [dispatch]);

  const shouldReloadStat = useAppSelector(getShouldReloadStat);

  const isFocused = useIsFocused();

  const fetchPagesStat = useCallback(async () => {
    setIsLoadingPagesStat(true);
    try {
      const { data, pagesReadPerMonth, pagesReadPerYear } = await _loadPagesStat().unwrap();
      setPagesStat(data.data as any);
      setTotalPagesCount(data.totalCount);
      setAverageReadingPagesSpeed(data.averageReadingSpeed);
      setMaxValueForPagesStat(data.maxValue);
      setPagesReadPerMonth(pagesReadPerMonth);
      setPagesReadPerYear(pagesReadPerYear);
    } finally {
      setIsLoadingPagesStat(false);
    }
  }, [_loadPagesStat]);

  useEffect(() => {
    fetchPagesStat();
  }, [fetchPagesStat]);

  useEffect(() => {
    if (isFocused && shouldReloadStat) {
      fetchPagesStat();
    }
  }, [isFocused, shouldReloadStat, fetchPagesStat]);

  const barChartMaxWidth = 400;
  const maxValueToLimitBarChartMaxWidth = 6;

  return (
    <View style={styles.wrapper}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <View style={styles.statBlock}>
          {isLoadingPagesStat ? (
            <View style={styles.viewWrapper}>
              <Spinner />
            </View>
          ) : (
            <>
              <View style={styles.titleWrapper}>
                <Text style={styles.title}>
                  {t('completedPages')} <Text style={styles.highlightedCount}>{t('common:count', { count: totalPagesCount })}</Text>
                </Text>
              </View>
              <View style={styles.chartWrapper}>
                <BarChart
                  barWidth={32}
                  width={pagesStat?.length <= maxValueToLimitBarChartMaxWidth ? barChartMaxWidth : undefined}
                  noOfSections={3}
                  scrollToEnd
                  maxValue={maxValueForPagesStat}
                  barBorderRadius={4}
                  yAxisTextStyle={{ color: colors.neutral_light }}
                  xAxisColor={colors.neutral_light}
                  yAxisColor={colors.neutral_light}
                  xAxisLabelTextStyle={{ color: colors.neutral_light }}
                  data={pagesStat}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.label}>
                  {t('readPerMonth')} <Text style={styles.highlightedCount}>{t('common:count', { count: pagesReadPerMonth })}</Text>
                </Text>
                <Text style={styles.label}>
                  {t('readPerYear')} <Text style={styles.highlightedCount}>{t('common:count', { count: pagesReadPerYear })}</Text>
                </Text>
                <Text style={styles.label}>
                  {t('averageReadingSpeed')} <Text style={styles.highlightedCount}>{t('common:count', { count: averageReadingPagesSpeed })}</Text>
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Pages;
