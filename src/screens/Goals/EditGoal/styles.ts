import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      backgroundColor: colors.primary_dark,
      padding: 10,
    },
  content: {
    width: '100%',
    maxWidth: 800,
  },
  submitButtonWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
