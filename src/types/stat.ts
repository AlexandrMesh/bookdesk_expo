import { StyleProp, ViewStyle } from 'react-native';

export interface IStatItem {
  labelTextStyle: StyleProp<ViewStyle>;
  value: number;
  isYear: boolean;
  frontColor: string;
  topLabelComponent: () => JSX.Element;
}

export interface IStat {
  data: IStatItem[];
  totalCount: number;
  averageReadingSpeed: number;
  maxValue: number;
}
