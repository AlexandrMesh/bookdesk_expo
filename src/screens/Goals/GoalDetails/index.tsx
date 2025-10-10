import React from 'react';

import { DAILY, MONTHLY } from '~constants/goals';
import { useAppSelector } from '~hooks';
import { getGoalType } from '~redux/selectors/goals';

import Daily from './Daily';
import Monthly from './Monthly';

const GoalDetails = () => {
  const goalType = useAppSelector(getGoalType);

  const renderComponent = () => {
    if (goalType === DAILY) {
      return <Daily />;
    }
    if (goalType === MONTHLY) {
      return <Monthly />;
    }
  };

  return renderComponent();
};

export default GoalDetails;
