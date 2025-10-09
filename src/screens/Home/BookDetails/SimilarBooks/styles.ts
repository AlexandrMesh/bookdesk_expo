import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  listWrapper: {
    borderRadius: 4,
    marginVertical: 10,
    backgroundColor: colors.primary_darkest,
  },
  blockTitle: {
    padding: 10,
    fontSize: 18,
  },
  wrapper: {
    width: 126,
    margin: 10,
  },
  cover: {
    width: 126,
    height: 180,
  },
  titleWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
  },
  title: {
    fontSize: 15,
    textAlign: 'center',
  },
  lightColor: {
    color: colors.neutral_light,
  },
});
