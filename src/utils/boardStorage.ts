/**
 * Индексный файл для работы с локальной базой данных
 * Все функции реэкспортируются из соответствующих модулей
 */

// Инициализация БД
export { initDatabase } from './database/database';

// Данные досок
export {
  saveBoardData,
  loadBoardData,
  loadAllBoardData,
  searchBooksInCache,
  clearBoardData,
  clearAllBoardData,
  getLastTimestamp,
  updateBookInCache,
  addBookToCache,
  updateBookVotesInCache,
  updateBookStatusInCache,
  removeBookFromCache,
} from './database/boardData';

// Даты книг
export { saveBookDate, saveBookStatus, loadBookDates, applyBookDatesToData, updateBookDateInCache } from './database/bookDates';

// Рейтинги
export { saveBookRating, loadBookRatings, deleteBookRating } from './database/bookRatings';

// Голоса
export { saveBookVotesCount, saveUserVotes, loadUserVotes } from './database/bookVotes';

// Заметки
export { saveBookNote, loadBookNotes, deleteBookNote } from './database/bookNotes';

// Цели
export { saveGoalItem, saveGoalItems, loadGoalItems, deleteGoalItem, saveGoal, loadGoal, deleteGoal } from './database/goals';

// Профиль
export { saveProfile, loadProfile, deleteProfile } from './database/profile';

// Статистика
export { getBooksByYear, getGoalItemsByYear } from './database/statistics';

// Категории
export { saveCategories, loadCategories } from './database/categories';

// Сброс данных
export { resetAllDatabaseData } from './database/database';

// Типы
export type { BoardData } from './database/types';
