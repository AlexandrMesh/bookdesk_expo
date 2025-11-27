import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.primary_dark,
      width: 32,
      paddingVertical: 1,
      borderRadius: 5,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      color: colors.neutral_light,
      fontSize: 15,
      fontWeight: 'bold',
    },
  });
