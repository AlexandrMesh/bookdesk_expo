import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.primary_dark,
    },
    container: {
      flex: 1,
    },
    listFooterComponent: {
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerRefreshWrapper: {
      padding: 20,
      alignItems: 'center',
    },
    footerRefreshButton: {
      width: 'auto',
      alignSelf: 'center',
      paddingHorizontal: 24,
      paddingVertical: 10,
      height: 40,
      borderRadius: 20,
      minWidth: 160,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    emptyIconWrapper: {
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.neutral_light,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: colors.neutral_medium,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 25,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    errorText: {
      fontSize: 15,
      color: colors.error,
      textAlign: 'center',
      marginTop: 15,
      marginBottom: 20,
    },
    retryButton: {
      paddingHorizontal: 30,
      height: 45,
      borderRadius: 8,
      backgroundColor: colors.accent,
    },
    retryButtonTitle: {
      color: colors.neutral_white,
      fontSize: 15,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 30,
    },
    starsContainer: {
      width: 120,
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    starLoading: {
      position: 'absolute',
    },
    starLoading1: {
      top: 0,
      left: '50%',
      marginLeft: -14,
    },
    starLoading2: {
      top: 20,
      right: 5,
    },
    starLoading3: {
      top: 25,
      left: 5,
    },
    starLoading4: {
      bottom: 5,
      right: 20,
    },
    starLoading5: {
      bottom: 0,
      left: 25,
    },
    // Keep old styles for backwards compatibility
    aiIconContainer: {
      width: 120,
      height: 120,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    star: {
      position: 'absolute',
    },
    star1: {
      top: 5,
      right: 15,
    },
    star2: {
      top: 25,
      left: 10,
    },
    star3: {
      bottom: 20,
      right: 10,
    },
    star4: {
      bottom: 10,
      left: 20,
    },
    loadingText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.neutral_light,
      textAlign: 'center',
    },
    loadingSubtext: {
      marginTop: 10,
      fontSize: 14,
      color: colors.neutral_medium,
      textAlign: 'center',
    },
    headerWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: colors.primary_darkest,
      borderBottomWidth: 1,
      borderBottomColor: colors.neutral_medium,
    },
    headerTitle: {
      fontSize: 14,
      color: colors.neutral_medium,
      marginLeft: 8,
      flex: 1,
    },
    refreshButton: {
      padding: 5,
    },
  });
