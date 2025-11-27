import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: colors.primary_dark,
  },
  editThumbWrapper: {
    marginTop: 6,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  editThumbCover: {
    padding: 6,
    width: 140,
    height: 200,
    borderRadius: 5,
    borderWidth: 3,
    borderColor: colors.neutral_medium,
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary_medium,
  },
  editChangeButton: {
    width: 110,
    height: 36,
    marginTop: 10,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary_medium,
  },
  modalHeader: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  modalHeaderTitle: {
    fontSize: 20,
    color: colors.neutral_light,
  },
  container: {
    paddingHorizontal: 10,
    maxWidth: 400,
    marginTop: 10,
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
  },
  inputWrapper: {
    flex: 1,
  },
  blockWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBlockWrapper: {
    display: 'flex',
    justifyContent: 'center',
    height: 48,
    paddingLeft: 10,
    paddingRight: 5,
    borderWidth: 1,
    borderColor: colors.neutral_medium,
    borderRightWidth: 0,
    flex: 2,
  },
  activeInputWrapper: {
    borderColor: colors.neutral_light,
  },
  inputLabel: {
    color: colors.neutral_medium,
    fontSize: 18,
  },
  activeInputLabel: {
    color: colors.neutral_light,
  },
  mainButton: {
    flex: 1,
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  },
  subTitle: {
    fontSize: 18,
    color: colors.neutral_light,
    marginBottom: 10,
  },
  contentWrapper: {
    flex: 1,
  },
  suggestedCovers: {
    marginVertical: 25,
  },
  block: {
    marginBottom: 20,
  },
  buttonsWrapper: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addAuthorButton: {
    marginTop: 10,
    height: 36,
    maxWidth: 180,
  },
  authorsNameInputWrapper: {
    flex: 1,
  },
  authorWrapper: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  removeAuthorButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
    backgroundColor: colors.primary_medium,
  },
  button: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 5,
  },
  annotationWrapperClassName: {
    height: 230,
  },
  annotationInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  tip: {
    paddingVertical: 5,
    fontSize: 18,
    color: colors.neutral_medium,
  },
  annotationLabelWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerContainer: {
    paddingTop: 10,
  },
  footerButtonsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingVertical: 10,
    width: '100%',
  },
  footerButton: {
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 10,
    height: 44,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  contentSpinnerWrapper: {
    width: '100%',
    minHeight: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  buttonTitle: {
    textAlign: 'center',
    fontSize: 14,
  },
  footerButtonTitle: {
    fontSize: 16,
  },
});
