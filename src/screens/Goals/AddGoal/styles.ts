import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    height: '100%',
    width: '100%',
    display: 'flex',
    backgroundColor: colors.primary_dark,
  },
  content: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttons: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  button: {
    maxWidth: 260,
  },
  inputWrapper: {
    marginTop: 15,
  },
  text: {
    marginBottom: 10,
    fontSize: 17,
    color: colors.neutral_light,
    fontWeight: 'bold',
  },
  radioButtonWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioButtonLabel: {
    color: colors.neutral_light,
    fontSize: 15,
    marginLeft: 5,
  },
});
