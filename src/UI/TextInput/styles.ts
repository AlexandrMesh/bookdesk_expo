import { StyleSheet } from 'react-native';

import { ThemeColors, ThemeScheme } from '~theme/types';

export default (colors: ThemeColors, scheme?: ThemeScheme) =>
  StyleSheet.create({
    validateableWrapper: {
    height: 80,
  },
  wrapper: {
    height: 50,
  },
  input: {
    height: 50,
    borderWidth: 1,
    fontSize: 18,
    borderColor: scheme === 'light' ? '#60a5fa' : colors.neutral_medium,
    backgroundColor: colors.primary_dark,
    paddingHorizontal: 15,
    color: colors.neutral_light,
  },
  inputWithClearButton: {
    paddingRight: 50,
  },
  errorInput: {
    borderColor: colors.error,
  },
  errorWrapper: {
    height: 30,
  },
  errorText: {
    marginTop: 5,
    color: colors.error,
  },
  focusedInput: {
    borderColor: scheme === 'light' ? colors.primary_medium : colors.neutral_light,
    borderWidth: scheme === 'light' ? 2 : 1,
  },
  clearButtonWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
