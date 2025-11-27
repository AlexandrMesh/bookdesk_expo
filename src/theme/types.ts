export type ThemeMode = 'auto' | 'light' | 'dark';
export type ThemeScheme = 'light' | 'dark';

export interface ThemeColors {
  primary_dark: string;
  primary_darkest: string;
  primary_medium: string;
  neutral_white: string;
  neutral_black: string;
  neutral_light: string;
  neutral_medium: string;
  in_progress: string;
  planned: string;
  completed: string;
  gold: string;
  disabled: string;
  error: string;
  success: string;
}

export interface ThemeState {
  mode: ThemeMode;
  systemScheme: ThemeScheme;
}

