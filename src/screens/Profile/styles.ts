import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: colors.primary_dark,
  },
  profile: {
    display: 'flex',
    justifyContent: 'flex-start',
  },
  label: {
    fontSize: 18,
    color: colors.neutral_medium,
  },
  value: {
    fontSize: 18,
    color: colors.neutral_light,
  },
  buttonsWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: 1,
  },
  buttons: {
    width: '50%',
  },
  marginBottom: {
    marginBottom: 15,
  },
  profileButton: {
    height: 40,
  },
  updateLabel: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.success,
    marginBottom: 10,
  },
  mTop: {
    marginTop: 10,
  },
  languageButton: {
    fontSize: 12,
    width: 110,
    height: 30,
  },
  titleStyle: {
    fontSize: 14,
  },
  profileButtonTitle: {
    fontSize: 16,
  },
});
