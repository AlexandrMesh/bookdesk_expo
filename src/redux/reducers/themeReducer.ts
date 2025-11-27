import { createReducer } from '@reduxjs/toolkit';

import { setSystemTheme, setThemeMode } from '~redux/actions/themeActions';
import { ThemeMode, ThemeScheme, ThemeState } from '~theme/types';

const getSystemDefaultMode = (): ThemeScheme => {
  return 'light';
};

const defaultState: ThemeState = {
  mode: 'auto',
  systemScheme: getSystemDefaultMode(),
};

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(setThemeMode, (state, { payload }) => {
      state.mode = payload;
    })
    .addCase(setSystemTheme, (state, { payload }) => {
      state.systemScheme = payload;
    });
});

