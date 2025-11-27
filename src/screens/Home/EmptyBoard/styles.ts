import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primary_dark,
    },
    content: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonWrapper: {
      width: '100%',
      marginTop: 10,
    },
    addButton: {
      paddingHorizontal: 15,
    },
    text: {
      fontSize: 18,
      marginBottom: 15,
      color: colors.neutral_light,
    },
  });
