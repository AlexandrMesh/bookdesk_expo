import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      height: '100%',
      width: '100%',
      display: 'flex',
      padding: 15,
      backgroundColor: colors.primary_dark,
    },
    spinnerWrapper: {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      fontSize: 17,
      color: colors.neutral_medium,
    },
    value: {
      fontSize: 17,
      color: colors.neutral_light,
    },
    supportButton: {
      paddingHorizontal: 5,
      fontSize: 12,
      width: 110,
      height: 30,
    },
    titleStyle: {
      fontSize: 14,
    },
  });
