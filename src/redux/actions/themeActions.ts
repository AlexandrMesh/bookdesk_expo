import { createAction } from '@reduxjs/toolkit';

import { ThemeMode, ThemeScheme } from '~theme/types';

const PREFIX = 'THEME';

export const setThemeMode = createAction<ThemeMode>(`${PREFIX}/setMode`);
export const setSystemTheme = createAction<ThemeScheme>(`${PREFIX}/setSystemTheme`);

