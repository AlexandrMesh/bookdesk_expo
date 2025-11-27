import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      backgroundColor: 'black',
      opacity: 0.5,
      width: '100%',
      height: '100%',
    },
    dropdown: {
      position: 'absolute',
      width: 200,
      backgroundColor: colors.primary_dark,
      borderWidth: 1,
      borderColor: colors.neutral_medium,
      shadowColor: colors.neutral_light,
      shadowOffset: { width: -2, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 3,
    },
    dropdownButtonStyle: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 10,
      marginTop: 10,
      width: 126,
      height: 30,
      borderWidth: 1,
      borderColor: colors.neutral_light,
      borderRadius: 5,
    },
    status: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdownButtonLabelStyle: {
      fontSize: 15,
      marginRight: 5,
      color: colors.neutral_light,
    },
    dropdownItemStyle: {
      width: '100%',
      height: 40,
      flexDirection: 'row',
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: colors.neutral_medium,
    },
    dropdownItemTextStyle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '500',
      color: colors.neutral_light,
    },
    icon: {
      fill: colors.neutral_light,
    },
  });
