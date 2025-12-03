import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      padding: 15,
      borderWidth: 1,
      borderTopWidth: 0,
      borderTopColor: 'transparent',
      borderColor: colors.neutral_medium,
    },
    bookItem: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    leftSide: {
      width: 126,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    rightSide: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginLeft: 15,
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
    },
    coverWrapper: {
      marginBottom: 10,
    },
    coverPressable: {
      position: 'relative',
    },
    cover: {
      width: 126,
      height: 180,
      borderRadius: 4,
    },
    zoomIconContainer: {
      position: 'absolute',
      bottom: 5,
      right: 5,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 12,
      padding: 4,
    },
    coverPlaceholder: {
      width: 126,
      height: 180,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    coverPlaceholderText: {
      fontSize: 12,
      textAlign: 'center',
      paddingHorizontal: 10,
      marginTop: 5,
    },
    info: {
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginTop: 10,
      backgroundColor: colors.primary_darkest,
      padding: 10,
      borderRadius: 4,
      width: '100%',
    },
    genreBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: colors.neutral_medium,
    },
    genreText: {
      fontSize: 12,
    },
    pagesBlock: {
      marginTop: 8,
    },
    item: {
      fontSize: 15,
      marginTop: 2,
    },
    lightColor: {
      color: colors.neutral_light,
    },
    mediumColor: {
      color: colors.neutral_medium,
    },
    buttonWrapper: {
      width: '100%',
    },
    dropdownWrapper: {
      width: 126,
      height: 30,
      borderRadius: 4,
    },
    dropdownLabel: {
      fontSize: 14,
    },
    statusButton: {
      width: 126,
      height: 30,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    statusButtonText: {
      color: colors.neutral_white,
      fontSize: 14,
      fontWeight: '500',
    },
  });
