import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: colors.primary_dark,
    },
    tabBarLabel: {
      fontWeight: 'bold',
      fontSize: 13,
      textTransform: 'uppercase',
    },
  });
