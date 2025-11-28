import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.primary_dark,
      position: 'relative',
      paddingTop: 15,
      paddingHorizontal: 5,
    },
  });
