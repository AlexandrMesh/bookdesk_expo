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
  hydrateBooksTableFromCache,
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
export {
  saveProfile,
  loadProfile,
  deleteProfile,
  hasUserProfile,
  saveGuestProfile,
  setSyncWithLocalDatabaseCompleted,
  setSyncDatabaseCompleted,
} from './database/profile';

// Статистика
export { getBooksByYear, getGoalItemsByYear } from './database/statistics';

// Категории
export { saveCategories, loadCategories, loadCategoriesFromJson, initializeCategoriesFromJson } from './database/categories';
export { loadCustomGenres, addCustomGenre, updateCustomGenre, deleteCustomGenre } from './database/customCategories';
export type { ICustomGenreRecord } from './database/customCategories';

// Сброс данных
export { resetAllDatabaseData } from './database/database';

// Типы
export type { BoardData } from './database/types';
