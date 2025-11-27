import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (_colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    inline: {
      position: 'relative',
      width: 'auto',
      height: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    label: {
      marginTop: 10,
      fontSize: 18,
    },
  });
