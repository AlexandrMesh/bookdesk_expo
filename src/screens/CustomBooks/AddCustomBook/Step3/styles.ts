import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
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
      maxWidth: 220,
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
    addAuthorButtonTitle: {
      fontSize: 16,
    },
  });
