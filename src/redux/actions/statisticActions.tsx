import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import i18n from '~translations/i18n';
import { BookStatus } from '~types/books';
import { IStat } from '~types/stat';
import { getBooksByYear, getGoalItemsByYear, hydrateBooksTableFromCache, initDatabase } from '~utils/boardStorage';
import generateBarChartData from '~utils/generateBarChartData';

const PREFIX = 'STATISTIC';

export const setStat = createAction<IStat>(`${PREFIX}/setStat`);
export const triggerReloadStat = createAction(`${PREFIX}/triggerReloadStat`);
export const clearData = createAction(`${PREFIX}/clearData`);

export const loadStat = createAsyncThunk(`${PREFIX}/loadStat`, async (boardType: BookStatus) => {
  try {
    // Загружаем и группируем книги из локальной БД
    await initDatabase();
    await hydrateBooksTableFromCache();
    const { items, booksReadPerMonth, booksReadPerYear } = await getBooksByYear();

    const chartData = generateBarChartData(items);
    return {
      data: chartData,
      booksReadPerMonth,
      booksReadPerYear,
    };
  } catch (error) {
    console.error('Error loading books stat:', error);
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
