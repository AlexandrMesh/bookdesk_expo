import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    backgroundColor: colors.primary_dark,
    width: 32,
    paddingVertical: 1,
    borderRadius: 5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: colors.neutral_light,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
