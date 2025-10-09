import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    height: 50,
    borderRadius: 5,
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.neutral_light,
    fontSize: 20,
  },
  icon: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 15,
  },
  iconRight: {
    marginLeft: 15,
  },
  primary: {
    backgroundColor: colors.primary_medium,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.neutral_light,
    backgroundColor: colors.primary_dark,
  },
  disabled: {
    opacity: 0.5,
  },
});
