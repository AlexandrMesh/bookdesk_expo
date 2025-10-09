import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    borderColor: colors.neutral_medium,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
