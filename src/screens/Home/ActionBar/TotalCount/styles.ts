import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    height: 20,
    backgroundColor: colors.primary_dark,
    paddingRight: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  label: {
    color: colors.neutral_medium,
  },
});
