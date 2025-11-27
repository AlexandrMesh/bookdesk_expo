import { createSelector } from 'reselect';

import { RootState } from '~redux/store/configureStore';
import { lightPalette, darkPalette } from '~theme/palettes';
import { ThemeColors, ThemeMode, ThemeScheme } from '~theme/types';

const getThemeState = (state: RootState) => state.theme;

export const getThemeMode = (state: RootState): ThemeMode => getThemeState(state).mode;
export const getSystemTheme = (state: RootState): ThemeScheme => getThemeState(state).systemScheme;

export const selectThemeScheme = createSelector([getThemeMode, getSystemTheme], (mode, system) =>
  mode === 'auto' ? system : mode,
) as (state: RootState) => ThemeScheme;

export const selectThemeColors = createSelector([selectThemeScheme], (scheme): ThemeColors =>
  scheme === 'dark' ? darkPalette : lightPalette,
);

