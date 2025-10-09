import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  emptyItem: {
    height: 260,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: colors.primary_dark,
  },
  item: {
    width: 126,
    height: 180,
    opacity: 0.5,
    margin: 10,
    backgroundColor: colors.neutral_medium,
  },
});
