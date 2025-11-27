import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      height: 20,
      backgroundColor: colors.neutral_medium,
      paddingRight: 10,
      paddingLeft: 8,
      borderRadius: 4,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    label: {
      color: colors.neutral_white,
      fontSize: 12,
    },
  });
