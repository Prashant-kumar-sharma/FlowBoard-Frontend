import { createAction, props } from '@ngrx/store';

// Clear Board (reset state when leaving)
export const clearBoard = createAction('[Board] Clear Board');

// Load Board
export const loadBoard = createAction(
  '[Board] Load Board',
  props<{ boardId: number }>()
);

export const loadBoardSuccess = createAction(
  '[Board] Load Board Success',
  props<{ board: any; lists: any[]; cards: any[] }>()
);

export const loadBoardFailure = createAction(
  '[Board] Load Board Failure',
  props<{ error: any }>()
);

// Card Actions
export const addCard = createAction(
  '[Board] Add Card',
  props<{ card: any }>()
);

export const updateCard = createAction(
  '[Board] Update Card',
  props<{ card: any }>()
);

export const moveCard = createAction(
  '[Board] Move Card',
  props<{ cardId: number; fromListId: number; toListId: number; position: number }>()
);

export const moveCardSuccess = createAction(
  '[Board] Move Card Success',
  props<{ card: any }>()
);

export const archiveCard = createAction(
  '[Board] Archive Card',
  props<{ cardId: number }>()
);

// List Actions
export const addList = createAction(
  '[Board] Add List',
  props<{ list: any }>()
);

export const updateList = createAction(
  '[Board] Update List',
  props<{ list: any }>()
);

// WebSocket
export const webSocketCardMoved = createAction(
  '[Board] WS Card Moved',
  props<{ cardId: number; toListId: number }>()
);

export const webSocketCommentAdded = createAction(
  '[Board] WS Comment Added',
  props<{ cardId: number }>()
);
