import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      padding: 10,
      flex: 1,
      width: '100%',
      backgroundColor: colors.primary_dark,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    noNoteWrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    noNoteLabel: {
      marginRight: 15,
    },
    bookHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    coverThumb: {
      width: 56,
      height: 80,
      borderRadius: 6,
      marginRight: 12,
      backgroundColor: colors.neutral_medium,
      overflow: 'hidden',
    },
    coverPlaceholder: {
      borderWidth: 1,
      borderColor: colors.neutral_medium,
    },
    bookTitleWrapper: {
      flex: 1,
      backgroundColor: colors.primary_darkest,
      borderRadius: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    added: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    lightColor: {
      color: colors.neutral_light,
    },
    mediumColor: {
      color: colors.neutral_medium,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
    },
    info: {
      backgroundColor: colors.primary_darkest,
      padding: 10,
      borderRadius: 6,
    },
    content: {
      fontSize: 17,
      lineHeight: 23,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editIcon: {
      marginRight: 10,
      borderRadius: 16,
      padding: 6,
    },
    deleteIcon: {
      borderRadius: 16,
      padding: 6,
    },
    commentWrapperClassName: {
      marginTop: 10,
      height: undefined,
      marginBottom: 0,
    },
    commentInput: {
      height: 150,
      textAlignVertical: 'top',
    },
    primaryButton: {
      width: 140,
      height: 40,
      marginRight: 10,
    },
    cancelButton: {
      width: 100,
      height: 40,
      marginRight: 10,
    },
    editActions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 6,
      marginTop: 2,
    },
    symbolsWrapper: {
      alignItems: 'flex-end',
    },
    subTitle: {
      fontSize: 16,
      color: colors.neutral_light,
    },
    errorWrapper: {
      minHeight: 20,
      marginBottom: 2,
      marginTop: 2,
      justifyContent: 'flex-start',
    },
  });
