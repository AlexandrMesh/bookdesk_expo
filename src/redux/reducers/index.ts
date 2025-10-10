import { combineReducers } from 'redux';

import app from './appReducer';
import auth from './authReducer';
import books from './booksReducer';
import customBook from './customBookReducer';
import goals from './goalsReducer';
import statistic from './statisticReducer';

export default combineReducers({
  books,
  customBook,
  auth,
  app,
  goals,
  statistic,
});
