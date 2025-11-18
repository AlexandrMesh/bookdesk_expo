import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import sum from 'lodash/sum';
import { createSelector } from 'reselect';

import { RootState } from '~redux/store/configureStore';
import i18n from '~translations/i18n';

type StateWithGoals = Pick<RootState, 'goals'>;

const getGoals = (state: StateWithGoals) => state.goals;

export const getGoal = (state: StateWithGoals) => getGoals(state).goal;

export const getGoalsData = (state: StateWithGoals) => getGoal(state).data;
export const getGoalNumberOfPages = (state: StateWithGoals) => getGoal(state).numberOfPages;
export const getGoalType = (state: StateWithGoals) => getGoal(state).type;

export const deriveNumberOfPagesDoneToday = createSelector([getGoalsData], (pages) =>
  sum(pages.filter(({ added_at }) => new Date(added_at).toDateString() === new Date().toDateString()).map(({ pages }) => Number(pages))),
);

export const deriveNumberOfPagesDoneMonthly = createSelector([getGoalsData], (pages) =>
  sum(
    pages
      .filter(
        ({ added_at }) => new Date(added_at).getFullYear() === new Date().getFullYear() && new Date(added_at).getMonth() === new Date().getMonth(),
      )
      .map(({ pages }) => Number(pages)),
  ),
);

export const deriveTodayProgress = createSelector([getGoalNumberOfPages, deriveNumberOfPagesDoneToday], (goalNumberOfPages, numberOfPagesDoneToday) =>
  Math.round((numberOfPagesDoneToday / Number(goalNumberOfPages)) * 100),
);

export const deriveMonthlyProgress = createSelector(
  [getGoalNumberOfPages, deriveNumberOfPagesDoneMonthly],
  (goalNumberOfPages, numberOfPagesDoneMonthly) => Math.round((numberOfPagesDoneMonthly / Number(goalNumberOfPages)) * 100),
);

export const deriveSortedgetGoalsData = createSelector([getGoalsData], (data) => [...data].sort((a, b) => b.added_at - a.added_at));

export const deriveGoalsDataLength = createSelector([getGoalsData], (data) => data.length);

const getLimit = (_state: StateWithGoals, limit?: number) => (typeof limit === 'number' ? limit : null);

export const deriveSectionedPagesDone = createSelector([getGoalsData, getLimit], (pages, limit) => {
  const sortedPages = [...pages].sort((a, b) => Number(b.added_at) - Number(a.added_at));
  const limitedPages = typeof limit === 'number' ? sortedPages.slice(0, limit) : sortedPages;

  const pagesWithMonth = limitedPages.map((item) => ({
    ...item,
    monthAndYear: new Date(item?.added_at)?.toLocaleString(i18n.language, { month: 'long', year: 'numeric' }),
  }));

  return map(groupBy(pagesWithMonth, 'monthAndYear'), (value, key) => ({
    title: key,
    count: sum(value.map(({ pages }) => Number(pages))),
    data: map(
      groupBy(
        (value || []).map((item) => ({
          ...item,
          dayMonthAndYear: new Date(item?.added_at)?.toLocaleString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }),
        })),
        'dayMonthAndYear',
      ),
      (innerValue, innerKey) => ({
        title: innerKey,
        count: sum(innerValue.map(({ pages }) => Number(pages))),
        data: innerValue.sort((a, b) => Number(b.added_at) - Number(a.added_at)),
      }),
    ),
  }));
});
