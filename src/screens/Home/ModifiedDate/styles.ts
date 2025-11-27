import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    addedWrapper: {
      display: 'flex',
      flexWrap: 'wrap',
      borderStyle: 'dotted',
      borderBottomWidth: 1,
      borderColor: colors.neutral_light,
    },
    lightColor: {
      color: colors.neutral_light,
    },
  });
