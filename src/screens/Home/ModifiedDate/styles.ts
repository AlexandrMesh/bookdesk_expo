import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  addedWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    borderStyle: 'dotted',
    borderBottomWidth: 1,
    borderColor: colors.neutral_light,
  },
  lightColor: {
    color: colors.neutral_light,
  },
});
