import React, { memo, FC } from 'react';

import RadioButtonOff from '~assets/radio-button-off.svg';
import RadioButtonOn from '~assets/radio-button-on.svg';
import { RADIO_BUTTON_ICON } from '~constants/dimensions';
import { useThemeColors } from '~theme/hooks';

export type Props = {
  isSelected: boolean;
  style?: any;
  color?: string;
};

const RadioButton: FC<Props> = ({ isSelected, color, style }) => {
  const themeColors = useThemeColors();
  const fillColor = color || themeColors.neutral_light;
  return isSelected ? (
    <RadioButtonOn style={style} width={RADIO_BUTTON_ICON.width} height={RADIO_BUTTON_ICON.height} fill={fillColor} />
  ) : (
    <RadioButtonOff style={style} width={RADIO_BUTTON_ICON.width} height={RADIO_BUTTON_ICON.height} fill={fillColor} />
  );
};

export default memo(RadioButton);
