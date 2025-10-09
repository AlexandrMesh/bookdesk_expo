import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
    padding: 10,
    backgroundColor: '#09172a',
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  marginBottom: {
    marginBottom: 5,
  },
  formWrapper: {
    paddingHorizontal: 40,
  },
  neutralLight: {
    color: colors.neutral_light,
  },
  existingAccountWrapper: {
    marginTop: 30,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  existingAccountContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
  },
  loginButton: { width: 'auto', paddingHorizontal: 5, height: 26 },
  loginTitleStyle: {
    fontSize: 14,
  },
});
