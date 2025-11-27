import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wraper: {
      display: 'flex',
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    noteWrapper: {
      marginTop: 5,
      display: 'flex',
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    info: {
      display: 'flex',
      width: '100%',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginTop: 10,
      backgroundColor: colors.primary_darkest,
      padding: 10,
      borderRadius: 4,
    },
    lightColor: {
      color: colors.neutral_light,
    },
    mediumColor: {
      color: colors.neutral_medium,
    },
    item: {
      fontSize: 14,
    },
    bold: {
      fontWeight: 600,
    },
    italic: {
      fontStyle: 'italic',
    },
    textWrapper: {
      maxWidth: '90%',
    },
    arrowWrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: 26,
    },
    arrowIcon: {
      transform: [{ rotate: '-90deg' }],
    },
  });
