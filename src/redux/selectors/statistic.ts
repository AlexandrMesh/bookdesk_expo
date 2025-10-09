import { RootState } from '~redux/store/configureStore';

type StateWithStatistic = Pick<RootState, 'statistic'>;

const getStatistic = (state: StateWithStatistic) => state.statistic;

export const getShouldReloadStat = (state) => getStatistic(state).shouldReloadStat;
