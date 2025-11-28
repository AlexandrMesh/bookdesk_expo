import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      position: 'relative',
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary_dark,
    },
    archiveIconWrapper: {
      flexDirection: 'row',
      display: 'flex',
      justifyContent: 'center',
    },
    label: {
      fontSize: 18,
      color: colors.neutral_light,
    },
  });
