import React, { useEffect } from 'react';

import { Appearance } from 'react-native';

import { useAppDispatch, useAppSelector } from '~hooks';
import { loadBoardSettings } from '~redux/actions/appActions';
import { setSystemTheme, setThemeMode } from '~redux/actions/themeActions';
import { getThemeMode } from '~redux/selectors/theme';
import { loadThemeMode, saveThemeMode } from '~utils/storage/themePreferences';

interface Props {
  children: React.ReactNode;
}

const ThemeObserver: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(getThemeMode);

  useEffect(() => {
    const scheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
    dispatch(setSystemTheme(scheme));
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      dispatch(setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light'));
    });
    return () => listener.remove();
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      const storedMode = await loadThemeMode();
      if (storedMode) {
        dispatch(setThemeMode(storedMode));
      } else {
        saveThemeMode('auto');
      }
    })();
    dispatch(loadBoardSettings());
  }, [dispatch]);

  useEffect(() => {
    saveThemeMode(mode);
  }, [mode]);

  return <>{children}</>;
};

export default ThemeObserver;

