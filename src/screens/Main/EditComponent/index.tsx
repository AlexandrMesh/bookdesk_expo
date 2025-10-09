import React from 'react';
import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { EDIT_GOAL } from '~constants/routes';
import { getGoalNumberOfPages } from '~redux/selectors/goals';
import colors from '~styles/colors';
import EditIcon from '~assets/edit.svg';
import styles from './styles';

const EditComponent = () => {
  const hasGoal = useSelector(getGoalNumberOfPages);
  const navigation = useNavigation<any>();

  const handleGoToEditGoal = () => {
    if (hasGoal) {
      navigation.navigate(EDIT_GOAL);
    }
  };

  return (
    <Pressable style={styles.wrapper} onPress={handleGoToEditGoal}>
      <EditIcon width={32} height={32} stroke={colors.neutral_medium} />
    </Pressable>
  );
};

export default EditComponent;
