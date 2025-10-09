import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  logoWrapper: {
    marginBottom: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    marginTop: 10,
    fontSize: 34,
    color: colors.neutral_light,
  },
  subTitle: {
    marginTop: 5,
    fontSize: 18,
    color: colors.neutral_light,
  },
});
