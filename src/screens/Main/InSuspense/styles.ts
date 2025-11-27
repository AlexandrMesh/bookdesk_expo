import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.primary_dark,
    },
  });
