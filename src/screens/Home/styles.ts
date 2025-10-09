import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: colors.primary_dark,
  },
  tabBarLabel: {
    fontWeight: 'bold',
    fontSize: 15,
    textTransform: 'uppercase',
  },
});
