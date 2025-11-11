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
    flex: 1,
    paddingHorizontal: 10,
  },
  subTitle: {
    fontSize: 22,
    color: colors.neutral_light,
    marginBottom: 10,
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
  },
  contentSpinnerWrapper: {
    width: '100%',
    minHeight: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedCovers: {
    marginVertical: 25,
  },
  deviceCoverWrapper: {
    flex: 1,
    marginVertical: 25,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coversScrollContent: {
    paddingRight: 10,
  },
  defaultCoverWrapper: {
    flex: 1,
    marginVertical: 25,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultCover: {
    padding: 10,
    marginHorizontal: 10,
    width: 180,
    height: 260,
    borderRadius: 5,
    borderWidth: 5,
    borderColor: colors.neutral_medium,
  },
  coverWrapper: {
    flex: 1,
    padding: 10,
    marginHorizontal: 10,
    width: 180,
    height: 260,
    borderRadius: 5,
    borderWidth: 5,
    borderColor: colors.neutral_medium,
  },
  selectedCoverRadioButton: {
    position: 'absolute',
    zIndex: 10,
    top: 5,
    right: 5,
  },
  suggestionLabel: {
    fontSize: 18,
    color: colors.neutral_light,
    marginBottom: 10,
    textAlign: 'center',
  },
  selectedCover: {
    borderColor: colors.success,
  },
  cover: {
    resizeMode: 'contain',
    width: '100%',
    height: '100%',
  },
  buttonsWrapper: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 5,
  },
  buttonTitle: {
    textAlign: 'center',
    fontSize: 14,
  },
  footerButtonsWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerButton: {
    maxWidth: 160,
    marginHorizontal: 10,
  },
  spinnerBottom: {
    width: '100%',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
