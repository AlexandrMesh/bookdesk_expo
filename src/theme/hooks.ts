import { useMemo } from 'react';

import { useAppSelector } from '~hooks';
import { selectThemeColors } from '~redux/selectors/theme';

export const useThemeColors = () => {
  const colors = useAppSelector(selectThemeColors);
  return useMemo(() => colors, [colors]);
};

