import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    paddingVertical: 10,
    height: '100%',
    width: '100%',
    display: 'flex',
    backgroundColor: colors.primary_dark,
  },
  successContainer: {
    backgroundColor: colors.primary_dark,
    flex: 1,
    padding: 20,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successHeader: {
    maxWidth: 300,
  },
  successTitle: {
    color: colors.success,
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 10,
  },
  successSubTitle: {
    color: colors.success,
    textAlign: 'center',
    fontSize: 20,
  },
  buttons: {
    marginTop: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
});
