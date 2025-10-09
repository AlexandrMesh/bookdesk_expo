import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  emptyItem: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 15,
    backgroundColor: colors.primary_dark,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    borderColor: colors.neutral_medium,
    marginBottom: 1,
  },
  leftSide: {
    width: 126,
  },
  img: {
    width: 120,
    height: 170,
    opacity: 0.5,
    backgroundColor: colors.neutral_medium,
  },
  rightSide: {
    display: 'flex',
    marginLeft: 15,
    flex: 1,
  },
  title: {
    width: 200,
    height: 26,
    opacity: 0.5,
    backgroundColor: colors.neutral_medium,
  },
  item: {
    marginTop: 10,
    width: 180,
    height: 20,
    opacity: 0.5,
    backgroundColor: colors.neutral_medium,
  },
});
