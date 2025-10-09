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
    backgroundColor: colors.primary_dark,
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
  orWrapper: {
    marginVertical: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  neutralLight: {
    color: colors.neutral_light,
  },
  noAccountWrapper: {
    marginTop: 30,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: { width: 'auto', paddingHorizontal: 5, height: 26 },
  createTitleStyle: {
    fontSize: 14,
  },
  api: {
    fontSize: 30,
    color: '#fff',
  },
});
