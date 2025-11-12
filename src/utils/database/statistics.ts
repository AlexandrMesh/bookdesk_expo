import { loadGoalItems } from './goals';
import { getDatabase } from './database';

/**
 * Группировка книг со статусом COMPLETED по годам и месяцам для статистики
 */
export const getBooksByYear = async (): Promise<{
  items: Array<{ year: number; month: number; count: number }>;
  booksReadPerMonth: number;
  booksReadPerYear: number;
}> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      book_id: string;
      added: number;
      book_status: string | null;
      timestamp: number;
    }>(`SELECT book_id, added, book_status, timestamp FROM book_dates WHERE book_status = ? ORDER BY added ASC`, ['completed']);

    // Группируем по годам и месяцам
    const groupedByYearMonth: Record<string, number> = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    results.forEach((result) => {
      const date = new Date(result.added);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!groupedByYearMonth[key]) {
        groupedByYearMonth[key] = 0;
      }
      groupedByYearMonth[key] += 1; // Каждая книга = 1
    });

    // Преобразуем в формат для generateBarChartData
    const items = Object.entries(groupedByYearMonth).map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, count };
    });

    // Вычисляем booksReadPerMonth (текущий месяц)
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const booksReadPerMonth = groupedByYearMonth[currentMonthKey] || 0;

    // Вычисляем booksReadPerYear (текущий год)
    const booksReadPerYear = Object.entries(groupedByYearMonth)
      .filter(([key]) => key.startsWith(`${currentYear}-`))
      .reduce((sum, [, count]) => sum + count, 0);

    // eslint-disable-next-line no-console
    console.log(`📚 [getBooksByYear] Сгруппировано по годам/месяцам: ${items.length} записей, всего книг: ${results.length}`);

    return {
      items,
      booksReadPerMonth,
      booksReadPerYear,
    };
  } catch (error) {
    console.error('Error grouping books by year:', error);
    return {
      items: [],
      booksReadPerMonth: 0,
      booksReadPerYear: 0,
    };
  }
};

/**
 * Группировка goal items по годам и месяцам для статистики
 */
export const getGoalItemsByYear = async (): Promise<{
  items: Array<{ year: number; month: number; count: number }>;
  pagesReadPerMonth: number;
  pagesReadPerYear: number;
}> => {
  try {
    const allItems = await loadGoalItems();

    // Группируем по годам и месяцам
    const groupedByYearMonth: Record<string, number> = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    allItems.forEach((item) => {
      const date = new Date(item.added_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!groupedByYearMonth[key]) {
        groupedByYearMonth[key] = 0;
      }
      groupedByYearMonth[key] += item.pages;
    });

    // Преобразуем в формат для generateBarChartData
    const items = Object.entries(groupedByYearMonth).map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, count };
    });

    // Вычисляем pagesReadPerMonth (текущий месяц)
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const pagesReadPerMonth = groupedByYearMonth[currentMonthKey] || 0;

    // Вычисляем pagesReadPerYear (текущий год)
    const pagesReadPerYear = Object.entries(groupedByYearMonth)
      .filter(([key]) => key.startsWith(`${currentYear}-`))
      .reduce((sum, [, count]) => sum + count, 0);

    // eslint-disable-next-line no-console
    console.log(`📊 [getGoalItemsByYear] Сгруппировано по годам/месяцам: ${items.length} записей`);

    return {
      items,
      pagesReadPerMonth,
      pagesReadPerYear,
    };
  } catch (error) {
    console.error('Error grouping goal items by year:', error);
    return {
      items: [],
      pagesReadPerMonth: 0,
      pagesReadPerYear: 0,
    };
  }
};

