import { ISupportApp } from '~types/app';

export interface IProfile {
  _id: string;
  email: string;
  registered: number | null;
  updated: number | null;
  supportApp: ISupportApp;
  syncWithLocalDatabaseCompleted?: boolean;
  syncDatabaseCompleted?: boolean;
  isNewUser?: boolean;
}

export interface IError {
  [x: string]: string;
}
