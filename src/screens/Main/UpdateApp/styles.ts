import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.primary_dark,
  },
  label: {
    fontSize: 18,
    color: colors.neutral_light,
  },
  button: {
    marginTop: 20,
    width: 260,
  },
});
