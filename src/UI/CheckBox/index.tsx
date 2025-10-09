import React, { FC, memo } from 'react';
import { CHECKBOX_ICON } from '~constants/dimensions';
import CheckBoxChecked from '~assets/checkbox-checked.svg';
import CheckBoxBlank from '~assets/checkbox-blank.svg';
import CheckBoxIntdeterminate from '~assets/checkbox-indeterminate.svg';
import colors from '~styles/colors';

export type Props = {
  isChecked?: boolean;
  indeterminate?: boolean;
};

const CheckBox: FC<Props> = ({ isChecked, indeterminate }) => {
  if (indeterminate) {
    return <CheckBoxIntdeterminate width={CHECKBOX_ICON.width} height={CHECKBOX_ICON.height} fill={colors.neutral_light} />;
  }
  return isChecked ? (
    <CheckBoxChecked width={CHECKBOX_ICON.width} height={CHECKBOX_ICON.height} fill={colors.neutral_light} />
  ) : (
    <CheckBoxBlank width={CHECKBOX_ICON.width} height={CHECKBOX_ICON.height} fill={colors.neutral_light} />
  );
};

export default memo(CheckBox);
