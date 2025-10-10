import React, { memo, FC } from 'react';

import RadioButtonOff from '~assets/radio-button-off.svg';
import RadioButtonOn from '~assets/radio-button-on.svg';
import { RADIO_BUTTON_ICON } from '~constants/dimensions';
import colors from '~styles/colors';

export type Props = {
  isSelected: boolean;
  style?: any;
  color?: string;
};

const RadioButton: FC<Props> = ({ isSelected, color, style }) =>
  isSelected ? (
    <RadioButtonOn style={style} width={RADIO_BUTTON_ICON.width} height={RADIO_BUTTON_ICON.height} fill={color || colors.neutral_light} />
  ) : (
    <RadioButtonOff style={style} width={RADIO_BUTTON_ICON.width} height={RADIO_BUTTON_ICON.height} fill={color || colors.neutral_light} />
  );

export default memo(RadioButton);
