import React from 'react';

import range from 'lodash/range';
import sumBy from 'lodash/sumBy';

import { MAPPED_MONTHS } from '~constants/statistic';
import DataPointLabel from '~screens/Statistic/DataPointLabel';
import colors from '~styles/colors';
import { getT } from '~translations/i18n';

const getYearItem = (label: number) => ({
  label,
  labelTextStyle: { color: colors.gold, fontSize: 15, fontWeight: 600 },
  value: 0,
  isYear: true,
  frontColor: colors.success,
  topLabelComponent: () => <DataPointLabel />,
});

export default (data: { year: number; month: number; count: number }[], maxValue: number = 5) => {
  if (!data || data.length === 0) {
    return {
      data: [],
      totalCount: 0,
      averageReadingSpeed: 0,
      maxValue: 10,
    };
  }
  const years = data.map(({ year }) => year);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const yearsArray = range(min, max + 1);
  const arrayWithMonth = (yearsArray as number[]).map((item) => ({
    year: item,
    months: (range(1, 13) as number[]).map((itemInner) => ({ month: itemInner, value: 0 })),
  }));
  const result = arrayWithMonth.map((item) => {
    const findByYears = data.filter((statItem) => statItem.year === item.year);
    const montshArray = item.months.map((itemMonth) => {
      const value = findByYears.find(({ month }) => month === itemMonth.month)?.count || 0;
      return {
        label: getT('statistic')(MAPPED_MONTHS[itemMonth.month]),
        value,
        frontColor: colors.success,
        topLabelComponent: () => <DataPointLabel value={value} />,
      };
    });
    return [getYearItem(item.year), ...montshArray];
  });
  // logic for slice array to get rid from start and end values with 0
  const flattedResult = result.flat();
  const findTheFirstIndexWithValue = flattedResult.findIndex(({ value }) => value > 0);
  const slicedStartResult = flattedResult.slice(findTheFirstIndexWithValue);
  const findTheFirstIndexWithValueInReversedResult = slicedStartResult.reverse().findIndex(({ value }) => value > 0);
  const finalResult = {
    data: [],
  } as { data: { value: number; isYear: boolean; label: number }[] };
  finalResult.data = slicedStartResult.slice(findTheFirstIndexWithValueInReversedResult).reverse() as any;

  if (!finalResult.data[0].isYear) {
    const firstYearLabel =
      finalResult.data.find(({ isYear }) => isYear)?.label ||
      flattedResult.find(({ isYear }) => isYear)?.label ||
      data[0]?.year ||
      new Date().getFullYear();

    finalResult.data = [getYearItem(Number(firstYearLabel)), ...finalResult.data];
  }
  const totalCount = sumBy(finalResult.data, 'value') || 0;
  const averageReadingSpeed = Math.round((totalCount / finalResult.data.filter(({ isYear }) => !isYear).length) * 10) / 10 || 0;
  return {
    data: finalResult.data || [],
    totalCount,
    averageReadingSpeed,
    // + 10 for have top space for visibility of the label on the chart (for the linechart)
    maxValue: Math.max(...finalResult.data.map(({ value }) => value)) + maxValue || 10,
  };
};
