import { FAILED, IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';

export type LoadingType = typeof IDLE | typeof PENDING | typeof SUCCEEDED | typeof FAILED;
