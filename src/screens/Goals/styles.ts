import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      height: '100%',
      width: '100%',
      display: 'flex',
      backgroundColor: colors.primary_dark,
    },
    buttons: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 15,
    },
    button: {
      maxWidth: 260,
    },
    text: {
      fontSize: 17,
      color: colors.neutral_light,
    },
  });
