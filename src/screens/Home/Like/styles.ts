import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    votesWrapper: {
      height: 30,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      backgroundColor: colors.primary_darkest,
      borderRadius: 4,
    },
    lightColor: {
      color: colors.neutral_light,
    },
    votesCount: {
      marginLeft: 3,
    },
  });
