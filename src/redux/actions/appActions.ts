import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { AppThunkAPI, RootState } from '~redux/store/configureStore';
import { initDatabase, loadProfile, saveProfile } from '~utils/boardStorage';
import { clearHiddenBoards, loadHiddenBoards, saveHiddenBoards, loadBoardOrder, saveBoardOrder, clearBoardOrder } from '~utils/storage/boardPreferences';

const PREFIX = 'APP';

export const setHiddenBoards = createAction<string[]>(`${PREFIX}/setHiddenBoards`);
export const setBoardOrder = createAction<string[]>(`${PREFIX}/setBoardOrder`);

export const toggleBoardVisibility = createAsyncThunk<string[], string, { state: RootState }>(
  `${PREFIX}/toggleBoardVisibility`,
  async (boardKey, { getState }) => {
    const currentHiddenBoards = getState().app.hiddenBoards ?? [];
    const index = currentHiddenBoards.indexOf(boardKey);
    let newHiddenBoards: string[];
    if (index === -1) {
      newHiddenBoards = [...currentHiddenBoards, boardKey];
    } else {
      newHiddenBoards = currentHiddenBoards.filter((key) => key !== boardKey);
    }
    await saveHiddenBoards(newHiddenBoards);
    return newHiddenBoards;
  },
);

export const loadBoardSettings = createAsyncThunk(`${PREFIX}/loadBoardSettings`, async () => {
  const hiddenBoards = await loadHiddenBoards();
  const boardOrder = await loadBoardOrder();
  return { hiddenBoards, boardOrder };
});

export const resetBoardSettings = createAsyncThunk(`${PREFIX}/resetBoardSettings`, async () => {
  await clearHiddenBoards();
  await clearBoardOrder();
  return { hiddenBoards: [], boardOrder: [] };
});

export const updateBoardOrder = createAsyncThunk<string[], string[], { state: RootState }>(
  `${PREFIX}/updateBoardOrder`,
  async (boardOrder) => {
    await saveBoardOrder(boardOrder);
    return boardOrder;
  },
);

export const supportApp = createAsyncThunk(`${PREFIX}/supportApp`, async (confirmed: boolean, _thunkAPI: AppThunkAPI) => {
  try {
    await initDatabase();
    const profile = await loadProfile();
    const viewedAt = Date.now();

    if (profile) {
      await saveProfile({
        ...profile,
        supportApp: {
          confirmed,
          viewedAt,
        },
      });
    }
    return {
      confirmed,
      viewedAt,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});
