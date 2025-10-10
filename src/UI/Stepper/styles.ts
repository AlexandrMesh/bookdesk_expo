import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  stepper: {
    paddingHorizontal: 15,
    width: '100%',
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  line: {
    height: 2,
    flex: 1,
    width: '100%',
    backgroundColor: colors.neutral_medium,
  },
  activeLine: {
    backgroundColor: colors.neutral_light,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral_medium,
    width: 30,
    height: 30,
    borderRadius: 30,
  },
  currentStep: {
    width: 40,
    height: 40,
    backgroundColor: colors.neutral_light,
  },
  availableStep: {
    backgroundColor: colors.neutral_light,
  },
  label: {
    color: colors.neutral_light,
    fontWeight: 600,
    fontSize: 17,
  },
  currentLabel: {
    color: colors.primary_dark,
  },
  availableLabel: {
    color: colors.primary_dark,
  },
  component: {
    flex: 1,
    maxWidth: 400,
  },
  componentWrapper: {
    flex: 1,
    display: 'flex',
    width: '100%',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
