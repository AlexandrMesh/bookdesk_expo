import { getDatabase } from './database';
import { loadGoalItems } from './goals';

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
    // Используем единую таблицу books вместо book_dates
    const rawResults = await database.getAllAsync<{
      added: number | null;
      book_status: string | null;
      timestamp: number;
    }>(`SELECT added, book_status, timestamp FROM books WHERE book_status = ? AND added IS NOT NULL ORDER BY added ASC`, ['completed']);

    let results = rawResults;

    if (results.length === 0) {
      try {
        const cachedBoardData = await database.getAllAsync<{
          data: string | null;
        }>(`SELECT data FROM board_data WHERE board_type = ?`, ['completed']);

        if (cachedBoardData.length > 0) {
          const fallbackItems: Array<{ added: number; book_status: string; timestamp: number }> = [];
          cachedBoardData.forEach((record) => {
            if (!record.data) {
              return;
            }
            try {
              const books = JSON.parse(record.data) as Array<{ added?: number | null }>;
              books.forEach((book) => {
                if (book?.added) {
                  fallbackItems.push({
                    added: book.added,
                    book_status: 'completed',
                    timestamp: book.added,
                  });
                }
              });
            } catch (error) {
              console.error('Error parsing board_data for statistics fallback:', error);
            }
          });

          if (fallbackItems.length > 0) {
            results = fallbackItems;
            // eslint-disable-next-line no-console
            console.log(`📚 [getBooksByYear] Использован fallback из board_data: ${fallbackItems.length} записей`);
          }
        }
      } catch (fallbackError) {
        console.error('Error loading fallback board_data for statistics:', fallbackError);
      }
    }

    // Группируем по годам и месяцам
    const groupedByYearMonth: Record<string, number> = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    results.forEach((result) => {
      if (!result.added) {
        return; // Пропускаем записи без даты
      }
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
 * Использует только goal items (журнал прочитанных страниц) для точной статистики
 */
export const getGoalItemsByYear = async (): Promise<{
  items: Array<{ year: number; month: number; count: number }>;
  pagesReadPerMonth: number;
  pagesReadPerYear: number;
}> => {
  try {
    // Загружаем goal items из таблицы goal_items
    // Это журнал прочитанных страниц, где пользователь вручную записывает сколько страниц прочитано
    const allItems = await loadGoalItems();

    // Группируем по годам и месяцам
    const groupedByYearMonth: Record<string, number> = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Добавляем страницы из goal items
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

    // Преобразуем в формат для generateBarChartData и сортируем по году и месяцу
    const items = Object.entries(groupedByYearMonth)
      .map(([key, count]) => {
        const [year, month] = key.split('-').map(Number);
        return { year, month, count };
      })
      .sort((a, b) => {
        // Сортируем сначала по году, затем по месяцу
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.month - b.month;
      });

    // Вычисляем pagesReadPerMonth (текущий месяц)
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const pagesReadPerMonth = groupedByYearMonth[currentMonthKey] || 0;

    // Вычисляем pagesReadPerYear (текущий год)
    const pagesReadPerYear = Object.entries(groupedByYearMonth)
      .filter(([key]) => key.startsWith(`${currentYear}-`))
      .reduce((sum, [, count]) => sum + count, 0);

    // eslint-disable-next-line no-console
    console.log(`📊 [getGoalItemsByYear] Сгруппировано по годам/месяцам: ${items.length} записей, всего goal items: ${allItems.length}`);

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
