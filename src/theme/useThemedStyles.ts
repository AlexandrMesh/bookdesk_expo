import { useMemo } from 'react';

import { useThemeColors } from './hooks';
import { ThemeColors } from './types';

export const useThemedStyles = <T extends Record<string, unknown>>(styleFactory: (colors: ThemeColors) => T): T => {
  const colors = useThemeColors();
  return useMemo(() => styleFactory(colors), [colors]);
};

