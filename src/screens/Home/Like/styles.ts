import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  votesWrapper: {
    height: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  lightColor: {
    color: colors.neutral_light,
  },
  votesCount: {
    marginLeft: 3,
  },
});
