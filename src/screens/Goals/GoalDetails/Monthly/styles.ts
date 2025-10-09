import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    backgroundColor: colors.primary_dark,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  title: {
    marginBottom: 10,
    fontSize: 20,
    color: colors.neutral_light,
  },
  topBlock: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  info: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: colors.neutral_medium,
  },
  blockLeft: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  completed: {
    color: colors.completed,
  },
  goal: {
    color: colors.gold,
  },
  goalWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  blockRight: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  blockText: {
    fontSize: 28,
    fontWeight: 600,
    color: colors.neutral_light,
  },
  progressBarWrapper: {
    position: 'relative',
    width: '100%',
    height: 34,
    borderColor: colors.neutral_medium,
    borderWidth: 2,
  },
  progressBar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '40%',
    backgroundColor: colors.completed,
    height: '100%',
  },
  progressBarLabelWrapper: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  progressBarLabel: {
    fontSize: 18,
    fontWeight: 600,
    color: colors.neutral_light,
  },
  actionWrapper: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pagesCountDescription: {
    marginTop: 10,
    fontSize: 16,
    color: colors.neutral_light,
  },
  inputWrapper: {
    height: 90,
    flex: 1,
    marginRight: 10,
  },
  inputError: {
    height: 40,
  },
  button: {
    width: 140,
  },
  statButton: {
    marginVertical: 10,
    width: 120,
    height: 40,
  },
  stickyHeader: {
    marginVertical: 10,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countItem: {
    color: colors.neutral_light,
    fontSize: 16,
  },
  headerTitle: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: colors.neutral_medium,
  },
  sectionedList: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopColor: colors.neutral_medium,
    borderTopWidth: 1,
    display: 'flex',
    flex: 2.4,
    paddingBottom: 10,
  },
  readingHistory: {
    display: 'flex',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.neutral_medium,
    borderRadius: 5,
    marginVertical: 5,
  },
  readingHistoryActive: {
    borderColor: colors.neutral_light,
  },
  nested: {
    marginLeft: 20,
    borderColor: colors.neutral_light,
  },
  readingHistoryItem: {
    fontSize: 16,
    color: colors.neutral_light,
  },
  countColumn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeIcon: {
    width: 20,
    height: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  starIcon: {
    marginRight: 5,
  },
  arrowIcon: {
    marginRight: 10,
  },
  collapsedIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  titleColumn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    color: colors.neutral_light,
  },
  listFooterComponent: {
    height: 80,
  },
});
