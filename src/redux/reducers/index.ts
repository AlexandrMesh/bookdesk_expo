import { combineReducers } from 'redux';

import app from './appReducer';
import auth from './authReducer';
import books from './booksReducer';
import customBook from './customBookReducer';
import goals from './goalsReducer';
import recommendations from './recommendationsReducer';
import statistic from './statisticReducer';
import theme from './themeReducer';

export default combineReducers({
  books,
  customBook,
  auth,
  app,
  goals,
  recommendations,
  statistic,
  theme,
});
