import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    maxWidth: 400,
    marginTop: 10,
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  bookNameInputWrapper: {
    flex: 2,
  },
  bookNameInputWithErrorWrapper: {
    height: 90,
  },
  errorWrapperClassName: {
    height: 40,
  },
  addButton: {
    marginLeft: 10,
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  bookListWrapper: {
    flex: 1,
    marginVertical: 10,
  },
  title: {
    color: colors.neutral_light,
    textAlign: 'center',
    fontSize: 24,
  },
  suggestionLabel: {
    color: colors.neutral_light,
    marginBottom: 10,
    textAlign: 'center',
  },
  successLabel: {
    color: colors.success,
  },
  nextButtonWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    maxWidth: 200,
  },
});
