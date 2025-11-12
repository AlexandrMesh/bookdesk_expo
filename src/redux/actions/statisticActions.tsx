import React from 'react';

import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import DataService from '~http/services/books';
import DataPointLabel from '~screens/Statistic/DataPointLabel';
import colors from '~styles/colors';
import i18n from '~translations/i18n';
import { BookStatus } from '~types/books';
import { IStat } from '~types/stat';
import { getGoalItemsByYear, initDatabase } from '~utils/boardStorage';
import generateBarChartData from '~utils/generateBarChartData';

const PREFIX = 'STATISTIC';

export const setStat = createAction<IStat>(`${PREFIX}/setStat`);
export const triggerReloadStat = createAction(`${PREFIX}/triggerReloadStat`);
export const clearData = createAction(`${PREFIX}/clearData`);

export const loadStat = createAsyncThunk(`${PREFIX}/loadStat`, async (boardType: BookStatus) => {
  const { language } = i18n;
  try {
    const { data } = (await DataService().getBooksCountByYearForStat({ boardType, language })) || {};
    const chartData = generateBarChartData(data.items);
    return {
      data: chartData,
      booksReadPerMonth: data.booksReadPerMonth,
      booksReadPerYear: data.booksReadPerYear,
    };
  } catch (error) {
    console.error(error);
    return {
      data: {
        data: [],
        totalCount: 0,
        averageReadingSpeed: 0,
        maxValue: 10,
      },
      booksReadPerMonth: 0,
      booksReadPerYear: 0,
    };
  }
});

export const loadPagesStat = createAsyncThunk(`${PREFIX}/loadPagesStat`, async () => {
  try {
    // Загружаем и группируем goal items из локальной БД
    await initDatabase();
    const { items, pagesReadPerMonth, pagesReadPerYear } = await getGoalItemsByYear();

    const chartData = generateBarChartData(items, 20);
    return {
      data: chartData,
      pagesReadPerMonth,
      pagesReadPerYear,
    };
  } catch (error) {
    console.error('Error loading pages stat:', error);
    return {
      data: {
        data: [],
        totalCount: 0,
        averageReadingSpeed: 0,
        maxValue: 10,
      },
      pagesReadPerMonth: 0,
      pagesReadPerYear: 0,
    };
  }
});

export const loadUsersStat = createAsyncThunk(`${PREFIX}/loadUsersStat`, async (boardType: BookStatus) => {
  const { language } = i18n;
  const limit = 100;

  try {
    const { data } = (await DataService().getUsersCompletedBooksCount({ boardType, limit, language })) || {};
    const currentUserPlace = data?.currentUserPlace || '> 100';
    const chartData =
      data?.data.map(({ count }: { count: number }, index: number) => ({
        label: index + 1,
        value: count,
        frontColor: index + 1 === currentUserPlace ? colors.gold : colors.success,
        topLabelComponent: () => <DataPointLabel value={count} />,
      })) || [];
    return {
      data: chartData,
      currentUserPlace,
      maxValue: Math.max(...chartData.map(({ value }: { value: number }) => value)) + 10 || 200,
    };
  } catch (error) {
    console.error(error);
    return {
      data: [],
      currentUserPlace: 0,
      maxValue: 200,
    };
  }
});
