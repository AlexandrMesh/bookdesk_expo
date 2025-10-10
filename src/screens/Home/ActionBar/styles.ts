import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    paddingLeft: 10,
    backgroundColor: colors.primary_dark,
  },
  container: {
    height: 40,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightSide: {
    paddingRight: 6,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: { width: 'auto', paddingHorizontal: 5, height: 26 },
  titleStyle: {
    fontSize: 14,
  },
  icon: {
    marginRight: 5,
  },
  title: { marginLeft: 5, color: colors.neutral_light },
  searchIconWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});
