import { DAILY, MONTHLY } from '~constants/goals';

export type GoalType = typeof DAILY | typeof MONTHLY;

export interface IGoal {
  _id: string;
  added_at: number;
  pages: number;
  type: GoalType;
}
