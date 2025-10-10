import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  emptyWrapper: {
    width: '100%',
    height: '100%',
    padding: 15,
    display: 'flex',
    justifyContent: 'flex-start',
    backgroundColor: colors.primary_dark,
  },
  img: {
    width: 260,
    height: 395,
    opacity: 0.5,
    backgroundColor: colors.neutral_medium,
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 10,
    width: 300,
    height: 26,
    opacity: 0.5,
    backgroundColor: colors.neutral_medium,
  },
  author: {
    marginTop: 10,
    width: 150,
    height: 22,
    opacity: 0.5,
    backgroundColor: colors.neutral_medium,
  },
  footer: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  description: {
    marginTop: 15,
    width: '100%',
    height: 24,
    opacity: 0.5,
    backgroundColor: colors.neutral_medium,
  },
});
