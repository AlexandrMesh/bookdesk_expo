import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.primary_dark,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 80,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
