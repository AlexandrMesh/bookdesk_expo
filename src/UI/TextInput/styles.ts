import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
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
    borderColor: colors.neutral_medium,
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
    borderColor: colors.neutral_light,
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
